import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";

export interface GenerateKeyParams {
  key_name: string;
  partner_type: string;
  scopes: string[];
  allowed_ips?: string[];
  allowed_domains?: string[];
  expires_at?: string | null;
}

export function useApiGateway() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ["api-keys", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const generateKey = useMutation({
    mutationFn: async (params: GenerateKeyParams) => {
      const prefix = `ERP_${params.partner_type.toUpperCase()}`;
      const hash = `${prefix}_${companyId?.substring(0, 8)}_${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

      const { data, error } = await supabase.from("api_keys" as any).insert({
        company_id: companyId,
        key_name: params.key_name,
        partner_type: params.partner_type,
        scopes: params.scopes,
        api_key_hash: hash,
        key_prefix: prefix,
        allowed_ips: params.allowed_ips?.length ? params.allowed_ips : null,
        allowed_domains: params.allowed_domains?.length ? params.allowed_domains : null,
        expires_at: params.expires_at || null,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "Đã tạo API Key thành công" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const revokeKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from("api_keys" as any)
        .update({ is_active: false })
        .eq("id", keyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "Đã thu hồi API Key" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return { apiKeys, isLoading, generateKey, revokeKey };
}
