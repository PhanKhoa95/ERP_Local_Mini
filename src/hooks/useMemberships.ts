import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getLocalPartners } from "@/hooks/usePartners";
import { useAuditLogs } from "@/hooks/useAuditLogs";

export type MembershipTier = string;
export type MembershipStatus = "active" | "locked" | "expired";
export type TransactionType = "deposit" | "payment" | "refund" | "adjust";

export interface MembershipTierConfig {
  id: string;
  name: string;
  color: string;
  bg_gradient: string;
  discount_rate: number;
  min_spent: number;
  description?: string;
  card_background_image?: string;
}

export interface Membership {
  id: string;
  partner_id: string;
  card_number: string;
  tier: MembershipTier;
  balance: number; // Tài khoản mua hàng
  points: number; // Điểm tích luỹ
  status: MembershipStatus;
  issue_date: string;
  expiry_date: string;
  notes: string;
  card_image?: string;
}

export interface MembershipTransaction {
  id: string;
  membership_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  created_at: string;
}

const MEMBERSHIP_STORAGE_KEY = "erp-mini-local-demo-memberships";
const TRANSACTION_STORAGE_KEY = "erp-mini-local-demo-membership-transactions";
export const TIER_CONFIGS_STORAGE_KEY = "erp-mini-local-demo-membership-tiers-config";

export const DEFAULT_TIER_CONFIGS: MembershipTierConfig[] = [
  {
    id: "bronze",
    name: "Đồng (Bronze)",
    color: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900",
    bg_gradient: "from-amber-700 via-amber-800 to-amber-950 text-amber-50 shadow-amber-950/20",
    discount_rate: 0,
    min_spent: 0,
    description: "Thành viên mới phát hành thẻ"
  },
  {
    id: "silver",
    name: "Bạc (Silver)",
    color: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
    bg_gradient: "from-slate-500 via-slate-600 to-slate-800 text-slate-50 shadow-slate-900/20",
    discount_rate: 2,
    min_spent: 5000000,
    description: "Tích lũy chi tiêu từ 5 triệu đồng"
  },
  {
    id: "gold",
    name: "Vàng (Gold)",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-900",
    bg_gradient: "from-amber-400 via-yellow-500 to-amber-600 text-yellow-950 shadow-yellow-500/10",
    discount_rate: 5,
    min_spent: 15000000,
    description: "Tích lũy chi tiêu từ 15 triệu đồng"
  },
  {
    id: "diamond",
    name: "Kim Cương (Diamond)",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-900",
    bg_gradient: "from-cyan-500 via-blue-600 to-indigo-800 text-cyan-50 shadow-blue-800/20",
    discount_rate: 10,
    min_spent: 50000000,
    description: "Tích lũy chi tiêu từ 50 triệu đồng"
  }
];

export const TIER_LABELS: Record<string, string> = {
  bronze: "Đồng (Bronze)",
  silver: "Bạc (Silver)",
  gold: "Vàng (Gold)",
  diamond: "Kim Cương (Diamond)",
};

export const TIER_COLORS: Record<string, string> = {
  bronze: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900",
  silver: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
  gold: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-900",
  diamond: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-900",
};

export const STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Đang hoạt động",
  locked: "Tạm khóa",
  expired: "Hết hạn",
};

export const STATUS_COLORS: Record<MembershipStatus, string> = {
  active: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900",
  locked: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
  expired: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-900",
};

export const TRANSACTION_LABELS: Record<TransactionType, string> = {
  deposit: "Nạp tiền",
  payment: "Thanh toán đơn hàng",
  refund: "Hoàn tiền",
  adjust: "Điều chỉnh số dư",
};

