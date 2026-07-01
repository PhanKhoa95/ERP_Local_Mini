import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { useAuth } from "./useAuth";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { getLocalProductBom } from "@/lib/localInventoryStore";
import { toast } from "sonner";

export interface ChartOfAccount {
  id: string;
  company_id: string;
  code: string;
  name: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  balance: number | null;
  parent_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface JournalEntry {
  id: string;
  company_id: string;
  entry_date: string;
  description: string | null;
  status: "draft" | "posted" | "voided" | null;
  source_type: string | null;
  source_id: string | null;
  created_by: string | null;
  posted_by: string | null;
  vneid_signature?: string | null;
  created_at: string | null;
  updated_at: string | null;
  journal_lines?: JournalLine[];
}

export interface JournalLine {
  id: string;
  entry_id: string;
  account_id: string;
  debit: number | null;
  credit: number | null;
  memo: string | null;
  created_at: string | null;
  account?: ChartOfAccount | null;
}

const LOCAL_ACCOUNTS_KEY = "erp-mini-local-demo-accounts";
const LOCAL_ENTRIES_KEY = "erp-mini-local-demo-journal-entries";
const LOCAL_LINES_KEY = "erp-mini-local-demo-journal-lines";

const DEFAULT_ACCOUNTS = (companyId: string): ChartOfAccount[] => [
  { id: "acc-1111", company_id: companyId, code: "1111", name: "Tiền mặt", account_type: "asset", balance: 0, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-1121", company_id: companyId, code: "1121", name: "Tiền gửi ngân hàng", account_type: "asset", balance: 0, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-131", company_id: companyId, code: "131", name: "Phải thu khách hàng", account_type: "asset", balance: 0, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-156", company_id: companyId, code: "156", name: "Hàng hóa", account_type: "asset", balance: 0, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-211", company_id: companyId, code: "211", name: "Tài sản cố định (CAPEX)", account_type: "asset", balance: 0, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-331", company_id: companyId, code: "331", name: "Phải trả người bán", account_type: "liability", balance: 0, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-3387", company_id: companyId, code: "3387", name: "Nhận trước của khách hàng (Ví thành viên)", account_type: "liability", balance: 0, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-4111", company_id: companyId, code: "4111", name: "Vốn góp chủ sở hữu", account_type: "equity", balance: 0, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-511", company_id: companyId, code: "511", name: "Doanh thu bán hàng", account_type: "revenue", balance: 0, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-632", company_id: companyId, code: "632", name: "Giá vốn bán hàng", account_type: "expense", balance: 0, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-642", company_id: companyId, code: "642", name: "Chi phí quản lý doanh nghiệp", account_type: "expense", balance: 0, parent_id: null, is_active: true, created_at: new Date().toISOString() }
];

function getLocalAccounts(companyId: string): ChartOfAccount[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
  if (!raw) {
    const list = DEFAULT_ACCOUNTS(companyId);
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(list));
    return list;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function seedJournalEntriesFromData(companyId: string): { entries: JournalEntry[], lines: JournalLine[] } {
  const entries: JournalEntry[] = [];
  const lines: JournalLine[] = [];

  const openingEntryId = "ent-opening-balances";
  entries.push({
    id: openingEntryId,
    company_id: companyId,
    entry_date: new Date(Date.now() - 3600000 * 24 * 30).toISOString().split("T")[0],
    description: "Khai báo số dư đầu kỳ",
    status: "posted",
    source_type: "manual",
    source_id: null,
    created_by: "system",
    posted_by: "system",
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString()
  });

  lines.push(
    { id: "line-open-1111", entry_id: openingEntryId, account_id: "acc-1111", debit: 50000000, credit: 0, memo: "Số dư đầu kỳ: Tiền mặt", created_at: new Date().toISOString() },
    { id: "line-open-1121", entry_id: openingEntryId, account_id: "acc-1121", debit: 150000000, credit: 0, memo: "Số dư đầu kỳ: Tiền gửi ngân hàng", created_at: new Date().toISOString() },
    { id: "line-open-131", entry_id: openingEntryId, account_id: "acc-131", debit: 12000000, credit: 0, memo: "Số dư đầu kỳ: Phải thu khách hàng", created_at: new Date().toISOString() },
    { id: "line-open-156", entry_id: openingEntryId, account_id: "acc-156", debit: 45000000, credit: 0, memo: "Số dư đầu kỳ: Hàng hóa", created_at: new Date().toISOString() },
    { id: "line-open-211", entry_id: openingEntryId, account_id: "acc-211", debit: 38500000, credit: 0, memo: "Số dư đầu kỳ: Tài sản cố định (CAPEX)", created_at: new Date().toISOString() },
    { id: "line-open-331", entry_id: openingEntryId, account_id: "acc-331", debit: 0, credit: 25000000, memo: "Số dư đầu kỳ: Phải trả người bán", created_at: new Date().toISOString() },
    { id: "line-open-4111", entry_id: openingEntryId, account_id: "acc-4111", debit: 0, credit: 252500000, memo: "Số dư đầu kỳ: Vốn góp chủ sở hữu", created_at: new Date().toISOString() },
    { id: "line-open-511", entry_id: openingEntryId, account_id: "acc-511", debit: 0, credit: 75000000, memo: "Số dư đầu kỳ: Doanh thu bán hàng tích lũy", created_at: new Date().toISOString() },
    { id: "line-open-632", entry_id: openingEntryId, account_id: "acc-632", debit: 42000000, credit: 0, memo: "Số dư đầu kỳ: Giá vốn tích lũy", created_at: new Date().toISOString() },
    { id: "line-open-642", entry_id: openingEntryId, account_id: "acc-642", debit: 15000000, credit: 0, memo: "Số dư đầu kỳ: Chi phí quản lý tích lũy", created_at: new Date().toISOString() }
  );

  // Read orders from localStorage
  const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
  let ordersList: any[] = [];
  if (rawOrders) {
    try { ordersList = JSON.parse(rawOrders); } catch { ordersList = []; }
  }

  // Read payments from localStorage
  const rawPayments = localStorage.getItem("erp-mini-local-demo-payment-transactions");
  let paymentsList: any[] = [];
  if (rawPayments) {
    try { paymentsList = JSON.parse(rawPayments); } catch { paymentsList = []; }
  }

  // 1. Generate journal entries for each order (Sales & COGS)
  ordersList.forEach((order) => {
    const entryDate = (order.created_at || new Date().toISOString()).split("T")[0];
    const orderNum = order.order_number || order.id;

    // --- A. Sales Entry ---
    const salesEntryId = `ent-sales-${order.id}`;
    entries.push({
      id: salesEntryId,
      company_id: companyId,
      entry_date: entryDate,
      description: `Doanh thu đơn hàng ${orderNum}`,
      status: "posted",
      source_type: "order",
      source_id: order.id,
      created_by: "system",
      posted_by: "system",
      created_at: order.created_at,
      updated_at: order.updated_at
    });

    lines.push(
      {
        id: `line-sales-dr-${order.id}`,
        entry_id: salesEntryId,
        account_id: "acc-131", // Phải thu khách hàng
        debit: Number(order.total || 0),
        credit: 0,
        memo: `Ghi nhận phải thu đơn ${orderNum}`,
        created_at: order.created_at
      },
      {
        id: `line-sales-cr-${order.id}`,
        entry_id: salesEntryId,
        account_id: "acc-511", // Doanh thu bán hàng
        debit: 0,
        credit: Number(order.total || 0),
        memo: `Doanh thu bán hàng đơn ${orderNum}`,
        created_at: order.created_at
      }
    );

    // --- B. COGS Entry (Giá vốn bán hàng) --- BOM-based calculation
    const orderItems = order.order_items || [];
    let costAmount = 0;
    if (orderItems.length > 0) {
      const rawProducts = localStorage.getItem("erp-mini-local-demo-products");
      const products = rawProducts ? JSON.parse(rawProducts) : [];
      costAmount = Math.round(orderItems.reduce((sum: number, item: any) => {
        const bomItems = getLocalProductBom(item.product_id);
        if (bomItems && bomItems.length > 0) {
          const bomCost = bomItems.reduce((bSum: number, b: any) => bSum + ((b.material?.cost_price || 0) * b.quantity), 0);
          return sum + bomCost * (item.quantity || 1);
        }
        const prod = products.find((p: any) => p.id === item.product_id);
        return sum + ((prod?.cost_price || 0) * (item.quantity || 1));
      }, 0));
    } else {
      // Fallback for orders without items — estimate 47%
      costAmount = Math.round(Number(order.total || 0) * 0.47);
    }
    if (costAmount > 0) {
      const cogsEntryId = `ent-cogs-${order.id}`;
      entries.push({
        id: cogsEntryId,
        company_id: companyId,
        entry_date: entryDate,
        description: `Giá vốn đơn hàng ${orderNum}`,
        status: "posted",
        source_type: "order",
        source_id: order.id,
        created_by: "system",
        posted_by: "system",
        created_at: order.created_at,
        updated_at: order.updated_at
      });

      lines.push(
        {
          id: `line-cogs-dr-${order.id}`,
          entry_id: cogsEntryId,
          account_id: "acc-632", // Giá vốn bán hàng
          debit: costAmount,
          credit: 0,
          memo: `Ghi nhận giá vốn đơn ${orderNum}`,
          created_at: order.created_at
        },
        {
          id: `line-cogs-cr-${order.id}`,
          entry_id: cogsEntryId,
          account_id: "acc-156", // Hàng hóa
          debit: 0,
          credit: costAmount,
          memo: `Xuất kho hàng hóa đơn ${orderNum}`,
          created_at: order.created_at
        }
      );
    }
  });

  // 2. Generate journal entries for each payment transaction
  paymentsList.forEach((pay) => {
    const entryDate = (pay.transaction_date || new Date().toISOString()).split("T")[0];
    const entryId = `ent-pay-${pay.id}`;
    const payMethodName = pay.payment_method === "vietqr" || pay.payment_method === "bank_transfer" ? "tiền gửi ngân hàng" : "tiền mặt";
    const payAccId = pay.payment_method === "vietqr" || pay.payment_method === "bank_transfer" ? "acc-1121" : "acc-1111";

    if (pay.transaction_type === "payment_in") {
      entries.push({
        id: entryId,
        company_id: companyId,
        entry_date: entryDate,
        description: pay.notes || `Thu tiền khách hàng (giao dịch ${pay.id})`,
        status: "posted",
        source_type: "payment",
        source_id: pay.id,
        created_by: "system",
        posted_by: "system",
        created_at: pay.created_at,
        updated_at: pay.created_at
      });

      lines.push(
        {
          id: `line-payin-dr-${pay.id}`,
          entry_id: entryId,
          account_id: payAccId,
          debit: Number(pay.amount || 0),
          credit: 0,
          memo: pay.notes || `Thu tiền bằng ${payMethodName}`,
          created_at: pay.created_at
        },
        {
          id: `line-payin-cr-${pay.id}`,
          entry_id: entryId,
          account_id: "acc-131", // Phải thu khách hàng
          debit: 0,
          credit: Number(pay.amount || 0),
          memo: `Giảm phải thu từ giao dịch thu tiền`,
          created_at: pay.created_at
        }
      );
    } else if (pay.transaction_type === "payment_out") {
      const isSupplier = pay.partner_id && pay.partner_id.includes("supplier");
      const isCapex = pay.notes && pay.notes.toLowerCase().includes("capex");
      const drAccId = isCapex ? "acc-211" : (isSupplier ? "acc-331" : "acc-642");
      
      entries.push({
        id: entryId,
        company_id: companyId,
        entry_date: entryDate,
        description: pay.notes || `Chi tiền thanh toán (giao dịch ${pay.id})`,
        status: "posted",
        source_type: "payment",
        source_id: pay.id,
        created_by: "system",
        posted_by: "system",
        created_at: pay.created_at,
        updated_at: pay.created_at
      });

      lines.push(
        {
          id: `line-payout-dr-${pay.id}`,
          entry_id: entryId,
          account_id: drAccId,
          debit: Number(pay.amount || 0),
          credit: 0,
          memo: pay.notes || `Chi phí hạch toán`,
          created_at: pay.created_at
        },
        {
          id: `line-payout-cr-${pay.id}`,
          entry_id: entryId,
          account_id: payAccId,
          debit: 0,
          credit: Number(pay.amount || 0),
          memo: `Chi tiền bằng ${payMethodName}`,
          created_at: pay.created_at
        }
      );
    }
  });

  if (entries.length === 0) {
    const manualEntryId = "ent-manual-init";
    entries.push({
      id: manualEntryId,
      company_id: companyId,
      entry_date: new Date(Date.now() - 3600000 * 24).toISOString().split("T")[0],
      description: "Thu tiền bán hàng trực tiếp",
      status: "posted",
      source_type: "manual",
      source_id: null,
      created_by: "demo-user",
      posted_by: "demo-user",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    lines.push(
      { id: `line-minit-dr`, entry_id: manualEntryId, account_id: "acc-1111", debit: 5000000, credit: 0, memo: "Thu tiền mặt", created_at: new Date().toISOString() },
      { id: `line-minit-cr`, entry_id: manualEntryId, account_id: "acc-511", debit: 0, credit: 5000000, memo: "Doanh thu bán hàng", created_at: new Date().toISOString() }
    );
  }

  return { entries, lines };
}

function getLocalEntries(companyId: string, accounts: ChartOfAccount[]): { entries: JournalEntry[], lines: JournalLine[] } {
  if (typeof window === "undefined") return { entries: [], lines: [] };
  const rawEntries = localStorage.getItem(LOCAL_ENTRIES_KEY);
  const rawLines = localStorage.getItem(LOCAL_LINES_KEY);
  
  if (!rawEntries || !rawLines) {
    const { entries: seededEntries, lines: seededLines } = seedJournalEntriesFromData(companyId);
    localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(seededEntries));
    localStorage.setItem(LOCAL_LINES_KEY, JSON.stringify(seededLines));
    return { entries: seededEntries, lines: seededLines };
  }

  try {
    const entries = JSON.parse(rawEntries);
    const lines = JSON.parse(rawLines);
    
    // Map account relations
    const linesWithAccount = lines.map((l: any) => ({
      ...l,
      account: accounts.find(a => a.id === l.account_id) || null
    }));

    const entriesWithLines = entries.map((e: any) => ({
      ...e,
      journal_lines: linesWithAccount.filter((l: any) => l.entry_id === e.id)
    }));

    return { entries: entriesWithLines, lines: linesWithAccount };
  } catch {
    return { entries: [], lines: [] };
  }
}

function saveLocalData(accounts: ChartOfAccount[], entries: JournalEntry[], lines: JournalLine[]) {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(entries.map(({ journal_lines, ...e }) => e)));
  localStorage.setItem(LOCAL_LINES_KEY, JSON.stringify(lines.map(({ account, ...l }) => l)));
}

export function useAccounting() {
  const { companyId } = useCompanyContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  if (typeof window !== "undefined" && localStorage.getItem("erp-mini-accounting-migrated-v2") !== "true") {
    localStorage.removeItem(LOCAL_ACCOUNTS_KEY);
    localStorage.removeItem(LOCAL_ENTRIES_KEY);
    localStorage.removeItem(LOCAL_LINES_KEY);
    localStorage.setItem("erp-mini-accounting-migrated-v2", "true");
  }

  // 1. Fetch Accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["chart-of-accounts", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalAccounts(companyId);
      }
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("company_id", companyId)
        .order("code", { ascending: true });
      if (error) throw error;
      return (data || []) as ChartOfAccount[];
    },
    enabled: !!companyId,
  });

  // 2. Fetch Entries and Lines
  const { data: accountingData, isLoading: entriesLoading } = useQuery({
    queryKey: ["journal-entries-and-lines", companyId, accounts.map(a => a.id)],
    queryFn: async () => {
      if (!companyId) return { entries: [], lines: [] };
      if (isLocalDemoAuthEnabled()) {
        return getLocalEntries(companyId, accounts);
      }

      // Fetch entries
      const { data: entriesData, error: entriesErr } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("company_id", companyId)
        .order("entry_date", { ascending: false });

      if (entriesErr) throw entriesErr;

      // Fetch lines
      const { data: linesData, error: linesErr } = await supabase
        .from("journal_lines")
        .select("*");
      
      if (linesErr) throw linesErr;

      const lines = (linesData || []).map((l: any) => ({
        ...l,
        account: accounts.find(a => a.id === l.account_id) || null
      })) as JournalLine[];

      const entries = (entriesData || []).map((e: any) => ({
        ...e,
        journal_lines: lines.filter((l: any) => l.entry_id === e.id)
      })) as JournalEntry[];

      return { entries, lines };
    },
    enabled: !!companyId,
  });

  const entries = accountingData?.entries || [];
  const lines = accountingData?.lines || [];
  const isLoading = accountsLoading || entriesLoading;

  // 3. Mutations
  const initAccounts = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isLocalDemoAuthEnabled()) {
        const list = DEFAULT_ACCOUNTS(companyId);
        localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(list));
        return;
      }
      const { error } = await supabase
        .from("chart_of_accounts")
        .insert(DEFAULT_ACCOUNTS(companyId).map(({ id, ...a }) => a));
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts", companyId] });
      toast.success("Đã thiết lập Danh mục Tài khoản kế toán mặc định!");
    },
    onError: (e: any) => {
      toast.error("Lỗi: " + e.message);
    }
  });

  const createAccount = useMutation({
    mutationFn: async (payload: { code: string; name: string; account_type: ChartOfAccount["account_type"] }) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      
      if (isLocalDemoAuthEnabled()) {
        const list = getLocalAccounts(companyId);
        const newAcc: ChartOfAccount = {
          ...payload,
          id: `acc-${payload.code}`,
          company_id: companyId,
          balance: 0,
          parent_id: null,
          is_active: true,
          created_at: new Date().toISOString()
        };
        list.push(newAcc);
        localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(list));
        return newAcc;
      }

      const { data, error } = await supabase
        .from("chart_of_accounts")
        .insert({
          company_id: companyId,
          code: payload.code,
          name: payload.name,
          account_type: payload.account_type,
          balance: 0,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ChartOfAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts", companyId] });
      toast.success("Đã thêm tài khoản mới vào hệ thống");
    },
    onError: (e: any) => {
      toast.error("Lỗi thêm tài khoản: " + e.message);
    }
  });

  const createManualEntry = useMutation({
    mutationFn: async (payload: { description: string; lines: Array<{ account_id: string; debit: number; credit: number; memo: string }> }) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");

      // Validate double-entry: total debits must equal total credits
      const totalDebit = payload.lines.reduce((s, l) => s + (l.debit || 0), 0);
      const totalCredit = payload.lines.reduce((s, l) => s + (l.credit || 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Bút toán không cân: Tổng Nợ (${totalDebit.toLocaleString()}) ≠ Tổng Có (${totalCredit.toLocaleString()})`);
      }

      if (isLocalDemoAuthEnabled()) {
        const localAccounts = getLocalAccounts(companyId);
        const { entries: localEntries, lines: localLines } = getLocalEntries(companyId, localAccounts);
        
        const entryId = `ent-${Date.now()}`;
        const newEntry: JournalEntry = {
          id: entryId,
          company_id: companyId,
          entry_date: new Date().toISOString().split("T")[0],
          description: payload.description,
          status: "posted",
          source_type: "manual",
          source_id: null,
          created_by: user?.email || "demo-user",
          posted_by: user?.email || "demo-user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const newLines: JournalLine[] = payload.lines.map((l, idx) => ({
          id: `line-${Date.now()}-${idx}`,
          entry_id: entryId,
          account_id: l.account_id,
          debit: l.debit,
          credit: l.credit,
          memo: l.memo,
          created_at: new Date().toISOString(),
          account: localAccounts.find(a => a.id === l.account_id) || null
        }));

        localEntries.unshift(newEntry);
        localLines.push(...newLines);
        saveLocalData(localAccounts, localEntries, localLines);
        return newEntry;
      }

      // Supabase transaction simulation
      const { data: entry, error: entryErr } = await supabase
        .from("journal_entries")
        .insert({
          company_id: companyId,
          description: payload.description,
          entry_date: new Date().toISOString().split("T")[0],
          status: "posted",
          created_by: user?.id,
          posted_by: user?.id
        })
        .select()
        .single();
      
      if (entryErr) throw entryErr;

      const linesPayload = payload.lines.map(l => ({
        entry_id: entry.id,
        account_id: l.account_id,
        debit: l.debit,
        credit: l.credit,
        memo: l.memo
      }));

      const { error: linesErr } = await supabase
        .from("journal_lines")
        .insert(linesPayload);
      
      if (linesErr) throw linesErr;

      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries-and-lines", companyId] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats", companyId] });
      toast.success("Ghi sổ bút toán thành công!");
    },
    onError: (e: any) => {
      toast.error("Lỗi ghi sổ: " + e.message);
    }
  });

  const voidJournalEntry = useMutation({
    mutationFn: async (id: string) => {
      if (isLocalDemoAuthEnabled()) {
        const localAccounts = getLocalAccounts(companyId || "");
        const { entries: localEntries, lines: localLines } = getLocalEntries(companyId || "", localAccounts);
        
        const idx = localEntries.findIndex(e => e.id === id);
        if (idx !== -1) {
          localEntries[idx].status = "voided";
          localEntries[idx].updated_at = new Date().toISOString();
          saveLocalData(localAccounts, localEntries, localLines);
        }
        return;
      }

      const { error } = await supabase
        .from("journal_entries")
        .update({ status: "voided", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries-and-lines", companyId] });
      queryClient.invalidateQueries({ queryKey: ["finance-stats", companyId] });
      toast.success("Đã hủy bút toán thành công");
    },
    onError: (e: any) => {
      toast.error("Lỗi hủy bút toán: " + e.message);
    }
  });

  const updateAccount = useMutation({
    mutationFn: async (payload: { id: string; name: string; account_type: ChartOfAccount["account_type"] }) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isLocalDemoAuthEnabled()) {
        const list = getLocalAccounts(companyId);
        const idx = list.findIndex(a => a.id === payload.id);
        if (idx === -1) throw new Error("Không tìm thấy tài khoản");
        list[idx].name = payload.name;
        list[idx].account_type = payload.account_type;
        localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(list));
        return list[idx];
      }
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .update({ name: payload.name, account_type: payload.account_type })
        .eq("id", payload.id)
        .select()
        .single();
      if (error) throw error;
      return data as ChartOfAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts", companyId] });
      toast.success("Đã cập nhật tài khoản");
    },
    onError: (e: any) => {
      toast.error("Lỗi cập nhật tài khoản: " + e.message);
    }
  });

  const deleteAccount = useMutation({
    mutationFn: async (accountId: string) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isLocalDemoAuthEnabled()) {
        const list = getLocalAccounts(companyId);
        const acc = list.find(a => a.id === accountId);
        if (!acc) throw new Error("Không tìm thấy tài khoản");
        if (Math.abs(acc.balance || 0) > 0) throw new Error("Không thể xóa tài khoản có số dư khác 0");
        // Check if any journal lines reference this account
        const allLines = JSON.parse(localStorage.getItem(LOCAL_LINES_KEY) || "[]");
        const hasLines = allLines.some((l: any) => l.account_id === accountId);
        if (hasLines) throw new Error("Không thể xóa tài khoản đã có phát sinh bút toán");
        const filtered = list.filter(a => a.id !== accountId);
        localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(filtered));
        return;
      }
      const { error } = await supabase
        .from("chart_of_accounts")
        .delete()
        .eq("id", accountId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts", companyId] });
      toast.success("Đã xóa tài khoản");
    },
    onError: (e: any) => {
      toast.error("Lỗi: " + e.message);
    }
  });

  return {
    accounts,
    entries,
    lines,
    isLoading,
    initAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    createManualEntry,
    voidJournalEntry
  };
}
