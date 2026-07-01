import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay, subDays } from "date-fns";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { getLocalProductBom } from "@/lib/localInventoryStore";

const getProductCostPrice = (productId: string, directCost?: number | null) => {
  const bomItems = getLocalProductBom(productId);
  if (bomItems && bomItems.length > 0) {
    return bomItems.reduce((sum, item) => sum + ((item.material?.cost_price || 0) * item.quantity), 0);
  }
  return directCost || 0;
};

export interface DateRange {
  from: Date;
  to: Date;
}

export function useRevenueReport(dateRange: DateRange) {
  return useQuery({
    queryKey: ["revenue-report", dateRange.from, dateRange.to],
    queryFn: async () => {
      let orders: any[] = [];

      if (isLocalDemoAuthEnabled()) {
        const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
        const allOrders = rawOrders ? JSON.parse(rawOrders) : [];
        const rawChannels = localStorage.getItem("erp-mini-local-demo-sales-channels");
        const channels = rawChannels ? JSON.parse(rawChannels) : [];

        const startStr = dateRange.from.toISOString();
        const endStr = dateRange.to.toISOString();

        orders = allOrders
          .filter((o: any) => {
            const orderDate = o.order_date || o.created_at;
            return (
              orderDate >= startStr &&
              orderDate <= endStr &&
              ["delivered", "confirmed", "processing", "shipping"].includes(o.status)
            );
          })
          .map((o: any) => ({
            ...o,
            sales_channels: channels.find((c: any) => c.id === o.channel_id) || null,
          }));
      } else {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            order_items(*, products(*)),
            sales_channels(name, color)
          `)
          .gte("order_date", dateRange.from.toISOString())
          .lte("order_date", dateRange.to.toISOString())
          .in("status", ["delivered", "confirmed", "processing", "shipping"]);

        if (error) throw error;
        orders = data || [];
      }

      // Calculate totals
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalCOGS = orders.reduce((sum, o) => {
        return sum + (o.order_items?.reduce((itemSum: number, item: any) => {
          return itemSum + (getProductCostPrice(item.product_id, item.products?.cost_price) * item.quantity);
        }, 0) || 0);
      }, 0);
      const grossProfit = totalRevenue - totalCOGS;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      // Group by date
      const dailyData: Record<string, { revenue: number; orders: number; profit: number }> = {};
      orders.forEach((order) => {
        const dateDate = order.order_date || order.created_at;
        const date = format(new Date(dateDate), "dd/MM");
        if (!dailyData[date]) {
          dailyData[date] = { revenue: 0, orders: 0, profit: 0 };
        }
        dailyData[date].revenue += order.total || 0;
        dailyData[date].orders += 1;
        const orderCOGS = order.order_items?.reduce((sum: number, item: any) => {
          return sum + (getProductCostPrice(item.product_id, item.products?.cost_price) * item.quantity);
        }, 0) || 0;
        dailyData[date].profit += (order.total || 0) - orderCOGS;
      });

      // Group by channel
      const channelData: Record<string, { name: string; revenue: number; orders: number; color: string }> = {};
      orders.forEach((order) => {
        const channelName = order.sales_channels?.name || "Khác";
        const channelColor = order.sales_channels?.color || "#6B7280";
        if (!channelData[channelName]) {
          channelData[channelName] = { name: channelName, revenue: 0, orders: 0, color: channelColor };
        }
        channelData[channelName].revenue += order.total || 0;
        channelData[channelName].orders += 1;
      });

      return {
        totalRevenue,
        totalCOGS,
        grossProfit,
        profitMargin,
        orderCount: orders.length,
        dailyChart: Object.entries(dailyData).map(([date, data]) => ({
          date,
          ...data,
        })),
        channelChart: Object.values(channelData),
        orders,
      };
    },
  });
}

export function useProductReport(dateRange: DateRange) {
  return useQuery({
    queryKey: ["product-report", dateRange.from, dateRange.to],
    queryFn: async () => {
      let orderItems: any[] = [];

      if (isLocalDemoAuthEnabled()) {
        const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
        const allOrders = rawOrders ? JSON.parse(rawOrders) : [];
        const startStr = dateRange.from.toISOString();
        const endStr = dateRange.to.toISOString();

        const filteredOrders = allOrders.filter((o: any) => {
          const orderDate = o.order_date || o.created_at;
          return (
            orderDate >= startStr &&
            orderDate <= endStr &&
            ["delivered", "confirmed", "processing", "shipping"].includes(o.status)
          );
        });

        // Flatten order_items
        filteredOrders.forEach((o: any) => {
          if (o.order_items && Array.isArray(o.order_items)) {
            o.order_items.forEach((item: any) => {
              orderItems.push({
                ...item,
                orders: {
                  status: o.status,
                  order_date: o.order_date || o.created_at,
                },
              });
            });
          }
        });
      } else {
        const { data, error } = await supabase
          .from("order_items")
          .select(`
            *,
            products(*),
            orders!inner(status, order_date)
          `)
          .gte("orders.order_date", dateRange.from.toISOString())
          .lte("orders.order_date", dateRange.to.toISOString())
          .in("orders.status", ["delivered", "confirmed", "processing", "shipping"]);

        if (error) throw error;
        orderItems = data || [];
      }

      // Aggregate by product
      const productStats: Record<string, {
        id: string;
        name: string;
        sku: string;
        quantity: number;
        revenue: number;
        profit: number;
        cost: number;
      }> = {};

      orderItems.forEach((item) => {
        const productId = item.product_id;
        if (!productId) return;
        if (!productStats[productId]) {
          productStats[productId] = {
            id: productId,
            name: item.products?.name || "N/A",
            sku: item.products?.sku || "N/A",
            quantity: 0,
            revenue: 0,
            profit: 0,
            cost: 0,
          };
        }
        productStats[productId].quantity += item.quantity || 0;
        const itemTotal = item.total ?? ((item.quantity || 0) * (item.unit_price || 0) - (item.discount || 0));
        productStats[productId].revenue += itemTotal;
        const itemCost = getProductCostPrice(item.product_id, item.products?.cost_price) * (item.quantity || 0);
        productStats[productId].cost += itemCost;
        productStats[productId].profit += itemTotal - itemCost;
      });

      const products = Object.values(productStats);
      const topSelling = [...products].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
      const topRevenue = [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
      const topProfit = [...products].sort((a, b) => b.profit - a.profit).slice(0, 10);
      const slowMoving = [...products].sort((a, b) => a.quantity - b.quantity).slice(0, 10);

      return {
        totalProducts: products.length,
        totalQuantitySold: products.reduce((sum, p) => sum + p.quantity, 0),
        topSelling,
        topRevenue,
        topProfit,
        slowMoving,
      };
    },
  });
}

export function useInventoryReport() {
  return useQuery({
    queryKey: ["inventory-report"],
    queryFn: async () => {
      let products: any[] = [];
      let transactions: any[] = [];

      if (isLocalDemoAuthEnabled()) {
        const rawProducts = localStorage.getItem("erp-mini-local-demo-products");
        products = (rawProducts ? JSON.parse(rawProducts) : []).filter((p: any) => p.is_active !== false);

        const rawTx = localStorage.getItem("erp-mini-local-demo-inventory-transactions");
        const transactionsList = rawTx ? JSON.parse(rawTx) : [];

        const productMap = new Map(products.map((p: any) => [p.id, p]));
        transactions = transactionsList
          .filter((tx: any) => productMap.has(tx.product_id))
          .map((tx: any) => {
            const product = productMap.get(tx.product_id);
            return {
              ...tx,
              products: product
                ? {
                    name: product.name,
                    sku: product.sku,
                    company_id: product.company_id,
                  }
                : undefined,
            };
          })
          .slice(0, 100);
      } else {
        const { data: productsData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true);

        if (productError) throw productError;
        products = productsData || [];

        const { data: txData, error: txError } = await supabase
          .from("inventory_transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (txError) throw txError;
        transactions = txData || [];
      }

      const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
      const totalValue = products.reduce((sum, p) => sum + ((p.stock_quantity || 0) * getProductCostPrice(p.id, p.cost_price)), 0);
      const lowStock = products.filter((p) => (p.stock_quantity || 0) <= (p.min_stock || 0));
      const outOfStock = products.filter((p) => (p.stock_quantity || 0) === 0);

      return {
        totalProducts: products.length,
        totalStock,
        totalValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        lowStockProducts: lowStock,
        outOfStockProducts: outOfStock,
        recentTransactions: transactions,
      };
    },
  });
}

export function useOrderReport(dateRange: DateRange) {
  return useQuery({
    queryKey: ["order-report", dateRange.from, dateRange.to],
    queryFn: async () => {
      let orders: any[] = [];

      if (isLocalDemoAuthEnabled()) {
        const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
        const allOrders = rawOrders ? JSON.parse(rawOrders) : [];
        const startStr = dateRange.from.toISOString();
        const endStr = dateRange.to.toISOString();

        orders = allOrders.filter((o: any) => {
          const orderDate = o.order_date || o.created_at;
          return orderDate >= startStr && orderDate <= endStr;
        });
      } else {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .gte("order_date", dateRange.from.toISOString())
          .lte("order_date", dateRange.to.toISOString());

        if (error) throw error;
        orders = data || [];
      }

      const statusCounts: Record<string, number> = {};
      orders.forEach((order) => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      const totalOrders = orders.length;
      const deliveredOrders = statusCounts["delivered"] || 0;
      const cancelledOrders = statusCounts["cancelled"] || 0;
      const returnedOrders = statusCounts["returned"] || 0;

      const fulfillmentRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
      const cancelRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
      const returnRate = deliveredOrders > 0 ? (returnedOrders / deliveredOrders) * 100 : 0;

      return {
        totalOrders,
        statusCounts,
        fulfillmentRate,
        cancelRate,
        returnRate,
        avgOrderValue: totalOrders > 0 
          ? orders.reduce((sum, o) => sum + (o.total || 0), 0) / totalOrders 
          : 0,
      };
    },
  });
}

export function usePartnerReport(dateRange: DateRange) {
  return useQuery({
    queryKey: ["partner-report", dateRange.from, dateRange.to],
    queryFn: async () => {
      let partners: any[] = [];
      let orders: any[] = [];
      let payments: any[] = [];

      if (isLocalDemoAuthEnabled()) {
        const rawPartners = localStorage.getItem("erp-mini-local-demo-partners");
        partners = rawPartners ? JSON.parse(rawPartners) : [];

        const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
        const allOrders = rawOrders ? JSON.parse(rawOrders) : [];

        const rawPayments = localStorage.getItem("erp-mini-local-demo-payment-transactions");
        const allPayments = rawPayments ? JSON.parse(rawPayments) : [];

        const startStr = dateRange.from.toISOString();
        const endStr = dateRange.to.toISOString();

        const partnerMap = new Map(partners.map((p) => [p.id, p]));

        orders = allOrders
          .filter((o: any) => {
            const orderDate = o.order_date || o.created_at;
            return orderDate >= startStr && orderDate <= endStr && o.partner_id;
          })
          .map((o: any) => ({
            ...o,
            partners: partnerMap.get(o.partner_id) || null,
          }));

        payments = allPayments
          .filter((p: any) => {
            const txDate = p.transaction_date || p.created_at;
            return txDate >= startStr && txDate <= endStr;
          })
          .map((p: any) => ({
            ...p,
            partners: partnerMap.get(p.partner_id) || null,
          }));
      } else {
        // Fetch partners
        const { data: partnersData, error: partnerError } = await supabase
          .from("partners")
          .select("*");
        
        if (partnerError) throw partnerError;
        partners = partnersData || [];

        // Fetch orders within date range
        const { data: ordersData, error: orderError } = await supabase
          .from("orders")
          .select(`
            *,
            partners(id, name, code, partner_type)
          `)
          .gte("order_date", dateRange.from.toISOString())
          .lte("order_date", dateRange.to.toISOString())
          .not("partner_id", "is", null);

        if (orderError) throw orderError;
        orders = ordersData || [];

        // Fetch payment transactions
        const { data: paymentsData, error: paymentError } = await supabase
          .from("payment_transactions")
          .select(`
            *,
            partners(id, name, code, partner_type)
          `)
          .gte("transaction_date", dateRange.from.toISOString())
          .lte("transaction_date", dateRange.to.toISOString());

        if (paymentError) throw paymentError;
        payments = paymentsData || [];
      }

      // Aggregate customer stats
      const customerStats: Record<string, {
        id: string;
        name: string;
        code: string;
        orderCount: number;
        revenue: number;
        paidAmount: number;
        debt: number;
      }> = {};

      // Aggregate supplier stats
      const supplierStats: Record<string, {
        id: string;
        name: string;
        code: string;
        orderCount: number;
        purchaseAmount: number;
        paidAmount: number;
        debt: number;
      }> = {};

      // Process orders
      orders.forEach((order) => {
        if (!order.partner_id || !order.partners) return;
        const partner = order.partners;
        
        if (partner.partner_type === "customer" || partner.partner_type === "both") {
          if (!customerStats[partner.id]) {
            customerStats[partner.id] = {
              id: partner.id,
              name: partner.name,
              code: partner.code,
              orderCount: 0,
              revenue: 0,
              paidAmount: 0,
              debt: 0,
            };
          }
          customerStats[partner.id].orderCount += 1;
          customerStats[partner.id].revenue += order.total || 0;
          customerStats[partner.id].paidAmount += order.paid_amount || 0;
        }
      });

      // Process payments
      payments.forEach((payment) => {
        if (!payment.partner_id || !payment.partners) return;
        const partner = payment.partners;
        
        if (partner.partner_type === "customer" || partner.partner_type === "both") {
          if (customerStats[partner.id]) {
            if (
              payment.transaction_type === "receipt" ||
              payment.transaction_type === "payment_in" ||
              payment.transaction_type === "receivable"
            ) {
              customerStats[partner.id].paidAmount += payment.amount || 0;
            }
          }
        }
        
        if (partner.partner_type === "supplier" || partner.partner_type === "both") {
          if (!supplierStats[partner.id]) {
            supplierStats[partner.id] = {
              id: partner.id,
              name: partner.name,
              code: partner.code,
              orderCount: 0,
              purchaseAmount: 0,
              paidAmount: 0,
              debt: 0,
            };
          }
          if (
            payment.transaction_type === "payment" ||
            payment.transaction_type === "payment_out" ||
            payment.transaction_type === "payable"
          ) {
            supplierStats[partner.id].paidAmount += payment.amount || 0;
          }
        }
      });

      // Calculate debts
      Object.values(customerStats).forEach((stat) => {
        stat.debt = stat.revenue - stat.paidAmount;
      });

      // Get partner debt data
      partners.forEach((partner) => {
        if (partner.partner_type === "supplier" || partner.partner_type === "both") {
          if (!supplierStats[partner.id]) {
            supplierStats[partner.id] = {
              id: partner.id,
              name: partner.name,
              code: partner.code,
              orderCount: 0,
              purchaseAmount: 0,
              paidAmount: 0,
              debt: Number(partner.debt_amount) || 0,
            };
          } else {
            supplierStats[partner.id].debt = Number(partner.debt_amount) || 0;
          }
        }
      });

      const customerList = Object.values(customerStats);
      const supplierList = Object.values(supplierStats);

      const topCustomersByRevenue = [...customerList].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
      const topCustomersByOrders = [...customerList].sort((a, b) => b.orderCount - a.orderCount).slice(0, 10);
      const customersWithDebt = customerList.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt);
      const suppliersWithDebt = supplierList.filter(s => s.debt !== 0).sort((a, b) => Math.abs(b.debt) - Math.abs(a.debt));

      const customers = partners.filter(p => p.partner_type === "customer" || p.partner_type === "both");
      const suppliers = partners.filter(p => p.partner_type === "supplier" || p.partner_type === "both");

      return {
        totalCustomers: customers.length,
        totalSuppliers: suppliers.length,
        totalCustomerRevenue: customerList.reduce((sum, c) => sum + c.revenue, 0),
        totalCustomerDebt: customerList.reduce((sum, c) => sum + Math.max(0, c.debt), 0),
        totalSupplierDebt: supplierList.reduce((sum, s) => sum + s.debt, 0),
        topCustomersByRevenue,
        topCustomersByOrders,
        customersWithDebt,
        suppliersWithDebt,
        activeCustomers: customerList.filter(c => c.orderCount > 0).length,
      };
    },
  });
}
