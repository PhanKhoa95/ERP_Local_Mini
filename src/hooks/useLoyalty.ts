import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { useToast } from "@/hooks/use-toast";

export interface LoyaltySettings {
  id?: string;
  company_id: string;
  is_enabled: boolean;
  point_ratio_money: number;
  point_ratio_points: number;
  redeem_ratio_points: number;
  redeem_ratio_money: number;
  no_point_discounted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReferralSettings {
  id?: string;
  company_id: string;
  referrer_reward_points: number;
  referee_discount_amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface LoyaltyTransaction {
  id: string;
  partner_id: string;
  order_id: string | null;
  points: number;
  transaction_type: "earn" | "redeem" | "refund" | "manual_adjust";
  notes: string | null;
  created_at: string;
  order_number?: string;
}

const LOYALTY_SETTINGS_KEY = "erp-mini-loyalty-settings";
const REFERRAL_SETTINGS_KEY = "erp-mini-referral-settings";
const LOYALTY_TRANSACTIONS_KEY = "erp-mini-loyalty-transactions";

const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  company_id: "demo",
  is_enabled: true,
  point_ratio_money: 10000,
  point_ratio_points: 1,
  redeem_ratio_points: 1,
  redeem_ratio_money: 1000,
  no_point_discounted: true
};

const DEFAULT_REFERRAL_SETTINGS: ReferralSettings = {
  company_id: "demo",
  referrer_reward_points: 50,
  referee_discount_amount: 50000
};

// Helper for local demo mode
export function getLocalLoyaltySettings(): LoyaltySettings {
  const raw = localStorage.getItem(LOYALTY_SETTINGS_KEY);
  if (!raw) {
    localStorage.setItem(LOYALTY_SETTINGS_KEY, JSON.stringify(DEFAULT_LOYALTY_SETTINGS));
    return DEFAULT_LOYALTY_SETTINGS;
  }
  return JSON.parse(raw);
}

export function getLocalReferralSettings(): ReferralSettings {
  const raw = localStorage.getItem(REFERRAL_SETTINGS_KEY);
  if (!raw) {
    localStorage.setItem(REFERRAL_SETTINGS_KEY, JSON.stringify(DEFAULT_REFERRAL_SETTINGS));
    return DEFAULT_REFERRAL_SETTINGS;
  }
  return JSON.parse(raw);
}

export function getLocalLoyaltyTransactions(partnerId?: string): LoyaltyTransaction[] {
  const raw = localStorage.getItem(LOYALTY_TRANSACTIONS_KEY);
  const txs: LoyaltyTransaction[] = raw ? JSON.parse(raw) : [];
  if (partnerId) {
    return txs.filter(t => t.partner_id === partnerId);
  }
  return txs;
}

export function useLoyaltySettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings = DEFAULT_LOYALTY_SETTINGS, isLoading } = useQuery({
    queryKey: ["loyalty-settings"],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        return getLocalLoyaltySettings();
      }
      const { data, error } = await supabase
        .from("loyalty_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data ? (data as unknown as LoyaltySettings) : DEFAULT_LOYALTY_SETTINGS;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<LoyaltySettings>) => {
      if (isLocalDemoAuthEnabled()) {
        const current = getLocalLoyaltySettings();
        const updated = { ...current, ...newSettings };
        localStorage.setItem(LOYALTY_SETTINGS_KEY, JSON.stringify(updated));
        return updated;
      }
      // Check if settings exist
      const { data: existing } = await supabase
        .from("loyalty_settings")
        .select("id")
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("loyalty_settings")
          .update(newSettings)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as LoyaltySettings;
      } else {
        const { data, error } = await supabase
          .from("loyalty_settings")
          .insert({
            company_id: "demo",
            ...newSettings
          } as any)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as LoyaltySettings;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-settings"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật cài đặt tích điểm."
      });
    }
  });

  return { settings, isLoading, updateSettings: updateMutation.mutate };
}

export function useReferralSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings = DEFAULT_REFERRAL_SETTINGS, isLoading } = useQuery({
    queryKey: ["referral-settings"],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        return getLocalReferralSettings();
      }
      const { data, error } = await supabase
        .from("referral_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data ? (data as unknown as ReferralSettings) : DEFAULT_REFERRAL_SETTINGS;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<ReferralSettings>) => {
      if (isLocalDemoAuthEnabled()) {
        const current = getLocalReferralSettings();
        const updated = { ...current, ...newSettings };
        localStorage.setItem(REFERRAL_SETTINGS_KEY, JSON.stringify(updated));
        return updated;
      }
      const { data: existing } = await supabase
        .from("referral_settings")
        .select("id")
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("referral_settings")
          .update(newSettings)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as ReferralSettings;
      } else {
        const { data, error } = await supabase
          .from("referral_settings")
          .insert({
            company_id: "demo",
            ...newSettings
          } as any)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as ReferralSettings;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral-settings"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật cài đặt giới thiệu."
      });
    }
  });

  return { settings, isLoading, updateSettings: updateMutation.mutate };
}

export function useLoyaltyTransactions(partnerId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["loyalty-transactions", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      if (isLocalDemoAuthEnabled()) {
        const txs = getLocalLoyaltyTransactions(partnerId);
        // Map order_number for display
        const localOrdersRaw = localStorage.getItem("erp-mini-local-demo-orders");
        const orders = localOrdersRaw ? JSON.parse(localOrdersRaw) : [];
        return txs.map(t => {
          const order = orders.find((o: any) => o.id === t.order_id);
          return {
            ...t,
            order_number: order ? order.order_number : undefined
          };
        });
      }
      const { data, error } = await supabase
        .from("loyalty_transactions")
        .select("*, orders(order_number)")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        order_number: t.orders?.order_number
      })) as LoyaltyTransaction[];
    },
    enabled: !!partnerId
  });

  const adjustPointsMutation = useMutation({
    mutationFn: async ({ partnerId, points, notes }: { partnerId: string; points: number; notes: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const currentTxs = getLocalLoyaltyTransactions();
        const newTx: LoyaltyTransaction = {
          id: `tx-${Math.random().toString(36).substr(2, 9)}`,
          partner_id: partnerId,
          order_id: null,
          points,
          transaction_type: "manual_adjust",
          notes,
          created_at: new Date().toISOString()
        };
        localStorage.setItem(LOYALTY_TRANSACTIONS_KEY, JSON.stringify([newTx, ...currentTxs]));

        // Update partner's loyalty_points
        const partnersRaw = localStorage.getItem("erp-mini-local-demo-partners");
        const partners = partnersRaw ? JSON.parse(partnersRaw) : [];
        const updatedPartners = partners.map((p: any) => {
          if (p.id === partnerId) {
            return {
              ...p,
              loyalty_points: (p.loyalty_points || 0) + points
            };
          }
          return p;
        });
        localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify(updatedPartners));
        return newTx;
      }

      const { data, error } = await supabase
        .from("loyalty_transactions")
        .insert({
          partner_id: partnerId,
          points,
          transaction_type: "manual_adjust",
          notes
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as LoyaltyTransaction;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-transactions", variables.partnerId] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["partner", variables.partnerId] });
      toast({
        title: "Thành công",
        description: `Đã điều chỉnh ${variables.points >= 0 ? "+" : ""}${variables.points} điểm thành công.`
      });
    }
  });

  return { transactions, isLoading, adjustPoints: adjustPointsMutation.mutateAsync };
}
