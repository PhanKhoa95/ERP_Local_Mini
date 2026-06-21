import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import { invalidateSalesAgentRelated } from "@/lib/queryInvalidation";

export function useSalesLeads() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["sales-leads", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("sales_leads" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...patch }: any) => {
      const { error } = await supabase.from("sales_leads" as any).update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateSalesAgentRelated(queryClient);
      toast({ title: "Đã cập nhật lead" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return { leads, isLoading, updateLead };
}

export function useSalesConversations() {
  const { companyId } = useCompanyContext();
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["sales-conversations", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("sales_conversations" as any)
        .select("*, sales_leads(contact_name, contact_phone, status, score, estimated_value)")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });
  return { conversations, isLoading };
}

export function useSalesMessages(conversationId?: string) {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["sales-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("sales_messages" as any)
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!conversationId,
  });
  return { messages, isLoading };
}

export function useSalesAgentConfig() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery({
    queryKey: ["sales-agent-config", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from("sales_agent_config" as any)
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();
      return data as any;
    },
    enabled: !!companyId,
  });

  const upsertConfig = useMutation({
    mutationFn: async (patch: any) => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase
        .from("sales_agent_config" as any)
        .upsert({ company_id: companyId, ...patch }, { onConflict: "company_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-agent-config"] });
      toast({ title: "Đã lưu cấu hình" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return { config, isLoading, upsertConfig };
}

export async function sendSalesAgentMessage(payload: {
  message: string;
  conversation_id?: string;
  session_token?: string;
  company_id?: string;
  lead_info?: { contact_name?: string; contact_phone?: string; contact_email?: string };
}) {
  const { data, error } = await supabase.functions.invoke("sales-agent", { body: payload });
  if (error) throw error;
  return data;
}
