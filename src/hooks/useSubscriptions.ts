import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";

export interface Subscription {
  id: string;
  company_id: string;
  plan_type: "starter" | "growth" | "enterprise";
  status: "active" | "trialing" | "past_due" | "canceled";
  current_period_start: string;
  current_period_end: string;
  payment_gateway: string | null;
  gateway_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscriptions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: subscription = null, isLoading } = useQuery({
    queryKey: ["subscription", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from("subscriptions" as any)
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

      if (error) throw error;
      
      // If no subscription exists, auto-create a trial subscription
      if (!data) {
        const { data: newSub, error: createError } = await supabase
          .from("subscriptions" as any)
          .insert({
            company_id: companyId,
            plan_type: "starter",
            status: "trialing",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
          })
          .select()
          .single();
        
        if (!createError && newSub) {
          return newSub as unknown as Subscription;
        }
      }
      
      return data as unknown as Subscription;
    },
    enabled: !!companyId,
  });

  const upgradePlan = useMutation({
    mutationFn: async (plan: "starter" | "growth" | "enterprise") => {
      if (!companyId || !subscription) return null;

      const { data, error } = await supabase
        .from("subscriptions" as any)
        .update({
          plan_type: plan,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .eq("id", subscription.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", companyId] });
      toast({ title: "Nâng cấp gói cước thành công!" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Lỗi nâng cấp", description: e.message }),
  });

  return { subscription, isLoading, upgradePlan };
}
