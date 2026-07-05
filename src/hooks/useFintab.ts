import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface FintabInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  supplier_name: string;
  supplier_mst: string;
  buyer_name: string;
  buyer_mst: string;
  amount_before_tax: number;
  tax_rate: string;
  tax_amount: number;
  total_amount: number;
  direction: "in" | "out";
  status: "synced" | "draft" | "pending";
}

export interface FintabBankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  balance: number;
  is_active: boolean;
}

export interface FintabBankTransaction {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  amount: number;
  direction: "in" | "out";
  reference_code: string;
  description: string;
  is_reconciled: boolean;
  reconciled_voucher_id?: string | null;
}

const INVOICES_KEY = "fintab_invoices";
const BANK_ACCOUNTS_KEY = "fintab_bank_accounts";
const BANK_TRANSACTIONS_KEY = "fintab_bank_transactions";
const TAX_CONFIG_KEY = "fintab_tax_config";

const getLocal = <T>(key: string, seed: T): T => {
  if (typeof window === "undefined") return seed;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return seed;
  }
};

const saveLocal = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Seed Data
const seedInvoices = (): FintabInvoice[] => [
  {
    id: "inv-1",
    invoice_number: "1C26-TA001",
    invoice_date: "2026-07-01",
    supplier_name: "Công ty Cổ phần Bao bì Việt Nam",
    supplier_mst: "0102030405",
    buyer_name: "Xưởng in Sticker TPHCM (Hộ kinh doanh)",
    buyer_mst: "8090123456",
    amount_before_tax: 15000000,
    tax_rate: "8%",
    tax_amount: 1200000,
    total_amount: 16200000,
    direction: "in",
    status: "pending"
  },
  {
    id: "inv-2",
    invoice_number: "2C26-TB002",
    invoice_date: "2026-07-03",
    supplier_name: "Tổng kho Giấy in Offset Sài Gòn",
    supplier_mst: "0304050607",
    buyer_name: "Xưởng in Sticker TPHCM (Hộ kinh doanh)",
    buyer_mst: "8090123456",
    amount_before_tax: 28000000,
    tax_rate: "10%",
    tax_amount: 2800000,
    total_amount: 30800000,
    direction: "in",
    status: "draft"
  },
  {
    id: "inv-3",
    invoice_number: "1C26-OUT01",
    invoice_date: "2026-07-04",
    supplier_name: "Xưởng in Sticker TPHCM (Hộ kinh doanh)",
    supplier_mst: "8090123456",
    buyer_name: "Công ty Cổ phần Pancake Việt Nam",
    buyer_mst: "0108253160",
    amount_before_tax: 42000000,
    tax_rate: "8%",
    tax_amount: 3360000,
    total_amount: 45360000,
    direction: "out",
    status: "synced"
  }
];

const seedBankAccounts = (): FintabBankAccount[] => [
  {
    id: "bank-vcb",
    bank_name: "Vietcombank",
    account_number: "1024567890",
    account_holder: "XUONG IN STICKER TPHCM",
    balance: 85000000,
    is_active: true
  },
  {
    id: "bank-tcb",
    bank_name: "Techcombank",
    account_number: "1903456789",
    account_holder: "XUONG IN STICKER TPHCM",
    balance: 124000000,
    is_active: true
  }
];

const seedBankTransactions = (): FintabBankTransaction[] => [
  {
    id: "tx-b1",
    bank_account_id: "bank-vcb",
    transaction_date: "2026-07-04T10:30:00Z",
    amount: 45360000,
    direction: "in",
    reference_code: "FT261860012",
    description: "PANCAKE VN THANH TOAN IN AN STICKER 1C26-OUT01",
    is_reconciled: true,
    reconciled_voucher_id: "cv-mock-1"
  },
  {
    id: "tx-b2",
    bank_account_id: "bank-tcb",
    transaction_date: "2026-07-05T08:15:00Z",
    amount: 1500000,
    direction: "out",
    reference_code: "FT261860085",
    description: "CHI TIEN dien nuoc van phong thang 6",
    is_reconciled: false,
    reconciled_voucher_id: null
  }
];

const seedTaxConfig = () => ({
  username: "xuonginsticker_tax",
  tax_code: "8090123456",
  is_connected: true
});

