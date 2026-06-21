import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function useTokenLedger() {
  const { companyId } = useCompanyContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: balances = [], isLoading: balLoading } = useQuery({
    queryKey: ["token-balances", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("token_balances")
        .select("*")
        .eq("company_id", companyId!);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId,
  });

  const { data: ledger = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ["token-ledger", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("token_ledger")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!companyId,
  });

  const myBalance = balances.find(b => b.user_id === user?.id && !b.project_id)?.balance || 0;

  const issueTokens = useMutation({
    mutationFn: async (params: { target_user_id: string; amount: number; token_type?: string; project_id?: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-tokens", {
        body: { action: "issue", ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["token-balances"] });
      qc.invalidateQueries({ queryKey: ["token-ledger"] });
      toast({ title: "Đã phát hành token" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const transferTokens = useMutation({
    mutationFn: async (params: { to_user_id: string; amount: number }) => {
      const { data, error } = await supabase.functions.invoke("manage-tokens", {
        body: { action: "transfer", ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["token-balances"] });
      qc.invalidateQueries({ queryKey: ["token-ledger"] });
      toast({ title: "Đã chuyển token" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const exchangeVoucher = useMutation({
    mutationFn: async (params: { amount: number; voucher_discount?: number }) => {
      const { data, error } = await supabase.functions.invoke("manage-tokens", {
        body: { action: "exchange", ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["token-balances"] });
      qc.invalidateQueries({ queryKey: ["token-ledger"] });
      toast({ title: "Đã đổi voucher", description: `Mã: ${data.voucher_code}` });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return {
    balances, ledger, myBalance,
    isLoading: balLoading || ledgerLoading,
    issueTokens, transferTokens, exchangeVoucher,
  };
}