function seedDefaultMemberships(): { memberships: Membership[]; transactions: MembershipTransaction[] } {
  // Try to load partners to link
  const localPartners = getLocalPartners("default-company"); // Default company context in demo mode
  const customers = localPartners.filter((p: any) => p.partner_type === "customer");
  
  const memberships: Membership[] = [];
  const transactions: MembershipTransaction[] = [];

  const tiers: MembershipTier[] = ["bronze", "silver", "gold", "diamond"];

  customers.forEach((c: any, index: number) => {
    // Only seed cards for even index customers so there are cardless customers left for test issuance
    if (index % 2 !== 0) return;

    // Determine tier based on customer promotion segment
    let tier: MembershipTier = "bronze";
    let balance = 0;
    let points = 0;

    if (c.promo_segment === "loyalty") {
      tier = index % 4 === 0 ? "diamond" : "gold";
      balance = index % 4 === 0 ? 5000000 : 1500000;
      points = index % 4 === 0 ? 1200 : 450;
    } else if (c.promo_segment === "wholesale") {
      tier = "silver";
      balance = 2000000;
      points = 300;
    } else {
      tier = "bronze";
      balance = index % 3 === 0 ? 200000 : 0;
      points = index % 3 === 0 ? 50 : 10;
    }

    const cardNum = `MEM-${c.phone ? c.phone.slice(-6) : (100000 + index).toString()}`;
    const mId = `mem-${c.id}`;

    memberships.push({
      id: mId,
      partner_id: c.id,
      card_number: cardNum,
      tier,
      balance,
      points,
      status: "active",
      issue_date: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
      expiry_date: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
      notes: "Phát hành thẻ thành viên tự động",
    });

    if (balance > 0) {
      transactions.push({
        id: `tx-${mId}-init`,
        membership_id: mId,
        type: "deposit",
        amount: balance,
        description: "Nạp tiền kích hoạt tài khoản mua hàng",
        created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      });
    }
  });

  localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(memberships));
  localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(transactions));

  return { memberships, transactions };
}

