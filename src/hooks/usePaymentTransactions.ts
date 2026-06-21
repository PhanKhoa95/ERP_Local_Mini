import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { invalidatePaymentRelated } from "@/lib/queryInvalidation";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

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
            orders[orderIdx].paid_amount = (orders[orderIdx].paid_amount || 0) + transaction.amount;
            
            // Auto update payment_status if fully paid
            if (orders[orderIdx].paid_amount >= (orders[orderIdx].total || 0)) {
              orders[orderIdx].payment_status = "paid";
            }
            
            localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
          }
        }
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
          .select("paid_amount")
          .eq("id", transaction.order_id)
          .single();
        if (order) {
          await supabase
            .from("orders")
            .update({ paid_amount: (order.paid_amount || 0) + transaction.amount })
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
