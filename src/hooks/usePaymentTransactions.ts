import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { invalidatePaymentRelated } from "@/lib/queryInvalidation";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { erpEventBus } from "@/lib/erpEventBus";
import { logLocalAction } from "@/lib/localInventoryStore";

interface PaymentTransaction {
  id: string;
  partner_id: string;
  order_id: string | null;
  transaction_type: 'receivable' | 'payable' | 'payment_in' | 'payment_out';
  amount: number;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  transaction_date: string;
  created_by: string | null;
  created_at: string;
  partners?: {
    id: string;
    name: string;
    code: string;
    partner_type: string;
  };
  orders?: {
    id: string;
    order_number: string;
  };
}

interface PaymentTransactionInsert {
  partner_id: string;
  order_id?: string | null;
  transaction_type: 'receivable' | 'payable' | 'payment_in' | 'payment_out';
  amount: number;
  payment_method?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  transaction_date?: string;
}

const TRANSACTIONS_KEY = "erp-mini-local-demo-payment-transactions";
const PARTNERS_KEY = "erp-mini-local-demo-partners";
const ORDERS_KEY = "erp-mini-local-demo-orders";

export function usePaymentTransactions(partnerId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["payment-transactions", partnerId, companyId],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem(TRANSACTIONS_KEY);
        let list: PaymentTransaction[] = [];
        if (raw) {
          try {
            list = JSON.parse(raw);
          } catch {
            list = [];
          }
        } else {
          const subMonthsDate = (months: number) => {
            const d = new Date();
            d.setMonth(d.getMonth() - months);
            return d.toISOString();
          };

          list = [
            {
              id: "tx-init-1",
              partner_id: "partner-retail",
              order_id: "ord-1",
              transaction_type: "payment_in",
              amount: 198000,
              payment_method: "vietqr",
              reference_number: "QR123456",
              notes: "Thanh toán đơn hàng POS-ORD-001",
              transaction_date: new Date(Date.now() - 3600000 * 2).toISOString(),
              created_by: "admin",
              created_at: new Date(Date.now() - 3600000 * 2).toISOString()
            },
            {
              id: "tx-init-2",
              partner_id: "partner-supplier-a",
              order_id: null,
              transaction_type: "payment_out",
              amount: 7000000,
              payment_method: "bank_transfer",
              reference_number: "FT993184",
              notes: "Mua máy in màu Epson L8050 (CAPEX)",
              transaction_date: subMonthsDate(5),
              created_by: "admin",
              created_at: subMonthsDate(5)
            },
            {
              id: "tx-init-3",
              partner_id: "partner-supplier-b",
              order_id: null,
              transaction_type: "payment_out",
              amount: 2500000,
              payment_method: "cash",
              reference_number: null,
              notes: "Mua máy cán màng laminate",
              transaction_date: subMonthsDate(5),
              created_by: "admin",
              created_at: subMonthsDate(5)
            },
            {
              id: "tx-init-4",
              partner_id: "partner-supplier-b",
              order_id: null,
              transaction_type: "payment_out",
              amount: 10000000,
              payment_method: "bank_transfer",
              reference_number: "FT993189",
              notes: "Nhập sỉ giấy decal và mực in ban đầu",
              transaction_date: subMonthsDate(5),
              created_by: "admin",
              created_at: subMonthsDate(5)
            },
            {
              id: "tx-init-h1",
              partner_id: "partner-retail",
              order_id: "ord-h1",
              transaction_type: "payment_in",
              amount: 198000,
              payment_method: "vietqr",
              reference_number: "QR881",
              notes: "Thanh toán đơn hàng HIST-001",
              transaction_date: subMonthsDate(5),
              created_by: "admin",
              created_at: subMonthsDate(5)
            },
            {
              id: "tx-init-h2",
              partner_id: "partner-retail",
              order_id: "ord-h2",
              transaction_type: "payment_in",
              amount: 349000,
              payment_method: "cod",
              reference_number: "COD882",
              notes: "Thanh toán đơn hàng HIST-002",
              transaction_date: subMonthsDate(5),
              created_by: "admin",
              created_at: subMonthsDate(5)
            },
            {
              id: "tx-init-h3",
              partner_id: "partner-retail",
              order_id: "ord-h3",
              transaction_type: "payment_in",
              amount: 540000,
              payment_method: "vietqr",
              reference_number: "QR883",
              notes: "Thanh toán đơn hàng HIST-003",
              transaction_date: subMonthsDate(4),
              created_by: "admin",
              created_at: subMonthsDate(4)
            },
            {
              id: "tx-init-h5",
              partner_id: "partner-retail",
              order_id: "ord-h5",
              transaction_type: "payment_in",
              amount: 396000,
              payment_method: "vietqr",
              reference_number: "QR885",
              notes: "Thanh toán đơn hàng HIST-005",
              transaction_date: subMonthsDate(3),
              created_by: "admin",
              created_at: subMonthsDate(3)
            },
            {
              id: "tx-init-h6",
              partner_id: "partner-retail",
              order_id: "ord-h6",
              transaction_type: "payment_in",
              amount: 698000,
              payment_method: "cod",
              reference_number: "COD886",
              notes: "Thanh toán đơn hàng HIST-006",
              transaction_date: subMonthsDate(3),
              created_by: "admin",
              created_at: subMonthsDate(3)
            },
            {
              id: "tx-init-h7",
              partner_id: "partner-retail",
              order_id: "ord-h7",
              transaction_type: "payment_in",
              amount: 1080000,
              payment_method: "vietqr",
              reference_number: "QR887",
              notes: "Thanh toán đơn hàng HIST-007",
              transaction_date: subMonthsDate(2),
              created_by: "admin",
              created_at: subMonthsDate(2)
            },
            {
              id: "tx-init-h9",
              partner_id: "partner-retail",
              order_id: "ord-h9",
              transaction_type: "payment_in",
              amount: 792000,
              payment_method: "vietqr",
              reference_number: "QR889",
              notes: "Thanh toán đơn hàng HIST-009",
              transaction_date: subMonthsDate(1),
              created_by: "admin",
              created_at: subMonthsDate(1)
            },
            {
              id: "tx-init-h10",
              partner_id: "partner-retail",
              order_id: "ord-h10",
              transaction_type: "payment_in",
              amount: 1047000,
              payment_method: "vietqr",
              reference_number: "QR890",
              notes: "Thanh toán đơn hàng HIST-010",
              transaction_date: subMonthsDate(1),
              created_by: "admin",
              created_at: subMonthsDate(1)
            },
            {
              id: "tx-init-h4",
              partner_id: "partner-retail",
              order_id: "ord-h4",
              transaction_type: "payment_in",
              amount: 109000,
              payment_method: "vietqr",
              reference_number: "QR884",
              notes: "Thanh toán đơn hàng HIST-004",
              transaction_date: subMonthsDate(4),
              created_by: "admin",
              created_at: subMonthsDate(4)
            },
            {
              id: "tx-init-h8",
              partner_id: "partner-retail",
              order_id: "ord-h8",
              transaction_type: "payment_in",
              amount: 218000,
              payment_method: "vietqr",
              reference_number: "QR888",
              notes: "Thanh toán đơn hàng HIST-008",
              transaction_date: subMonthsDate(2),
              created_by: "admin",
              created_at: subMonthsDate(2)
            },
            {
              id: "tx-init-h11",
              partner_id: "partner-retail",
              order_id: "ord-h11",
              transaction_type: "payment_in",
              amount: 540000,
              payment_method: "vietqr",
              reference_number: "QR891",
              notes: "Thanh toán đơn hàng HIST-011",
              transaction_date: subMonthsDate(1),
              created_by: "admin",
              created_at: subMonthsDate(1)
            },
            {
              id: "tx-init-h12",
              partner_id: "partner-retail",
              order_id: "ord-h12",
              transaction_type: "payment_in",
              amount: 149000,
              payment_method: "vietqr",
              reference_number: "QR892",
              notes: "Thanh toán đơn hàng HIST-012",
              transaction_date: subMonthsDate(1),
              created_by: "admin",
              created_at: subMonthsDate(1)
            }
          ];
          localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
        }
        
        const rawPartners = localStorage.getItem(PARTNERS_KEY);
        const rawOrders = localStorage.getItem(ORDERS_KEY);
        const partnersList = rawPartners ? JSON.parse(rawPartners) : [];
        const ordersList = rawOrders ? JSON.parse(rawOrders) : [];
        
        const enriched = list.map(t => ({
          ...t,
          partners: partnersList.find((p: any) => p.id === t.partner_id),
          orders: ordersList.find((o: any) => o.id === t.order_id)
        }));
        
        if (partnerId) {
          return enriched.filter(t => t.partner_id === partnerId);
        }
        return enriched;
      }

      let query = supabase
        .from("payment_transactions")
        .select(`
          *,
          partners(id, name, code, partner_type),
          orders(id, order_number)
        `) as any;

      query = query
        .eq("company_id", companyId!)
        .order("transaction_date", { ascending: false });

      if (partnerId) {
        query = query.eq("partner_id", partnerId);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as PaymentTransaction[];
    },
    enabled: !!companyId,
  });

  const createTransaction = useMutation({
    mutationFn: async (transaction: PaymentTransactionInsert) => {
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem(TRANSACTIONS_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const newTx: PaymentTransaction = {
          id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          partner_id: transaction.partner_id,
          order_id: transaction.order_id || null,
          transaction_type: transaction.transaction_type,
          amount: transaction.amount,
          payment_method: transaction.payment_method || null,
          reference_number: transaction.reference_number || null,
          notes: transaction.notes || null,
          transaction_date: transaction.transaction_date || new Date().toISOString(),
          created_by: "admin",
          created_at: new Date().toISOString(),
        };
        list.unshift(newTx);
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
        
        if (transaction.order_id && (transaction.transaction_type === 'payment_in' || transaction.transaction_type === 'payment_out')) {
          const rawOrders = localStorage.getItem(ORDERS_KEY);
          const orders = rawOrders ? JSON.parse(rawOrders) : [];
          const orderIdx = orders.findIndex((o: any) => o.id === transaction.order_id);
          if (orderIdx > -1) {
            const updatedPaidAmount = (orders[orderIdx].paid_amount || 0) + transaction.amount;
            orders[orderIdx].paid_amount = updatedPaidAmount;
            
            const total = orders[orderIdx].total || 0;
            if (updatedPaidAmount >= total) {
              orders[orderIdx].payment_status = "paid";
            } else if (updatedPaidAmount > 0) {
              orders[orderIdx].payment_status = "partially_paid";
            } else {
              orders[orderIdx].payment_status = "unpaid";
            }
            
            localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
          }
        }
        
        logLocalAction("Ghi nhận thanh toán", "payment_transactions", newTx.id, null, {
          amount: newTx.amount,
          type: newTx.transaction_type,
          method: newTx.payment_method,
          partner_id: newTx.partner_id,
        });

        erpEventBus.publish("PAYMENT_RECORDED", { transaction: newTx });
        return newTx;
      }

      const { data, error } = await supabase
        .from("payment_transactions")
        .insert(transaction)
        .select()
        .single();
      if (error) throw error;

      if (transaction.order_id && (transaction.transaction_type === 'payment_in' || transaction.transaction_type === 'payment_out')) {
        const { data: order } = await supabase
          .from("orders")
          .select("paid_amount, total")
          .eq("id", transaction.order_id)
          .single();
        if (order) {
          const updatedPaidAmount = (order.paid_amount || 0) + transaction.amount;
          const total = order.total || 0;
          let paymentStatus = "unpaid";
          if (updatedPaidAmount >= total) {
            paymentStatus = "paid";
          } else if (updatedPaidAmount > 0) {
            paymentStatus = "partially_paid";
          }
          await supabase
            .from("orders")
            .update({ paid_amount: updatedPaidAmount, payment_status: paymentStatus })
            .eq("id", transaction.order_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      invalidatePaymentRelated(queryClient);
      toast({ title: "Ghi nhận thanh toán thành công" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const { data: debtSummary = [] } = useQuery({
    queryKey: ["debt-summary", companyId],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem(PARTNERS_KEY);
        const list = raw ? JSON.parse(raw) : [];
        return list
          .filter((p: any) => p.debt_amount !== 0)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            code: p.code,
            partner_type: p.partner_type,
            debt_amount: p.debt_amount,
            total_spent: p.total_spent
          }))
          .sort((a: any, b: any) => b.debt_amount - a.debt_amount);
      }

      const { data, error } = await supabase
        .from("partners")
        .select("id, name, code, partner_type, debt_amount, total_spent")
        .eq("company_id", companyId!)
        .neq("debt_amount", 0)
        .order("debt_amount", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  return {
    transactions,
    isLoading,
    createTransaction,
    debtSummary,
  };
}