export function useMemberships() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLogs();

  const { data: memberships = [], isLoading: membershipsLoading } = useQuery({
    queryKey: ["memberships"],
    queryFn: async () => {
      const raw = localStorage.getItem(MEMBERSHIP_STORAGE_KEY);
      if (!raw) {
        return seedDefaultMemberships().memberships;
      }
      return JSON.parse(raw) as Membership[];
    },
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["membership-transactions"],
    queryFn: async () => {
      const raw = localStorage.getItem(TRANSACTION_STORAGE_KEY);
      if (!raw) {
        return seedDefaultMemberships().transactions;
      }
      return JSON.parse(raw) as MembershipTransaction[];
    },
  });

  const { data: tierConfigs = [], isLoading: tierConfigsLoading } = useQuery({
    queryKey: ["membership-tiers-config"],
    queryFn: async () => {
      const raw = localStorage.getItem(TIER_CONFIGS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(TIER_CONFIGS_STORAGE_KEY, JSON.stringify(DEFAULT_TIER_CONFIGS));
        return DEFAULT_TIER_CONFIGS;
      }
      return JSON.parse(raw) as MembershipTierConfig[];
    },
  });

  const createMembershipTier = useMutation({
    mutationFn: async (newConfig: Omit<MembershipTierConfig, "id"> & { id?: string }) => {
      const all = [...tierConfigs];
      const id = newConfig.id || `tier-${Date.now()}`;
      if (all.some(t => t.id === id)) {
        throw new Error("Mã hạng thẻ này đã tồn tại");
      }
      const configWithId: MembershipTierConfig = {
        ...newConfig,
        id
      };
      all.push(configWithId);
      localStorage.setItem(TIER_CONFIGS_STORAGE_KEY, JSON.stringify(all));
      return configWithId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-tiers-config"] });
      toast({ title: "Thêm hạng thẻ mới thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updateMembershipTierConfig = useMutation({
    mutationFn: async (updatedConfig: MembershipTierConfig) => {
      const all = [...tierConfigs];
      const idx = all.findIndex(t => t.id === updatedConfig.id);
      if (idx === -1) throw new Error("Không tìm thấy cấu hình hạng thẻ");
      all[idx] = updatedConfig;
      localStorage.setItem(TIER_CONFIGS_STORAGE_KEY, JSON.stringify(all));
      return updatedConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-tiers-config"] });
      toast({ title: "Cập nhật cấu hình hạng thẻ thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const deleteMembershipTier = useMutation({
    mutationFn: async (id: string) => {
      const isUsed = memberships.some(m => m.tier === id);
      if (isUsed) {
        throw new Error("Không thể xóa hạng thẻ này vì hiện đang có thành viên sở hữu hạng thẻ này");
      }
      const all = tierConfigs.filter(t => t.id !== id);
      localStorage.setItem(TIER_CONFIGS_STORAGE_KEY, JSON.stringify(all));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership-tiers-config"] });
      toast({ title: "Xóa cấu hình hạng thẻ thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const createMembership = useMutation({
    mutationFn: async (membership: Omit<Membership, "id" | "issue_date" | "balance" | "points">) => {
      const all = [...memberships];
      const newM: Membership = {
        ...membership,
        id: `mem-${Date.now()}`,
        balance: 0,
        points: 0,
        issue_date: new Date().toISOString().split("T")[0],
      };

      if (all.some(m => m.card_number === newM.card_number)) {
        throw new Error("Số thẻ thành viên này đã tồn tại");
      }

      all.unshift(newM);
      localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(all));
      return newM;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast({ title: "Phát hành thẻ thành viên thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updateMembershipStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MembershipStatus }) => {
      const all = [...memberships];
      const idx = all.findIndex(m => m.id === id);
      if (idx === -1) throw new Error("Không tìm thấy thẻ");
      all[idx].status = status;
      localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(all));
      return all[idx];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast({ title: "Cập nhật trạng thái thẻ thành viên thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updateMembershipTier = useMutation({
    mutationFn: async ({ id, tier }: { id: string; tier: MembershipTier }) => {
      const all = [...memberships];
      const idx = all.findIndex(m => m.id === id);
      if (idx === -1) throw new Error("Không tìm thấy thẻ");
      all[idx].tier = tier;
      localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(all));
      return all[idx];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast({ title: "Cập nhật hạng thẻ thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const performTransaction = useMutation({
    mutationFn: async ({
      membershipId,
      type,
      amount,
      description,
    }: {
      membershipId: string;
      type: TransactionType;
      amount: number;
      description: string;
    }) => {
      const allM = [...memberships];
      const allT = [...transactions];

      const mIdx = allM.findIndex(m => m.id === membershipId);
      if (mIdx === -1) throw new Error("Không tìm thấy thẻ");
      const m = allM[mIdx];

      if (type === "payment" && m.balance < amount) {
        throw new Error("Số dư tài khoản mua hàng không đủ để thanh toán");
      }

      if (m.status !== "active") {
        throw new Error("Thẻ thành viên hiện đang tạm khóa hoặc đã hết hạn");
      }

      if (type === "deposit" || type === "refund") {
        m.balance += amount;
      } else if (type === "payment") {
        m.balance -= amount;
        m.points += Math.floor(amount / 10000);
      } else if (type === "adjust") {
        m.balance = amount;
      }

      const newTx: MembershipTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        membership_id: membershipId,
        type,
        amount,
        description,
        created_at: new Date().toISOString(),
      };

      allT.unshift(newTx);
      localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(allM));
      localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(allT));

      try {
        await logAction(
          `${TRANSACTION_LABELS[type]} ví thành viên: ${description}`,
          "membership_transactions",
          newTx.id,
          null,
          {
            membership_id: membershipId,
            card_number: m.card_number,
            amount,
            type,
            description,
          }
        );
      } catch (err) {
        console.warn("Failed to log audit action:", err);
      }

      if (type === "deposit" || type === "refund") {
        try {
          const LOCAL_ACCOUNTS_KEY = "erp-mini-local-demo-accounts";
          const LOCAL_ENTRIES_KEY = "erp-mini-local-demo-journal-entries";
          const LOCAL_LINES_KEY = "erp-mini-local-demo-journal-lines";
          const rawAccounts = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
          if (rawAccounts) {
            const accounts = JSON.parse(rawAccounts);
            const entries = JSON.parse(localStorage.getItem(LOCAL_ENTRIES_KEY) || "[]");
            const jLines = JSON.parse(localStorage.getItem(LOCAL_LINES_KEY) || "[]");

            const configuredOffsetCode = localStorage.getItem("erp-mini-membership-offset-account") || "3387";
            const offsetAccount = accounts.find((a: any) => a.code === configuredOffsetCode || a.id === configuredOffsetCode) || { id: "acc-3387", code: "3387", account_type: "liability" };

            const entryId = `ent-wallet-${newTx.id}`;
            const now = new Date().toISOString();
            const entryDate = now.split("T")[0];
            const isDeposit = type === "deposit";
            const entryDesc = isDeposit
              ? `Nạp ví thành viên: ${description}`
              : `Hoàn tiền ví thành viên: ${description}`;

            entries.unshift({
              id: entryId,
              company_id: "local-demo-company",
              entry_date: entryDate,
              description: entryDesc,
              status: "posted",
              source_type: "membership_wallet",
              source_id: newTx.id,
              created_by: "system",
              posted_by: "system",
              created_at: now,
              updated_at: now,
            });

            if (isDeposit) {
              jLines.push(
                { id: `line-wd-dr-${newTx.id}`, entry_id: entryId, account_id: "acc-1111", debit: amount, credit: 0, memo: `Thu tiền mặt nạp ví (${m.card_number})`, created_at: now },
                { id: `line-wd-cr-${newTx.id}`, entry_id: entryId, account_id: offsetAccount.id, debit: 0, credit: amount, memo: `Ghi nhận nhận trước KH - ví thành viên (${m.card_number})`, created_at: now }
              );
              accounts.forEach((a: any) => {
                if (a.code === "1111") a.balance = (a.balance || 0) + amount;
                if (a.code === offsetAccount.code) {
                  const isAsset = a.account_type === "asset";
                  if (isAsset) {
                    a.balance = (a.balance || 0) - amount;
                  } else {
                    a.balance = (a.balance || 0) + amount;
                  }
                }
              });
            } else {
              jLines.push(
                { id: `line-wd-dr-${newTx.id}`, entry_id: entryId, account_id: offsetAccount.id, debit: amount, credit: 0, memo: `Hoàn tiền ví thành viên (${m.card_number})`, created_at: now },
                { id: `line-wd-cr-${newTx.id}`, entry_id: entryId, account_id: "acc-1111", debit: 0, credit: amount, memo: `Chi tiền mặt hoàn ví (${m.card_number})`, created_at: now }
              );
              accounts.forEach((a: any) => {
                if (a.code === offsetAccount.code) {
                  const isAsset = a.account_type === "asset";
                  if (isAsset) {
                    a.balance = (a.balance || 0) + amount;
                  } else {
                    a.balance = (a.balance || 0) - amount;
                  }
                }
                if (a.code === "1111") a.balance = (a.balance || 0) - amount;
              });
            }

            localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
            localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(entries));
            localStorage.setItem(LOCAL_LINES_KEY, JSON.stringify(jLines));
          }
        } catch (err) {
          console.warn("Accounting auto-posting error:", err);
        }
      }

      return { membership: m, transaction: newTx };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      queryClient.invalidateQueries({ queryKey: ["membership-transactions"] });
      toast({ title: "Thực hiện giao dịch thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const updateMembershipDetails = useMutation({
    mutationFn: async (updated: Partial<Membership> & { id: string }) => {
      const all = [...memberships];
      const idx = all.findIndex(m => m.id === updated.id);
      if (idx === -1) throw new Error("Không tìm thấy thẻ");
      
      if (updated.card_number && updated.card_number !== all[idx].card_number) {
        if (all.some(m => m.card_number === updated.card_number)) {
          throw new Error("Số thẻ thành viên này đã tồn tại");
        }
      }
      
      all[idx] = { ...all[idx], ...updated };
      localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(all));
      return all[idx];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast({ title: "Cập nhật thông tin thẻ thành viên thành công" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  return {
    memberships,
    transactions,
    tierConfigs,
    isLoading: membershipsLoading || transactionsLoading || tierConfigsLoading,
    createMembership,
    updateMembershipStatus,
    updateMembershipTier,
    performTransaction,
    createMembershipTier,
    updateMembershipTierConfig,
    deleteMembershipTier,
    updateMembershipDetails,
  };
}
