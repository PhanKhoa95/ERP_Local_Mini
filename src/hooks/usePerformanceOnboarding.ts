import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { toast } from "sonner";
import { isLocalDemoAuthEnabled, LOCAL_DEMO_USER_ID } from "@/lib/localDemoAuth";

export interface PerformanceOnboarding {
  id: string;
  company_id: string;
  step_completed: number;
  selected_industry: string | null;
  selected_templates: any;
  org_structure: any;
  kbif_config: any;
  imported_employees: number;
  is_completed: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const LOCAL_DEMO_ONBOARDING_KEY = "erp-mini-local-demo-performance-onboarding";

function createDefaultOnboarding(companyId: string): PerformanceOnboarding {
  const now = new Date().toISOString();
  return {
    id: "local-demo-performance-onboarding",
    company_id: companyId,
    step_completed: 0,
    selected_industry: null,
    selected_templates: [],
    org_structure: {},
    kbif_config: {},
    imported_employees: 0,
    is_completed: false,
    created_by: null,
    created_at: now,
    updated_at: now,
  };
}

function readLocalDemoOnboarding(companyId: string): PerformanceOnboarding | null {
  if (!isLocalDemoAuthEnabled()) return null;
  const raw = localStorage.getItem(LOCAL_DEMO_ONBOARDING_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PerformanceOnboarding;
    return parsed.company_id === companyId ? parsed : null;
  } catch {
    localStorage.removeItem(LOCAL_DEMO_ONBOARDING_KEY);
    return null;
  }
}

function writeLocalDemoOnboarding(onboarding: PerformanceOnboarding) {
  localStorage.setItem(LOCAL_DEMO_ONBOARDING_KEY, JSON.stringify(onboarding));
  return onboarding;
}

export function usePerformanceOnboarding() {
  const { companyId, loading: companyLoading } = useCompanyContext();
  const queryClient = useQueryClient();

  const { data: onboarding, isLoading: queryLoading, error } = useQuery({
    queryKey: ["performance-onboarding", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      if (isLocalDemoAuthEnabled()) {
        return readLocalDemoOnboarding(companyId);
      }
      
      const { data, error } = await supabase
        .from("performance_onboarding")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();
      
      if (error) throw error;
      return data as PerformanceOnboarding | null;
    },
    enabled: !!companyId && !companyLoading,
  });

  // Combined loading state - true while company context OR query is loading
  const isLoading = companyLoading || queryLoading || (!companyId && !companyLoading);

  const createOnboarding = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company ID");

      if (isLocalDemoAuthEnabled()) {
        const existing = readLocalDemoOnboarding(companyId);
        if (existing) return existing;
        return writeLocalDemoOnboarding({
          ...createDefaultOnboarding(companyId),
          created_by: LOCAL_DEMO_USER_ID,
        });
      }
      
      const { data, error } = await supabase
        .from("performance_onboarding")
        .insert({
          company_id: companyId,
          step_completed: 0,
          is_completed: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-onboarding", companyId] });
    },
    onError: (error) => {
      toast.error("Lỗi tạo onboarding: " + error.message);
    },
  });

  const updateOnboarding = useMutation({
    mutationFn: async (updates: Partial<PerformanceOnboarding>) => {
      if (!onboarding?.id) throw new Error("No onboarding record");

      if (isLocalDemoAuthEnabled()) {
        return writeLocalDemoOnboarding({
          ...onboarding,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }
      
      const { data, error } = await supabase
        .from("performance_onboarding")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", onboarding.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-onboarding", companyId] });
    },
    onError: (error) => {
      toast.error("Lỗi cập nhật: " + error.message);
    },
  });

  const completeOnboarding = useMutation({
    mutationFn: async () => {
      if (!onboarding?.id) throw new Error("No onboarding record");

      if (isLocalDemoAuthEnabled()) {
        return writeLocalDemoOnboarding({
          ...onboarding,
          is_completed: true,
          step_completed: 6,
          updated_at: new Date().toISOString(),
        });
      }
      
      const { data, error } = await supabase
        .from("performance_onboarding")
        .update({
          is_completed: true,
          step_completed: 6,
          updated_at: new Date().toISOString(),
        })
        .eq("id", onboarding.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-onboarding", companyId] });
      toast.success("Thiết lập hoàn tất!");
    },
    onError: (error) => {
      toast.error("Lỗi hoàn tất: " + error.message);
    },
  });

  return {
    onboarding,
    isLoading,
    error,
    companyId,
    createOnboarding,
    updateOnboarding,
    completeOnboarding,
  };
}
