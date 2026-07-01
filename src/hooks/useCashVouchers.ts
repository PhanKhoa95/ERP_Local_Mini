import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompanyContext } from "./useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { erpEventBus } from "@/lib/erpEventBus";
import { logLocalAction } from "@/lib/localInventoryStore";
import { toast } from "sonner";

// ──────────────────────── Types ────────────────────────
export type VoucherType = "receipt" | "payment"; // Phiếu thu / Phiếu chi

export interface CashVoucher {
  id: string;
  voucher_number: string; // PT-0001 / PC-0001
  voucher_type: VoucherType;
  partner_id: string | null;
  partner_name: string;
  amount: number;
  payment_method: "cash" | "bank_transfer" | "other";
  account_id: string; // Tài khoản đối ứng (expense/revenue/debt account)
  description: string;
  reference: string | null;
  status: "draft" | "confirmed" | "voided";
  created_by: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  voided_at: string | null;
  created_at: string;
  company_id: string;
  project_id: string | null;
}

// ──────────────────────── Storage Keys ────────────────────────
const VOUCHERS_KEY = "erp-mini-local-demo-cash-vouchers";
const PARTNERS_KEY = "erp-mini-local-demo-partners";
const LOCAL_ACCOUNTS_KEY = "erp-mini-local-demo-accounts";
const LOCAL_ENTRIES_KEY = "erp-mini-local-demo-journal-entries";
const LOCAL_LINES_KEY = "erp-mini-local-demo-journal-lines";

