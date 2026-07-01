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
const BANK_TX_KEY = "erp-mini-local-demo-bank-transactions";

export interface BankTransaction {
  id: string;
  company_id: string;
  transaction_id: string;
  amount: number;
  content: string | null;
  gateway: string;
  account_number: string | null;
  sender_name: string | null;
  transaction_time: string;
  reconciliation_status: string;
  matched_entity_id: string | null;
  matched_entity_type: string | null;
  reconciled_at: string | null;
  reconciled_by: string | null;
  notes: string | null;
}

export function parseCassoDateTime(rawDateTime: string): string {
  if (!rawDateTime) return new Date().toISOString();
  let formatted = rawDateTime.trim();
  if (formatted.includes(" ")) {
    formatted = formatted.replace(" ", "T");
  }
  if (!formatted.includes("+") && !formatted.includes("Z") && !/-\d{2}:\d{2}$/.test(formatted)) {
    formatted = `${formatted}+07:00`;
  }
  return new Date(formatted).toISOString();
}

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
              orders[orderIdx].payment_status = "partial";
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
            paymentStatus = "partial";
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

  const { data: bankTransactions = [], isLoading: isLoadingBankTx } = useQuery({
    queryKey: ["bank-transactions", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem(BANK_TX_KEY);
        let list: BankTransaction[] = [];
        if (raw) {
          try {
            list = JSON.parse(raw);
          } catch {
            list = [];
          }
        } else {
          list = [
            {
              id: "tx-bank-init-1",
              company_id: companyId,
              transaction_id: "FT26128038102",
              amount: 450000,
              content: "CHUYEN TIEN DH9812",
              gateway: "Vietcombank",
              account_number: "1028374827",
              sender_name: "NGUYEN VAN B",
              transaction_time: parseCassoDateTime("2026-06-22 14:10:02"),
              reconciliation_status: "matched",
              matched_entity_id: "ord-1",
              matched_entity_type: "order",
              reconciled_at: new Date().toISOString(),
              reconciled_by: "system",
              notes: "Auto-matched by system"
            },
            {
              id: "tx-bank-init-2",
              company_id: companyId,
              transaction_id: "FT26128038105",
              amount: 1250000,
              content: "KHOA MEDIA CK DH8821",
              gateway: "Techcombank",
              account_number: "190384729180",
              sender_name: "PHAN VAN KHOA",
              transaction_time: parseCassoDateTime("2026-06-22 13:45:10"),
              reconciliation_status: "matched",
              matched_entity_id: "ord-2",
              matched_entity_type: "order",
              reconciled_at: new Date().toISOString(),
              reconciled_by: "system",
              notes: "Auto-matched by system"
            },
            {
              id: "tx-bank-init-3",
              company_id: companyId,
              transaction_id: "FT26128038109",
              amount: 320000,
              content: "NGUYEN VAN A THANH TOAN",
              gateway: "MB Bank",
              account_number: "09823847291",
              sender_name: "NGUYEN VAN A",
              transaction_time: parseCassoDateTime("2026-06-22 12:20:15"),
              reconciliation_status: "unmatched",
              matched_entity_id: null,
              matched_entity_type: null,
              reconciled_at: null,
              reconciled_by: null,
              notes: null
            }
          ];
          localStorage.setItem(BANK_TX_KEY, JSON.stringify(list));
        }
        return list.filter(tx => tx.company_id === companyId);
      }

      const { data, error } = await supabase
        .from("bank_transactions")
        .select("*")
        .eq("company_id", companyId)
        .order("transaction_time", { ascending: false });
      if (error) throw error;
      return data as BankTransaction[];
    },
    enabled: !!companyId,
  });

  const syncBankTransactions = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem(BANK_TX_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const newTx: BankTransaction = {
          id: `tx-bank-${Date.now()}`,
          company_id: companyId,
          transaction_id: `FT2612803${Math.floor(Math.random() * 90000) + 10000}`,
          amount: 890000,
          content: "THANH TOAN DON HANG DH7731",
          gateway: "VietinBank",
          account_number: "1038471928",
          sender_name: "TRAN VAN C",
          transaction_time: parseCassoDateTime(new Date().toISOString()),
          reconciliation_status: "unmatched",
          matched_entity_id: null,
          matched_entity_type: null,
          reconciled_at: null,
          reconciled_by: null,
          notes: null
        };
        list.unshift(newTx);
        localStorage.setItem(BANK_TX_KEY, JSON.stringify(list));
        return [newTx];
      }

      const newTxInsert = {
        company_id: companyId,
        transaction_id: `FT2612803${Math.floor(Math.random() * 90000) + 10000}`,
        amount: 890000,
        content: "THANH TOAN DON HANG DH7731",
        gateway: "VietinBank",
        account_number: "1038471928",
        sender_name: "TRAN VAN C",
        transaction_time: parseCassoDateTime(new Date().toISOString()),
        reconciliation_status: "unmatched",
        matched_entity_id: null,
        matched_entity_type: null,
        reconciled_at: null,
        reconciled_by: null,
        notes: null
      };

      const { data, error } = await supabase
        .from("bank_transactions")
        .insert(newTxInsert)
        .select()
        .single();
      if (error) throw error;
      return [data];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      toast({ title: "Đồng bộ giao dịch Casso thành công!" });
    }
  });

  const matchBankTransaction = useMutation({
    mutationFn: async (payload: { bankTxId: string; orderId: string }) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");

      let partnerId = "partner-retail";
      let orderNumber = "";
      let amount = 0;
      let content = "";
      let transactionId = "";

      if (isLocalDemoAuthEnabled()) {
        const rawOrders = localStorage.getItem(ORDERS_KEY);
        const orders = rawOrders ? JSON.parse(rawOrders) : [];
        const order = orders.find((o: any) => o.id === payload.orderId);
        if (!order) throw new Error("Không tìm thấy đơn hàng");
        partnerId = order.partner_id || "partner-retail";
        orderNumber = order.order_number;

        const rawBankTx = localStorage.getItem(BANK_TX_KEY);
        const bankTxs = rawBankTx ? JSON.parse(rawBankTx) : [];
        const txIdx = bankTxs.findIndex((tx: any) => tx.id === payload.bankTxId || tx.transaction_id === payload.bankTxId);
        if (txIdx === -1) throw new Error("Không tìm thấy giao dịch ngân hàng");
        amount = bankTxs[txIdx].amount;
        content = bankTxs[txIdx].content || "";
        transactionId = bankTxs[txIdx].transaction_id;

        bankTxs[txIdx].reconciliation_status = "matched";
        bankTxs[txIdx].matched_entity_id = payload.orderId;
        bankTxs[txIdx].matched_entity_type = "order";
        bankTxs[txIdx].reconciled_at = new Date().toISOString();
        bankTxs[txIdx].reconciled_by = "admin";
        bankTxs[txIdx].notes = `Matched manually with order ${orderNumber}`;
        localStorage.setItem(BANK_TX_KEY, JSON.stringify(bankTxs));
      } else {
        const { data: order } = await supabase
          .from("orders")
          .select("id, partner_id, order_number")
          .eq("id", payload.orderId)
          .single();
        if (!order) throw new Error("Không tìm thấy đơn hàng");
        partnerId = order.partner_id || "partner-retail";
        orderNumber = order.order_number;

        const { data: bankTx } = await supabase
          .from("bank_transactions")
          .select("*")
          .eq("id", payload.bankTxId)
          .single();
        if (!bankTx) throw new Error("Không tìm thấy giao dịch ngân hàng");
        amount = bankTx.amount;
        content = bankTx.content || "";
        transactionId = bankTx.transaction_id;

        const { error: updateErr } = await supabase
          .from("bank_transactions")
          .update({
            reconciliation_status: "matched",
            matched_entity_id: payload.orderId,
            matched_entity_type: "order",
            reconciled_at: new Date().toISOString(),
            reconciled_by: "admin",
            notes: `Matched manually with order ${orderNumber}`
          })
          .eq("id", payload.bankTxId);
        if (updateErr) throw updateErr;
      }

      await createTransaction.mutateAsync({
        partner_id: partnerId,
        order_id: payload.orderId,
        transaction_type: "payment_in",
        amount: amount,
        payment_method: "bank_transfer",
        reference_number: transactionId,
        notes: `Casso đối soát thủ công: ${content}`
      });

      return { bankTxId: payload.bankTxId, orderId: payload.orderId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["payment-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Đối soát thủ công thành công!" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    }
  });

  return {
    transactions,
    isLoading,
    createTransaction,
    debtSummary,
    bankTransactions,
    isLoadingBankTx,
    syncBankTransactions,
    matchBankTransaction,
  };
}
