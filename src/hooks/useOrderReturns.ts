import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useAuth } from "@/hooks/useAuth";
import { invalidateOrderRelated, invalidateWarehouseRelated } from "@/lib/queryInvalidation";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export function useOrderReturns(orderId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();
  const { user } = useAuth();

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ["order_returns", companyId, orderId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-order-returns") || "[]";
        const localReturns = JSON.parse(raw);
        const ordersRaw = localStorage.getItem("erp-mini-local-demo") || "[]";
        const orders = JSON.parse(ordersRaw);
        const partnersRaw = localStorage.getItem("erp-mini-local-demo-partners") || "[]";
        const partners = JSON.parse(partnersRaw);

        const filtered = localReturns
          .filter((r: any) => r.company_id === companyId)
          .map((r: any) => {
            const order = orders.find((o: any) => o.id === r.order_id);
            const partner = order ? partners.find((p: any) => p.name === order.customer_name || p.id === order.partner_id) : null;
            return {
              ...r,
              orders: order ? {
                order_number: order.order_number,
                total: order.total,
                partners: partner ? { name: partner.name } : null
              } : null
            };
          });
        return orderId ? filtered.filter((r: any) => r.order_id === orderId) : filtered;
      }

      let query = supabase
        .from("order_returns")
        .select("*, orders(order_number, total, partners(name))")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (orderId) query = query.eq("order_id", orderId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createReturn = useMutation({
    mutationFn: async (returnData: {
      order_id: string;
      return_type?: string;
      platform_source?: string;
      reason?: string;
      refund_amount?: number;
      return_items?: any[];
      notes?: string;
    }) => {
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-order-returns") || "[]";
        const localReturns = JSON.parse(raw);
        const newReturn = {
          id: `ret-${Date.now()}`,
          company_id: companyId,
          created_by: "local-demo-user",
          order_id: returnData.order_id,
          return_type: returnData.return_type || "manual",
          platform_source: returnData.platform_source || "manual",
          reason: returnData.reason || null,
          refund_amount: returnData.refund_amount || 0,
          return_items: returnData.return_items || [],
          notes: returnData.notes || null,
          status: "requested",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localReturns.push(newReturn);
        localStorage.setItem("erp-mini-local-demo-order-returns", JSON.stringify(localReturns));
        return newReturn;
      }

      const { data, error } = await supabase
        .from("order_returns")
        .insert({
          ...returnData,
          company_id: companyId,
          created_by: user?.id,
          platform_source: (returnData.platform_source || "manual") as any,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order_returns"] });
      toast({ title: "Tạo yêu cầu trả hàng thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updateReturnStatus = useMutation({
    mutationFn: async ({ id, status, refund_amount }: { id: string; status: string; refund_amount?: number }) => {
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-order-returns") || "[]";
        const localReturns = JSON.parse(raw);
        const idx = localReturns.findIndex((r: any) => r.id === id);
        if (idx >= 0) {
          const updates: any = { status };
          if (refund_amount !== undefined) updates.refund_amount = refund_amount;
          localReturns[idx] = { ...localReturns[idx], ...updates, updated_at: new Date().toISOString() };
          
          const record = localReturns[idx];
          localStorage.setItem("erp-mini-local-demo-order-returns", JSON.stringify(localReturns));

          // If status is received, restock
          if (status === "received" && record.return_items) {
            const productsRaw = localStorage.getItem("erp-mini-local-demo-products") || "[]";
            const products = JSON.parse(productsRaw);
            for (const item of record.return_items) {
              const pIdx = products.findIndex((p: any) => p.id === item.product_id);
              if (pIdx >= 0) {
                products[pIdx].stock_quantity = (products[pIdx].stock_quantity || 0) + item.quantity;
              }
            }
            localStorage.setItem("erp-mini-local-demo-products", JSON.stringify(products));

            // Create inventory transaction log
            const txsRaw = localStorage.getItem("erp-mini-local-demo-inventory-transactions") || "[]";
            const txs = JSON.parse(txsRaw);
            for (const item of record.return_items) {
              txs.push({
                id: `tx-${Date.now()}-${Math.random()}`,
                product_id: item.product_id,
                transaction_type: "in",
                quantity: item.quantity,
                reference_type: "return",
                reference_id: id,
                notes: `Hoàn kho từ đơn trả hàng`,
                created_at: new Date().toISOString(),
              });
            }
            localStorage.setItem("erp-mini-local-demo-inventory-transactions", JSON.stringify(txs));
          }

          // If status is refunded, auto-hạch toán hoàn tiền
          if (status === "refunded") {
            const localAccountsRaw = localStorage.getItem("erp-mini-local-demo-chart-of-accounts") || "[]";
            const localAccounts = JSON.parse(localAccountsRaw);
            
            const refundAmt = record.refund_amount || 0;
            const netRefund = Math.round(refundAmt / 1.1);
            const vatRefund = refundAmt - netRefund;

            // Debit Giảm trừ doanh thu TK 521, Debit Thuế VAT TK 333, Credit Tiền gửi ngân hàng TK 112
            const addBal = (code: string, amount: number) => {
              const aIdx = localAccounts.findIndex((a: any) => a.code === code);
              if (aIdx >= 0) {
                localAccounts[aIdx].balance = (Number(localAccounts[aIdx].balance) || 0) + amount;
              }
            };
            
            addBal("521", netRefund); // TK 521 Debit
            addBal("333", -vatRefund); // TK 333 Debit (negative of Credit balance)
            addBal("112", -refundAmt); // TK 112 Credit (negative of Debit balance)
            
            localStorage.setItem("erp-mini-local-demo-chart-of-accounts", JSON.stringify(localAccounts));

            // Journal Entry
            const entriesRaw = localStorage.getItem("erp-mini-local-demo-journal-entries") || "[]";
            const entries = JSON.parse(entriesRaw);
            const newEntry = {
              id: `entry-refund-${Date.now()}`,
              company_id: companyId,
              entry_date: new Date().toISOString().split("T")[0],
              description: `Hạch toán tự động hoàn tiền đơn trả hàng ${id}`,
              source_type: "order_return",
              status: "posted",
              created_at: new Date().toISOString(),
            };
            entries.push(newEntry);
            localStorage.setItem("erp-mini-local-demo-journal-entries", JSON.stringify(entries));
          }

          return record;
        }
        throw new Error("Không tìm thấy đơn trả hàng local");
      }

      const updates: any = { status: status as any };
      if (refund_amount !== undefined) updates.refund_amount = refund_amount;
      const { data, error } = await supabase
        .from("order_returns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // If status is "received", restock items
      if (status === "received") {
        const returnRecord = await supabase.from("order_returns").select("return_items, order_id").eq("id", id).single();
        if (returnRecord.data?.return_items) {
          const items = returnRecord.data.return_items as any[];
          for (const item of items) {
            if (item.product_id && item.quantity) {
              // Atomic stock update using rpc to avoid race conditions
              await supabase.rpc("increment_stock_quantity" as any, {
                p_product_id: item.product_id,
                p_quantity: item.quantity,
              });
              // Log inventory transaction
              await supabase.from("inventory_transactions").insert({
                product_id: item.product_id,
                transaction_type: "in",
                quantity: item.quantity,
                reference_type: "return",
                reference_id: id,
                notes: `Hoàn kho từ đơn trả hàng`,
              });
            }
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order_returns"] });
      invalidateWarehouseRelated(queryClient);
      invalidateOrderRelated(queryClient);
      toast({ title: "Cập nhật trạng thái thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  return { returns, isLoading, createReturn, updateReturnStatus };
}