export function useFintab() {
  const queryClient = useQueryClient();

  const taxConfigQuery = useQuery({
    queryKey: ["fintab_tax_config"],
    queryFn: async () => getLocal(TAX_CONFIG_KEY, seedTaxConfig())
  });

  const invoicesQuery = useQuery({
    queryKey: ["fintab_invoices"],
    queryFn: async () => getLocal(INVOICES_KEY, seedInvoices())
  });

  const bankAccountsQuery = useQuery({
    queryKey: ["fintab_bank_accounts"],
    queryFn: async () => getLocal(BANK_ACCOUNTS_KEY, seedBankAccounts())
  });

  const bankTransactionsQuery = useQuery({
    queryKey: ["fintab_bank_transactions"],
    queryFn: async () => getLocal(BANK_TRANSACTIONS_KEY, seedBankTransactions())
  });

  // Mutations
  const updateTaxConfig = useMutation({
    mutationFn: async (config: { username: string; tax_code: string; is_connected: boolean }) => {
      saveLocal(TAX_CONFIG_KEY, config);
      return config;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fintab_tax_config"] });
      toast.success("Cập nhật thông tin Tổng cục Thuế thành công");
    }
  });

  const updateInvoiceStatus = useMutation({
    mutationFn: async (payload: { id: string; status: "synced" | "draft" | "pending" }) => {
      const local = getLocal(INVOICES_KEY, seedInvoices());
      const idx = local.findIndex(i => i.id === payload.id);
      if (idx > -1) {
        local[idx].status = payload.status;
        saveLocal(INVOICES_KEY, local);
        return local[idx];
      }
      throw new Error("Không tìm thấy hóa đơn");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fintab_invoices"] });
    }
  });

  const simulateNewBankTransaction = useMutation({
    mutationFn: async (payload: { bank_account_id: string; amount: number; direction: "in" | "out"; description: string }) => {
      const txs = getLocal(BANK_TRANSACTIONS_KEY, seedBankTransactions());
      const banks = getLocal(BANK_ACCOUNTS_KEY, seedBankAccounts());

      // Update bank balance
      const bIdx = banks.findIndex(b => b.id === payload.bank_account_id);
      if (bIdx > -1) {
        if (payload.direction === "in") {
          banks[bIdx].balance += payload.amount;
        } else {
          banks[bIdx].balance -= payload.amount;
        }
        saveLocal(BANK_ACCOUNTS_KEY, banks);
      }

      const newTx: FintabBankTransaction = {
        id: `tx-b-${Date.now()}`,
        bank_account_id: payload.bank_account_id,
        transaction_date: new Date().toISOString(),
        amount: payload.amount,
        direction: payload.direction,
        reference_code: `FT${Math.floor(100000000 + Math.random() * 900000000)}`,
        description: payload.description,
        is_reconciled: false,
        reconciled_voucher_id: null
      };

      saveLocal(BANK_TRANSACTIONS_KEY, [newTx, ...txs]);
      return newTx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fintab_bank_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["fintab_bank_accounts"] });
      toast.success("Mô phỏng báo có/báo nợ ngân hàng thành công!");
    }
  });

  const reconcileBankTransaction = useMutation({
    mutationFn: async (payload: { transaction_id: string; voucher_id: string }) => {
      const txs = getLocal(BANK_TRANSACTIONS_KEY, seedBankTransactions());
      const idx = txs.findIndex(t => t.id === payload.transaction_id);
      if (idx > -1) {
        txs[idx].is_reconciled = true;
        txs[idx].reconciled_voucher_id = payload.voucher_id;
        saveLocal(BANK_TRANSACTIONS_KEY, txs);
        return txs[idx];
      }
      throw new Error("Không tìm thấy giao dịch");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fintab_bank_transactions"] });
      toast.success("Đối soát dòng tiền ngân hàng thành công");
    }
  });

  return {
    taxConfig: taxConfigQuery.data || seedTaxConfig(),
    invoices: invoicesQuery.data || [],
    bankAccounts: bankAccountsQuery.data || [],
    bankTransactions: bankTransactionsQuery.data || [],
    updateTaxConfig,
    updateInvoiceStatus,
    simulateNewBankTransaction,
    reconcileBankTransaction
  };
}