// ──────────────────────── Helpers ────────────────────────
function getLocalVouchers(): CashVoucher[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(VOUCHERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalVouchers(v: CashVoucher[]) {
  localStorage.setItem(VOUCHERS_KEY, JSON.stringify(v));
}

function getLocalPartners(): any[] {
  try {
    return JSON.parse(localStorage.getItem(PARTNERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function nextVoucherNumber(type: VoucherType, existing: CashVoucher[]): string {
  const prefix = type === "receipt" ? "PT" : "PC";
  const sameType = existing.filter(v => v.voucher_type === type);
  const maxNum = sameType.reduce((max, v) => {
    const num = parseInt(v.voucher_number.replace(`${prefix}-`, ""), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `${prefix}-${String(maxNum + 1).padStart(4, "0")}`;
}

// ──────────────────────── Hook ────────────────────────
export function useCashVouchers() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();

  // Query vouchers
  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["cash-vouchers", companyId],
    queryFn: () => {
      if (isLocalDemoAuthEnabled()) {
        return getLocalVouchers().filter(v => v.company_id === companyId);
      }
      return [] as CashVoucher[];
    },
    enabled: !!companyId,
  });

  // Query partners for dropdown
  const { data: partners = [] } = useQuery({
    queryKey: ["partners-for-vouchers"],
    queryFn: () => {
      if (isLocalDemoAuthEnabled()) return getLocalPartners();
      return [] as any[];
    },
  });

  // Create voucher (draft)
  const createVoucher = useMutation({
    mutationFn: async (payload: {
      voucher_type: VoucherType;
      partner_id: string | null;
      partner_name: string;
      amount: number;
      payment_method: "cash" | "bank_transfer" | "other";
      account_id: string;
      description: string;
      reference?: string | null;
      project_id?: string | null;
    }) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");

      if (payload.voucher_type === "payment" && payload.project_id) {
        const localProjects = JSON.parse(localStorage.getItem("erp-mini-local-demo-projects") || "[]");
        const project = localProjects.find((p: any) => p.id === payload.project_id);
        if (project && project.budget !== null && project.budget !== undefined) {
          const vouchers = getLocalVouchers();
          const existingCost = vouchers
            .filter((v: any) => v.project_id === payload.project_id && v.voucher_type === "payment" && v.status !== "voided")
            .reduce((sum: number, v: any) => sum + (v.amount || 0), 0);
          
          if (existingCost + payload.amount > project.budget) {
            throw new Error("Không thể tạo phiếu chi: Tổng chi phí vượt quá ngân sách được phê duyệt của dự án.");
          }
        }
      }

      const all = getLocalVouchers();
      const now = new Date().toISOString();
      const newV: CashVoucher = {
        id: `cv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        voucher_number: nextVoucherNumber(payload.voucher_type, all),
        voucher_type: payload.voucher_type,
        partner_id: payload.partner_id,
        partner_name: payload.partner_name,
        amount: payload.amount,
        payment_method: payload.payment_method,
        account_id: payload.account_id,
        description: payload.description,
        reference: payload.reference || null,
        status: "draft",
        created_by: "current-user",
        confirmed_by: null,
        confirmed_at: null,
        voided_at: null,
        created_at: now,
        company_id: companyId,
        project_id: payload.project_id || null,
      };
      all.unshift(newV);
      saveLocalVouchers(all);
      return newV;
    },
    onSuccess: (v) => {
      queryClient.invalidateQueries({ queryKey: ["cash-vouchers"] });
      toast.success(`Đã tạo ${v.voucher_type === "receipt" ? "Phiếu thu" : "Phiếu chi"} ${v.voucher_number}`);
    },
    onError: (e: Error) => toast.error("Lỗi: " + e.message),
  });

  // Confirm voucher → post accounting + fire PAYMENT_RECORDED
  const confirmVoucher = useMutation({
    mutationFn: async (voucherId: string) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      const all = getLocalVouchers();
      const idx = all.findIndex(v => v.id === voucherId);
      if (idx === -1) throw new Error("Không tìm thấy phiếu");
      const v = all[idx];
      if (v.status !== "draft") throw new Error("Chỉ xác nhận được phiếu ở trạng thái Nháp");

      const now = new Date().toISOString();
      v.status = "confirmed";
      v.confirmed_by = "current-user";
      v.confirmed_at = now;
      saveLocalVouchers(all);

      // ── Post accounting journal entry ──
      const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || "[]");
      const entries = JSON.parse(localStorage.getItem(LOCAL_ENTRIES_KEY) || "[]");
      const jLines = JSON.parse(localStorage.getItem(LOCAL_LINES_KEY) || "[]");

      if (accounts.length > 0) {
        const entryId = `ent-voucher-${v.id}`;
        const entryDate = now.split("T")[0];
        const isReceipt = v.voucher_type === "receipt";
        const cashAccId = v.payment_method === "bank_transfer" ? "acc-1121" : "acc-1111";
        const cashAccCode = v.payment_method === "bank_transfer" ? "1121" : "1111";

        // Retrieve project details for ledger tag matching
        const localProjects = JSON.parse(localStorage.getItem("erp-mini-local-demo-projects") || "[]");
        const proj = localProjects.find((p: any) => p.id === v.project_id);
        const projTag = proj ? ` [${proj.code}]` : "";

        entries.unshift({
          id: entryId,
          company_id: companyId,
          entry_date: entryDate,
          description: `${isReceipt ? "Phiếu thu" : "Phiếu chi"} ${v.voucher_number}: ${v.description}${projTag}`,
          status: "posted",
          source_type: "cash_voucher",
          source_id: v.id,
          created_by: "system",
          posted_by: "system",
          created_at: now,
          updated_at: now,
        });

        if (isReceipt) {
          // Phiếu thu: Dr Cash/Bank, Cr contra account
          jLines.push(
            { id: `line-vr-dr-${v.id}`, entry_id: entryId, account_id: cashAccId, debit: v.amount, credit: 0, memo: `Thu tiền ${v.voucher_number} - ${v.partner_name}${projTag}`, created_at: now },
            { id: `line-vr-cr-${v.id}`, entry_id: entryId, account_id: v.account_id, debit: 0, credit: v.amount, memo: `${v.description}${projTag}`, created_at: now }
          );
          // Update balances
          accounts.forEach((a: any) => {
            if (a.id === cashAccId) a.balance = (a.balance || 0) + v.amount;
            if (a.id === v.account_id) {
              // Contra: if liability/revenue → credit increases, if asset → credit decreases
              if (a.account_type === "asset") {
                a.balance = (a.balance || 0) - v.amount;
              } else {
                a.balance = (a.balance || 0) + v.amount;
              }
            }
          });
        } else {
          // Phiếu chi: Dr contra account, Cr Cash/Bank
          jLines.push(
            { id: `line-vp-dr-${v.id}`, entry_id: entryId, account_id: v.account_id, debit: v.amount, credit: 0, memo: `${v.description}${projTag}`, created_at: now },
            { id: `line-vp-cr-${v.id}`, entry_id: entryId, account_id: cashAccId, debit: 0, credit: v.amount, memo: `Chi tiền ${v.voucher_number} - ${v.partner_name}${projTag}`, created_at: now }
          );
          // Update balances
          accounts.forEach((a: any) => {
            if (a.id === cashAccId) a.balance = (a.balance || 0) - v.amount;
            if (a.id === v.account_id) {
              if (a.account_type === "liability") {
                a.balance = (a.balance || 0) - v.amount;
              } else {
                a.balance = (a.balance || 0) + v.amount;
              }
            }
          });
        }

        localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
        localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(entries));
        localStorage.setItem(LOCAL_LINES_KEY, JSON.stringify(jLines));
      }

      // ── Fire PAYMENT_RECORDED event for downstream listeners ──
      const txType = v.voucher_type === "receipt" ? "payment_in" : "payment_out";
      erpEventBus.publish("PAYMENT_RECORDED", {
        transaction: {
          id: `tx-voucher-${v.id}`,
          company_id: companyId,
          partner_id: v.partner_id,
          order_id: null,
          transaction_type: txType,
          amount: v.amount,
          payment_method: v.payment_method === "bank_transfer" ? "bank_transfer" : "cash",
          reference_number: v.voucher_number,
          notes: v.description,
          transaction_date: now,
          created_at: now,
        },
      });

      logLocalAction(
        `Xác nhận ${v.voucher_type === "receipt" ? "Phiếu thu" : "Phiếu chi"} ${v.voucher_number}`,
        "cash_vouchers", v.id, null, { amount: v.amount, partner: v.partner_name }
      );

      return v;
    },
    onSuccess: (v) => {
      queryClient.invalidateQueries({ queryKey: ["cash-vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["journal-entries-and-lines"] });
      toast.success(`Đã xác nhận ${v.voucher_number} — bút toán kế toán đã ghi sổ tự động`);
    },
    onError: (e: Error) => toast.error("Lỗi: " + e.message),
  });

  // Void voucher
  const voidVoucher = useMutation({
    mutationFn: async (voucherId: string) => {
      const all = getLocalVouchers();
      const idx = all.findIndex(v => v.id === voucherId);
      if (idx === -1) throw new Error("Không tìm thấy phiếu");
      const v = all[idx];
      if (v.status === "voided") throw new Error("Phiếu đã bị hủy");

      v.status = "voided";
      v.voided_at = new Date().toISOString();
      saveLocalVouchers(all);

      // If was confirmed, reverse the journal entry
      if (v.confirmed_at) {
        const entries = JSON.parse(localStorage.getItem(LOCAL_ENTRIES_KEY) || "[]");
        const entryIdx = entries.findIndex((e: any) => e.id === `ent-voucher-${v.id}`);
        if (entryIdx !== -1) {
          entries[entryIdx].status = "voided";
          entries[entryIdx].description = `[HỦY] ${entries[entryIdx].description}`;
          localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(entries));
        }

        // Reverse account balances
        const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || "[]");
        const cashAccId = v.payment_method === "bank_transfer" ? "acc-1121" : "acc-1111";
        const isReceipt = v.voucher_type === "receipt";
        accounts.forEach((a: any) => {
          if (a.id === cashAccId) {
            a.balance = (a.balance || 0) + (isReceipt ? -v.amount : v.amount);
          }
          if (a.id === v.account_id) {
            if (isReceipt) {
              if (a.account_type === "asset") a.balance = (a.balance || 0) + v.amount;
              else a.balance = (a.balance || 0) - v.amount;
            } else {
              if (a.account_type === "liability") a.balance = (a.balance || 0) + v.amount;
              else a.balance = (a.balance || 0) - v.amount;
            }
          }
        });
        localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
      }

      return v;
    },
    onSuccess: (v) => {
      queryClient.invalidateQueries({ queryKey: ["cash-vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["journal-entries-and-lines"] });
      toast.success(`Đã hủy ${v.voucher_number}`);
    },
    onError: (e: Error) => toast.error("Lỗi: " + e.message),
  });

  return {
    vouchers,
    partners,
    isLoading,
    createVoucher,
    confirmVoucher,
    voidVoucher,
  };
}
