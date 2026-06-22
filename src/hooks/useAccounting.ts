import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { useAuth } from "./useAuth";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
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
  { id: "acc-1111", company_id: companyId, code: "1111", name: "Tiền mặt", account_type: "asset", balance: 50000000, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-1121", company_id: companyId, code: "1121", name: "Tiền gửi ngân hàng", account_type: "asset", balance: 150000000, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-131", company_id: companyId, code: "131", name: "Phải thu khách hàng", account_type: "asset", balance: 12000000, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-156", company_id: companyId, code: "156", name: "Hàng hóa", account_type: "asset", balance: 45000000, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-331", company_id: companyId, code: "331", name: "Phải trả người bán", account_type: "liability", balance: 25000000, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-4111", company_id: companyId, code: "4111", name: "Vốn góp chủ sở hữu", account_type: "equity", balance: 200000000, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-511", company_id: companyId, code: "511", name: "Doanh thu bán hàng", account_type: "revenue", balance: 75000000, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-632", company_id: companyId, code: "632", name: "Giá vốn bán hàng", account_type: "expense", balance: 42000000, parent_id: null, is_active: true, created_at: new Date().toISOString() },
  { id: "acc-642", company_id: companyId, code: "642", name: "Chi phí quản lý doanh nghiệp", account_type: "expense", balance: 15000000, parent_id: null, is_active: true, created_at: new Date().toISOString() }
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

function getLocalEntries(companyId: string, accounts: ChartOfAccount[]): { entries: JournalEntry[], lines: JournalLine[] } {
  if (typeof window === "undefined") return { entries: [], lines: [] };
  const rawEntries = localStorage.getItem(LOCAL_ENTRIES_KEY);
  const rawLines = localStorage.getItem(LOCAL_LINES_KEY);
  
  if (!rawEntries || !rawLines) {
    const sampleEntries: JournalEntry[] = [
      {
        id: "ent-1",
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
      }
    ];

    const sampleLines: JournalLine[] = [
      { id: "line-1-1", entry_id: "ent-1", account_id: "acc-1111", debit: 5000000, credit: 0, memo: "Thu tiền mặt", created_at: new Date().toISOString() },
      { id: "line-1-2", entry_id: "ent-1", account_id: "acc-511", debit: 0, credit: 5000000, memo: "Doanh thu bán hàng", created_at: new Date().toISOString() }
    ];

    localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(sampleEntries));
    localStorage.setItem(LOCAL_LINES_KEY, JSON.stringify(sampleLines));
    return { entries: sampleEntries, lines: sampleLines };
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

  return {
    accounts,
    entries,
    lines,
    isLoading,
    initAccounts,
    createAccount,
    createManualEntry,
    voidJournalEntry
  };
}
