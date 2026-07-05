import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

// Core Types
export interface CRMLead {
  id: string;
  company_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  status: 'new' | 'contacting' | 'unqualified' | 'converted';
  notes: string | null;
  created_at: string;
}

export interface CRMDeal {
  id: string;
  company_id: string;
  lead_id: string | null;
  title: string;
  amount: number;
  stage: 'new' | 'consulting' | 'quote' | 'negotiating' | 'won' | 'lost';
  priority: 'low' | 'medium' | 'high';
  close_date: string | null;
  created_at: string;
}

export interface CRMAppointment {
  id: string;
  company_id: string;
  customer_name: string;
  phone: string | null;
  appointment_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  purpose: string | null;
  created_at: string;
}

export interface CRMTicket {
  id: string;
  company_id: string;
  customer_name: string;
  phone: string | null;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to: string | null;
  created_at: string;
}

export interface CRMTask {
  id: string;
  company_id: string;
  title: string;
  due_date: string | null;
  status: 'pending' | 'completed';
  notes: string | null;
  created_at: string;
}

// Advanced Types
export interface CRMCompany {
  id: string;
  company_id: string;
  name: string;
  tax_code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface CRMContact {
  id: string;
  company_id: string;
  company_map_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
}

export interface CRMCustomField {
  id: string;
  company_id: string;
  entity_type: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date';
  created_at: string;
}

export interface CRMCustomFieldValue {
  id: string;
  company_id: string;
  entity_type: string;
  entity_id: string;
  field_id: string;
  value: string;
  created_at: string;
}

export interface CRMApiKey {
  id: string;
  company_id: string;
  key_name: string;
  api_key: string;
  created_at: string;
}

// Integration & Automation Types
export interface CRMPosChatSettings {
  company_id: string;
  is_pos_sync_enabled: boolean;
  is_chat_sync_enabled: boolean;
  auto_create_lead_on: 'first_msg' | 'has_phone' | 'both';
  phone_update_rule: 'keep_first' | 'keep_latest';
  sync_tags_enabled: boolean;
  sync_agents_enabled: boolean;
}

export interface CRMLeadForm {
  id: string;
  company_id: string;
  form_name: string;
  platform: 'facebook' | 'tiktok';
  is_active: boolean;
  field_mappings: Record<string, string>; // Maps external key -> crm lead field
  created_at: string;
}

export interface CRMAutomationRule {
  id: string;
  company_id: string;
  rule_name: string;
  trigger_event: 'on_create' | 'on_update';
  conditions: Record<string, any>;
  actions: {
    type: 'create_task' | 'assign_agent' | 'send_notification';
    title?: string;
    due_in_hours?: number;
    agent_id?: string;
    message?: string;
  };
  is_active: boolean;
  created_at: string;
}

// LocalStorage Keys
const LEADS_KEY = "erp-mini-local-demo-crm-leads";
const DEALS_KEY = "erp-mini-local-demo-crm-deals";
const APPOINTMENTS_KEY = "erp-mini-local-demo-crm-appointments";
const TICKETS_KEY = "erp-mini-local-demo-crm-tickets";
const TASKS_KEY = "erp-mini-local-demo-crm-tasks";
const PARTNERS_KEY = "erp-mini-local-demo-partners";

const COMPANIES_KEY = "erp-mini-local-demo-crm-companies";
const CONTACTS_KEY = "erp-mini-local-demo-crm-contacts";
const CUSTOM_FIELDS_KEY = "erp-mini-local-demo-crm-custom-fields";
const CUSTOM_FIELD_VALUES_KEY = "erp-mini-local-demo-crm-custom-field-values";
const API_KEYS_KEY = "erp-mini-local-demo-crm-api-keys";

// Integration & Automation Keys
const POS_CHAT_SETTINGS_KEY = "erp-mini-local-demo-crm-pos-chat-settings";
const LEAD_FORMS_KEY = "erp-mini-local-demo-crm-lead-forms";
const AUTOMATION_RULES_KEY = "erp-mini-local-demo-crm-automation-rules";

// Helper: Get local data
function getLocal<T>(key: string, defaultData: T[]): T[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function saveLocal<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Seed Data
const seedLeads = (companyId: string): CRMLead[] => [
  { id: "lead-1", company_id: companyId, name: "Nguyễn Văn A", phone: "0912345678", email: "vana@gmail.com", source: "facebook", status: "contacting", notes: "Quan tâm đến gói in Sticker số lượng lớn", created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
  { id: "lead-2", company_id: companyId, name: "Trần Thị B", phone: "0987654321", email: null, source: "tiktok", status: "new", notes: "Hỏi về giá sỉ thiệp cảm ơn B2B", created_at: new Date().toISOString() },
  { id: "lead-3", company_id: companyId, name: "Lê Văn C", phone: "0905123456", email: "vanc@example.com", source: "website", status: "converted", notes: "Đã chuyển đổi thành Deal ký hợp đồng", created_at: new Date(Date.now() - 3600000 * 48).toISOString() }
];

const seedDeals = (companyId: string): CRMDeal[] => [
  { id: "deal-1", company_id: companyId, lead_id: "lead-1", title: "In 5000 Sticker Decal", amount: 2500000, stage: "quote", priority: "high", close_date: "2026-07-15", created_at: new Date().toISOString() },
  { id: "deal-2", company_id: companyId, lead_id: null, title: "Hợp đồng in thiệp B2B đối tác", amount: 8000000, stage: "negotiating", priority: "medium", close_date: null, created_at: new Date(Date.now() - 3600000 * 48).toISOString() },
  { id: "deal-3", company_id: companyId, lead_id: "lead-3", title: "Đơn in hộp carton lớn", amount: 25000000, stage: "won", priority: "high", close_date: "2026-07-04", created_at: new Date(Date.now() - 3600000 * 96).toISOString() }
];

const seedAppointments = (companyId: string): CRMAppointment[] => [
  { id: "apt-1", company_id: companyId, customer_name: "Nguyễn Văn A", phone: "0912345678", appointment_time: new Date(Date.now() + 3600000 * 18).toISOString(), status: "scheduled", purpose: "Demo trực tiếp mẫu giấy tại showroom", created_at: new Date().toISOString() },
  { id: "apt-2", company_id: companyId, customer_name: "Chị Hoa", phone: "0934567890", appointment_time: new Date(Date.now() - 3600000 * 4).toISOString(), status: "completed", purpose: "Gọi điện tư vấn báo giá chi tiết sản phẩm", created_at: new Date().toISOString() }
];

const seedTickets = (companyId: string): CRMTicket[] => [
  { id: "tkt-1", company_id: companyId, customer_name: "Anh Nam", phone: "0945123456", title: "Sticker bị lệch màu 5% so với thiết kế", description: "Khách hàng phản ánh lô hàng in ngày 2/7 có 100 sản phẩm bị lệch màu đỏ nhẹ.", priority: "high", status: "in_progress", assigned_to: null, created_at: new Date(Date.now() - 3600000 * 12).toISOString() },
  { id: "tkt-2", company_id: companyId, customer_name: "Chị Hạnh", phone: "0967123456", title: "Tư vấn sai kích thước hộp carton", description: "Hộp nhận về bị bé hơn 2cm so với yêu cầu đóng gói hàng.", priority: "medium", status: "open", assigned_to: null, created_at: new Date().toISOString() }
];

const seedTasks = (companyId: string): CRMTask[] => [
  { id: "tsk-1", company_id: companyId, title: "Gửi báo giá Sticker Decal cho Anh A", due_date: new Date(Date.now() + 3600000 * 2).toISOString(), status: "pending", notes: "Kèm theo file thiết kế nháp", created_at: new Date().toISOString() },
  { id: "tsk-2", company_id: companyId, title: "Kiểm tra tiến độ xử lý ticket của Anh Nam", due_date: new Date().toISOString(), status: "completed", notes: "Đã chuyển xưởng in lại 100 sticker bù", created_at: new Date(Date.now() - 3600000 * 24).toISOString() }
];

const seedCompanies = (companyId: string): CRMCompany[] => [
  { id: "comp-1", company_id: companyId, name: "Công ty TNHH Giải pháp Công nghệ Việt", tax_code: "0102030405", address: "123 Cầu Giấy, Hà Nội", phone: "0243123456", email: "info@congngheviet.vn", created_at: new Date(Date.now() - 3600000 * 96).toISOString() },
  { id: "comp-2", company_id: companyId, name: "Học viện Đào tạo In ấn Quốc tế", tax_code: "0304050607", address: "456 Nguyễn Thị Minh Khai, Q3, TP.HCM", phone: "0283999888", email: "contact@hocvienin.edu.vn", created_at: new Date(Date.now() - 3600000 * 48).toISOString() }
];

const seedContacts = (companyId: string): CRMContact[] => [
  { id: "cont-1", company_id: companyId, company_map_id: "comp-1", name: "Nguyễn Văn Nam", phone: "0912333444", email: "namnv@congngheviet.vn", notes: "Trưởng phòng IT, đầu mối duyệt file thiết kế", created_at: new Date(Date.now() - 3600000 * 96).toISOString() },
  { id: "cont-2", company_id: companyId, company_map_id: "comp-2", name: "Trần Minh Hoàng", phone: "0987555666", email: "hoangtm@hocvienin.edu.vn", notes: "Quản lý phòng mua hàng vật tư", created_at: new Date(Date.now() - 3600000 * 48).toISOString() }
];

const seedCustomFields = (companyId: string): CRMCustomField[] => [
  { id: "field-1", company_id: companyId, entity_type: "lead", field_name: "size_ao", field_label: "Size Áo", field_type: "text", created_at: new Date().toISOString() },
  { id: "field-2", company_id: companyId, entity_type: "lead", field_name: "mau_sac", field_label: "Màu sắc ưu thích", field_type: "text", created_at: new Date().toISOString() }
];

const seedCustomFieldValues = (companyId: string): CRMCustomFieldValue[] => [
  { id: "val-1", company_id: companyId, entity_type: "lead", entity_id: "lead-1", field_id: "field-1", value: "XL", created_at: new Date().toISOString() }
];

const seedApiKeys = (companyId: string): CRMApiKey[] => [
  { id: "key-1", company_id: companyId, key_name: "Ladipage Integration Key", api_key: "crm_api_live_sample12345", created_at: new Date().toISOString() }
];

// Integration Seed Data
const seedPosChatSettings = (companyId: string): CRMPosChatSettings => ({
  company_id: companyId,
  is_pos_sync_enabled: false,
  is_chat_sync_enabled: true,
  auto_create_lead_on: "has_phone",
  phone_update_rule: "keep_latest",
  sync_tags_enabled: true,
  sync_agents_enabled: true
});

const seedLeadForms = (companyId: string): CRMLeadForm[] => [
  { id: "form-1", company_id: companyId, form_name: "Quảng cáo Sticker Tết 2026 - Meta Ads", platform: "facebook", is_active: true, field_mappings: { "full_name": "name", "phone_number": "phone", "email": "email", "notes": "notes" }, created_at: new Date().toISOString() },
  { id: "form-2", company_id: companyId, form_name: "Sỉ Quần áo Thể thao - TikTok Ads", platform: "tiktok", is_active: true, field_mappings: { "name": "name", "phone": "phone", "need": "notes" }, created_at: new Date().toISOString() }
];

const seedAutomationRules = (companyId: string): CRMAutomationRule[] => [
  { id: "rule-1", company_id: companyId, rule_name: "Tự động tạo nhiệm vụ tư vấn khi có Lead mới", trigger_event: "on_create", conditions: {}, actions: { type: "create_task", title: "Gọi điện tư vấn chi tiết chính sách giá sỉ", due_in_hours: 24 }, is_active: true, created_at: new Date().toISOString() }
];

export function useCRM() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const isDemo = isLocalDemoAuthEnabled();

  // Helper: Trigger Automation Rules Engine
  const runAutomationEngine = async (event: 'on_create' | 'on_update', entity: CRMLead) => {
    if (!companyId) return;
    
    // Fetch rules
    const rules = isDemo 
      ? getLocal<CRMAutomationRule>(AUTOMATION_RULES_KEY, seedAutomationRules(companyId))
      : (await queryClient.fetchQuery<CRMAutomationRule[]>({ queryKey: ["crm_automation_rules", companyId] })) || [];
    
    const activeRules = rules.filter(r => r.is_active && r.trigger_event === event);

    for (const rule of activeRules) {
      if (rule.actions.type === "create_task" && rule.actions.title) {
        // Compute due date
        const dueHours = rule.actions.due_in_hours || 24;
        const dueDate = new Date(Date.now() + 3600000 * dueHours).toISOString();

        if (isDemo) {
          const localTasks = getLocal<CRMTask>(TASKS_KEY, seedTasks(companyId));
          const newTask: CRMTask = {
            id: `tsk-auto-${Date.now()}`,
            company_id: companyId,
            title: `${rule.actions.title} (Khách: ${entity.name})`,
            due_date: dueDate,
            status: "pending",
            notes: `Nhiệm vụ tự động tạo bởi quy tắc: "${rule.rule_name}"`,
            created_at: new Date().toISOString()
          };
          saveLocal(TASKS_KEY, [...localTasks, newTask]);
        } else {
          await supabase
            .from("crm_tasks" as any)
            .insert({
              company_id: companyId,
              title: `${rule.actions.title} (Khách: ${entity.name})`,
              due_date: dueDate,
              status: "pending",
              notes: `Nhiệm vụ tự động tạo bởi quy tắc: "${rule.rule_name}"`
            });
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ["crm_tasks"] });
  };

  // ==========================================
  // 1. LEADS QUERIES & MUTATIONS
  // ==========================================
  const leadsQuery = useQuery({
    queryKey: ["crm_leads", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isDemo) return getLocal(LEADS_KEY, seedLeads(companyId));
      const { data, error } = await supabase
        .from("crm_leads" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CRMLead[];
    },
    enabled: !!companyId
  });

  const createLead = useMutation({
    mutationFn: async (lead: Omit<CRMLead, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      let created: CRMLead;

      if (isDemo) {
        const local = getLocal(LEADS_KEY, seedLeads(companyId));
        created = {
          ...lead,
          id: `lead-${Date.now()}`,
          company_id: companyId,
          created_at: new Date().toISOString()
        };
        saveLocal(LEADS_KEY, [created, ...local]);
      } else {
        const { data, error } = await supabase
          .from("crm_leads" as any)
          .insert({ ...lead, company_id: companyId })
          .select()
          .single();
        if (error) throw error;
        created = data as unknown as CRMLead;
      }

      // Kích hoạt Automation Engine
      await runAutomationEngine("on_create", created);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads"] });
      toast({ title: "Thêm khách hàng tiềm năng thành công" });
    }
  });

  const mergeLeads = useMutation({
    mutationFn: async ({ mainLeadId, duplicateLeadIds }: { mainLeadId: string; duplicateLeadIds: string[] }) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isDemo) {
        const local = getLocal(LEADS_KEY, seedLeads(companyId));
        const mainIdx = local.findIndex(l => l.id === mainLeadId);
        if (mainIdx === -1) throw new Error("Không tìm thấy Lead chính");

        const duplicates = local.filter(l => duplicateLeadIds.includes(l.id));

        // Merge notes
        let mergedNotes = local[mainIdx].notes || "";
        duplicates.forEach(dup => {
          if (dup.notes) {
            mergedNotes += `\n[Gộp từ Lead trùng]: ${dup.notes}`;
          }
        });
        local[mainIdx].notes = mergedNotes;

        // Remove duplicates
        const updated = local.filter(l => l.id === mainLeadId || !duplicateLeadIds.includes(l.id));
        saveLocal(LEADS_KEY, updated);
        return local[mainIdx];
      } else {
        const { error } = await supabase
          .from("crm_leads" as any)
          .delete()
          .in("id", duplicateLeadIds);
        if (error) throw error;
        return { id: mainLeadId };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads"] });
      toast({ title: "Gộp các Lead trùng lặp thành công!" });
    }
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CRMLead["status"] }) => {
      if (isDemo) {
        const local = getLocal(LEADS_KEY, seedLeads(companyId || ""));
        const idx = local.findIndex(l => l.id === id);
        if (idx > -1) {
          local[idx].status = status;
          saveLocal(LEADS_KEY, local);
          return local[idx];
        }
        throw new Error("Không tìm thấy lead");
      }
      const { data, error } = await supabase
        .from("crm_leads" as any)
        .update({ status } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CRMLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads"] });
      toast({ title: "Cập nhật trạng thái lead thành công" });
    }
  });

  const convertLeadToPartner = useMutation({
    mutationFn: async ({ leadId, name, phone, email }: { leadId: string; name: string; phone: string | null; email: string | null }) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      
      if (isDemo) {
        const partners = getLocal(PARTNERS_KEY, []);
        const newPartner = {
          id: `partner-${Date.now()}`,
          company_id: companyId,
          name,
          phone,
          email,
          code: `KH-${Date.now().toString().slice(-4)}`,
          partner_type: "customer",
          debt_amount: 0,
          total_spent: 0,
          created_at: new Date().toISOString()
        };
        partners.push(newPartner);
        saveLocal(PARTNERS_KEY, partners);

        const leads = getLocal(LEADS_KEY, seedLeads(companyId));
        const idx = leads.findIndex(l => l.id === leadId);
        if (idx > -1) {
          leads[idx].status = "converted";
          saveLocal(LEADS_KEY, leads);
        }
      } else {
        await supabase
          .from("partners")
          .insert({
            company_id: companyId,
            name,
            phone,
            email,
            code: `KH-${Date.now().toString().slice(-4)}`,
            partner_type: "customer",
            debt_amount: 0,
            total_spent: 0
          });
        await supabase
          .from("crm_leads" as any)
          .update({ status: "converted" } as any)
          .eq("id", leadId);
      }
      return leadId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast({ title: "Chuyển đổi sang Khách hàng chính thức thành công!" });
    }
  });

  // ==========================================
  // 2. DEALS QUERIES & MUTATIONS
  // ==========================================
  const dealsQuery = useQuery({
    queryKey: ["crm_deals", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isDemo) return getLocal(DEALS_KEY, seedDeals(companyId));
      const { data, error } = await supabase
        .from("crm_deals" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CRMDeal[];
    },
    enabled: !!companyId
  });

  const createDeal = useMutation({
    mutationFn: async (deal: Omit<CRMDeal, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isDemo) {
        const local = getLocal(DEALS_KEY, seedDeals(companyId));
        const newDeal: CRMDeal = {
          ...deal,
          id: `deal-${Date.now()}`,
          company_id: companyId,
          created_at: new Date().toISOString()
        };
        saveLocal(DEALS_KEY, [newDeal, ...local]);
        return newDeal;
      }
      const { data, error } = await supabase
        .from("crm_deals" as any)
        .insert({ ...deal, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_deals"] });
      toast({ title: "Tạo cơ hội bán hàng mới thành công" });
    }
  });

  const updateDealStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: CRMDeal["stage"] }) => {
      if (isDemo) {
        const local = getLocal(DEALS_KEY, seedDeals(companyId || ""));
        const idx = local.findIndex(d => d.id === id);
        if (idx > -1) {
          local[idx].stage = stage;
          saveLocal(DEALS_KEY, local);
          return local[idx];
        }
        throw new Error("Không tìm thấy deal");
      }
      const { data, error } = await supabase
        .from("crm_deals" as any)
        .update({ stage } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_deals"] });
    }
  });

  // ==========================================
  // 3. APPOINTMENTS QUERIES & MUTATIONS
  // ==========================================
  const appointmentsQuery = useQuery({
    queryKey: ["crm_appointments", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isDemo) return getLocal(APPOINTMENTS_KEY, seedAppointments(companyId));
      const { data, error } = await supabase
        .from("crm_appointments" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("appointment_time", { ascending: true });
      if (error) throw error;
      return data as unknown as CRMAppointment[];
    },
    enabled: !!companyId
  });

  const createAppointment = useMutation({
    mutationFn: async (apt: Omit<CRMAppointment, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isDemo) {
        const local = getLocal(APPOINTMENTS_KEY, seedAppointments(companyId));
        const newApt: CRMAppointment = {
          ...apt,
          id: `apt-${Date.now()}`,
          company_id: companyId,
          created_at: new Date().toISOString()
        };
        saveLocal(APPOINTMENTS_KEY, [...local, newApt]);
        return newApt;
      }
      const { data, error } = await supabase
        .from("crm_appointments" as any)
        .insert({ ...apt, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_appointments"] });
      toast({ title: "Đặt lịch hẹn thành công" });
    }
  });

  const updateAppointmentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CRMAppointment["status"] }) => {
      if (isDemo) {
        const local = getLocal(APPOINTMENTS_KEY, seedAppointments(companyId || ""));
        const idx = local.findIndex(a => a.id === id);
        if (idx > -1) {
          local[idx].status = status;
          saveLocal(APPOINTMENTS_KEY, local);
          return local[idx];
        }
        throw new Error("Không tìm thấy lịch hẹn");
      }
      const { data, error } = await supabase
        .from("crm_appointments" as any)
        .update({ status } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_appointments"] });
      toast({ title: "Đã cập nhật lịch hẹn" });
    }
  });

  // ==========================================
  // 4. TICKETS QUERIES & MUTATIONS
  // ==========================================
  const ticketsQuery = useQuery({
    queryKey: ["crm_tickets", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isDemo) return getLocal(TICKETS_KEY, seedTickets(companyId));
      const { data, error } = await supabase
        .from("crm_tickets" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CRMTicket[];
    },
    enabled: !!companyId
  });

  const createTicket = useMutation({
    mutationFn: async (tkt: Omit<CRMTicket, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isDemo) {
        const local = getLocal(TICKETS_KEY, seedTickets(companyId));
        const newTkt: CRMTicket = {
          ...tkt,
          id: `tkt-${Date.now()}`,
          company_id: companyId,
          created_at: new Date().toISOString()
        };
        saveLocal(TICKETS_KEY, [newTkt, ...local]);
        return newTkt;
      }
      const { data, error } = await supabase
        .from("crm_tickets" as any)
        .insert({ ...tkt, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_tickets"] });
      toast({ title: "Tạo Ticket hỗ trợ thành công" });
    }
  });

  const updateTicketStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CRMTicket["status"] }) => {
      if (isDemo) {
        const local = getLocal(TICKETS_KEY, seedTickets(companyId || ""));
        const idx = local.findIndex(t => t.id === id);
        if (idx > -1) {
          local[idx].status = status;
          saveLocal(TICKETS_KEY, local);
          return local[idx];
        }
        throw new Error("Không tìm thấy ticket");
      }
      const { data, error } = await supabase
        .from("crm_tickets" as any)
        .update({ status } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_tickets"] });
      toast({ title: "Cập nhật trạng thái ticket thành công" });
    }
  });

  // ==========================================
  // 5. TASKS QUERIES & MUTATIONS
  // ==========================================
  const tasksQuery = useQuery({
    queryKey: ["crm_tasks", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isDemo) return getLocal(TASKS_KEY, seedTasks(companyId));
      const { data, error } = await supabase
        .from("crm_tasks" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as unknown as CRMTask[];
    },
    enabled: !!companyId
  });

  const createTask = useMutation({
    mutationFn: async (tsk: Omit<CRMTask, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isDemo) {
        const local = getLocal(TASKS_KEY, seedTasks(companyId));
        const newTsk: CRMTask = {
          ...tsk,
          id: `tsk-${Date.now()}`,
          company_id: companyId,
          created_at: new Date().toISOString()
        };
        saveLocal(TASKS_KEY, [...local, newTsk]);
        return newTsk;
      }
      const { data, error } = await supabase
        .from("crm_tasks" as any)
        .insert({ ...tsk, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_tasks"] });
      toast({ title: "Thêm nhiệm vụ thành công" });
    }
  });

  const toggleTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CRMTask["status"] }) => {
      if (isDemo) {
        const local = getLocal(TASKS_KEY, seedTasks(companyId || ""));
        const idx = local.findIndex(t => t.id === id);
        if (idx > -1) {
          local[idx].status = status;
          saveLocal(TASKS_KEY, local);
          return local[idx];
        }
        throw new Error("Không tìm thấy nhiệm vụ");
      }
      const { data, error } = await supabase
        .from("crm_tasks" as any)
        .update({ status } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_tasks"] });
    }
  });

  // ==========================================
  // 6. COMPANIES QUERIES & MUTATIONS (Advanced)
  // ==========================================
  const companiesQuery = useQuery({
    queryKey: ["crm_companies", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isDemo) return getLocal(COMPANIES_KEY, seedCompanies(companyId));
      const { data, error } = await supabase
        .from("crm_companies" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CRMCompany[];
    },
    enabled: !!companyId
  });

  const createCompany = useMutation({
    mutationFn: async (comp: Omit<CRMCompany, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isDemo) {
        const local = getLocal(COMPANIES_KEY, seedCompanies(companyId));
        const newComp: CRMCompany = {
          ...comp,
          id: `comp-${Date.now()}`,
          company_id: companyId,
          created_at: new Date().toISOString()
        };
        saveLocal(COMPANIES_KEY, [newComp, ...local]);
        return newComp;
      }
      const { data, error } = await supabase
        .from("crm_companies" as any)
        .insert({ ...comp, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_companies"] });
      toast({ title: "Thêm công ty thành công" });
    }
  });

  // ==========================================
  // 7. CONTACTS QUERIES & MUTATIONS (Advanced)
  // ==========================================
  const contactsQuery = useQuery({
    queryKey: ["crm_contacts", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isDemo) return getLocal(CONTACTS_KEY, seedContacts(companyId));
      const { data, error } = await supabase
        .from("crm_contacts" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CRMContact[];
    },
    enabled: !!companyId
  });

  const createContact = useMutation({
    mutationFn: async (cont: Omit<CRMContact, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isDemo) {
        const local = getLocal(CONTACTS_KEY, seedContacts(companyId));
        const newCont: CRMContact = {
          ...cont,
          id: `cont-${Date.now()}`,
          company_id: companyId,
          created_at: new Date().toISOString()
        };
        saveLocal(CONTACTS_KEY, [newCont, ...local]);
        return newCont;
      }
      const { data, error } = await supabase
        .from("crm_contacts" as any)
        .insert({ ...cont, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_contacts"] });
      toast({ title: "Thêm liên hệ thành công" });
    }
  });

  const mergeContacts = useMutation({
    mutationFn: async ({ mainContactId, duplicateContactIds }: { mainContactId: string; duplicateContactIds: string[] }) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isDemo) {
        const local = getLocal(CONTACTS_KEY, seedContacts(companyId));
        const mainIdx = local.findIndex(c => c.id === mainContactId);
        if (mainIdx === -1) throw new Error("Không tìm thấy liên hệ chính");

        const duplicates = local.filter(c => duplicateContactIds.includes(c.id));
        
        // Merge notes
        let mergedNotes = local[mainIdx].notes || "";
        duplicates.forEach(dup => {
          if (dup.notes) {
            mergedNotes += `\n[Gộp từ ${dup.name}]: ${dup.notes}`;
          }
        });
        local[mainIdx].notes = mergedNotes;

        // Remove duplicates
        const updated = local.filter(c => c.id === mainContactId || !duplicateContactIds.includes(c.id));
        saveLocal(CONTACTS_KEY, updated);
        return local[mainIdx];
      } else {
        const { error } = await supabase
          .from("crm_contacts" as any)
          .delete()
          .in("id", duplicateContactIds);
        if (error) throw error;
        return { id: mainContactId };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_contacts"] });
      toast({ title: "Gộp các liên hệ trùng lặp thành công!" });
    }
  });

  // ==========================================
  // 8. CUSTOM FIELDS QUERIES & MUTATIONS (Advanced)
  // ==========================================
  const customFieldsQuery = useQuery({
    queryKey: ["crm_custom_fields", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isDemo) return getLocal(CUSTOM_FIELDS_KEY, seedCustomFields(companyId));
      const { data, error } = await supabase
        .from("crm_custom_fields" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as CRMCustomField[];
    },
    enabled: !!companyId
  });

  const createCustomField = useMutation({
    mutationFn: async (field: Omit<CRMCustomField, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isDemo) {
        const local = getLocal(CUSTOM_FIELDS_KEY, seedCustomFields(companyId));
        const newField: CRMCustomField = {
          ...field,
          id: `field-${Date.now()}`,
          company_id: companyId,
          created_at: new Date().toISOString()
        };
        saveLocal(CUSTOM_FIELDS_KEY, [...local, newField]);
        return newField;
      }
      const { data, error } = await supabase
        .from("crm_custom_fields" as any)
        .insert({ ...field, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_custom_fields"] });
      toast({ title: "Thêm trường tùy chỉnh thành công" });
    }
  });

  // ==========================================
  // 9. CUSTOM FIELD VALUES QUERIES & MUTATIONS (Advanced)
  // ==========================================
  const customFieldValuesQuery = useQuery({
    queryKey: ["crm_custom_field_values", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isDemo) return getLocal(CUSTOM_FIELD_VALUES_KEY, seedCustomFieldValues(companyId));
      const { data, error } = await supabase
        .from("crm_custom_field_values" as any)
        .select("*")
        .eq("company_id", companyId);
      if (error) throw error;
      return data as unknown as CRMCustomFieldValue[];
    },
    enabled: !!companyId
  });

  const saveCustomFieldValues = useMutation({
    mutationFn: async ({ entityId, values }: { entityId: string; values: Record<string, string> }) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isDemo) {
        const local = getLocal(CUSTOM_FIELD_VALUES_KEY, seedCustomFieldValues(companyId));
        const filtered = local.filter(v => !(v.entity_id === entityId && v.entity_type === "lead"));
        
        Object.entries(values).forEach(([fieldId, val]) => {
          if (val) {
            filtered.push({
              id: `val-${Date.now()}-${fieldId}`,
              company_id: companyId,
              entity_type: "lead",
              entity_id: entityId,
              field_id: fieldId,
              value: val,
              created_at: new Date().toISOString()
            });
          }
        });
        saveLocal(CUSTOM_FIELD_VALUES_KEY, filtered);
        return filtered;
      } else {
        for (const [fieldId, val] of Object.entries(values)) {
          if (val) {
            await supabase
              .from("crm_custom_field_values" as any)
              .upsert({
                company_id: companyId,
                entity_type: "lead",
                entity_id: entityId,
                field_id: fieldId,
                value: val
              } as any, { onConflict: "entity_type,entity_id,field_id" });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_custom_field_values"] });
    }
  });

  // ==========================================
  // 10. API KEYS QUERIES & MUTATIONS (Advanced)
  // ==========================================
  const apiKeysQuery = useQuery({
    queryKey: ["crm_api_keys", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isDemo) return getLocal(API_KEYS_KEY, seedApiKeys(companyId));
      const { data, error } = await supabase
        .from("crm_api_keys" as any)
        .select("*")
        .eq("company_id", companyId);
      if (error) throw error;
      return data as unknown as CRMApiKey[];
    },
    enabled: !!companyId
  });

  const createApiKey = useMutation({
    mutationFn: async (keyName: string) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      const generatedKey = `crm_api_live_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
      
      if (isDemo) {
        const local = getLocal(API_KEYS_KEY, seedApiKeys(companyId));
        const newKey: CRMApiKey = {
          id: `key-${Date.now()}`,
          company_id: companyId,
          key_name: keyName,
          api_key: generatedKey,
          created_at: new Date().toISOString()
        };
        saveLocal(API_KEYS_KEY, [...local, newKey]);
        return newKey;
      }
      const { data, error } = await supabase
        .from("crm_api_keys" as any)
        .insert({ key_name: keyName, api_key: generatedKey, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CRMApiKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_api_keys"] });
      toast({ title: "Khởi tạo API Key thành công" });
    }
  });

  const deleteApiKey = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) {
        const local = getLocal(API_KEYS_KEY, seedApiKeys(companyId || ""));
        const filtered = local.filter(k => k.id !== id);
        saveLocal(API_KEYS_KEY, filtered);
        return id;
      }
      const { error } = await supabase
        .from("crm_api_keys" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_api_keys"] });
      toast({ title: "Đã xóa API Key" });
    }
  });

  // ==========================================
  // 11. WEBHOOK INGEST SIMULATION (Advanced)
  // ==========================================
  const simulateWebhookIngest = useMutation({
    mutationFn: async (payload: { apiKey: string; name: string; phone: string; email?: string; notes?: string }) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      
      // Verify API Key
      const keys = isDemo 
        ? getLocal(API_KEYS_KEY, seedApiKeys(companyId)) 
        : (await queryClient.fetchQuery<CRMApiKey[]>({ queryKey: ["crm_api_keys", companyId] }));
      
      const matchedKey = keys.find(k => k.api_key === payload.apiKey);
      if (!matchedKey) {
        throw new Error("Mã API Key không hợp lệ hoặc đã bị vô hiệu hóa!");
      }

      let createdLead: CRMLead;

      // Add to Leads list
      if (isDemo) {
        const localLeads = getLocal(LEADS_KEY, seedLeads(companyId));
        createdLead = {
          id: `lead-web-${Date.now()}`,
          company_id: companyId,
          name: payload.name,
          phone: payload.phone,
          email: payload.email || null,
          source: "website",
          status: "new",
          notes: payload.notes || "Bắn tự động từ Ladipage Form Integration",
          created_at: new Date().toISOString()
        };
        saveLocal(LEADS_KEY, [createdLead, ...localLeads]);
      } else {
        const { data, error } = await supabase
          .from("crm_leads" as any)
          .insert({
            company_id: companyId,
            name: payload.name,
            phone: payload.phone,
            email: payload.email || null,
            source: "website",
            status: "new",
            notes: payload.notes || "Bắn tự động từ Ladipage Form Integration"
          } as any)
          .select()
          .single();
        if (error) throw error;
        createdLead = data as unknown as CRMLead;
      }

      // Kích hoạt Automation Rules Engine
      await runAutomationEngine("on_create", createdLead);
      return createdLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads"] });
      toast({ title: "Bắn dữ liệu mô phỏng thành công! Vui lòng kiểm tra danh sách Leads." });
    }
  });

  // ==========================================
  // 12. POS/CHAT SETTINGS QUERIES & MUTATIONS (Ecosystem Upgrade)
  // ==========================================
  const posChatSettingsQuery = useQuery({
    queryKey: ["crm_pos_chat_settings", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      if (isDemo) {
        const raw = localStorage.getItem(POS_CHAT_SETTINGS_KEY);
        if (!raw) {
          const defaultVal = seedPosChatSettings(companyId);
          localStorage.setItem(POS_CHAT_SETTINGS_KEY, JSON.stringify(defaultVal));
          return defaultVal;
        }
        return JSON.parse(raw) as CRMPosChatSettings;
      }
      const { data, error } = await supabase
        .from("crm_pos_chat_settings" as any)
        .select("*")
        .eq("company_id", companyId)
        .single();
      if (error && error.code !== "PGRST116") throw error; // Handle empty row
      return data as unknown as CRMPosChatSettings | null;
    },
    enabled: !!companyId
  });

  const updatePosChatSettings = useMutation({
    mutationFn: async (settings: Partial<CRMPosChatSettings>) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isDemo) {
        const raw = localStorage.getItem(POS_CHAT_SETTINGS_KEY);
        const current = raw ? JSON.parse(raw) : seedPosChatSettings(companyId);
        const updated = { ...current, ...settings };
        localStorage.setItem(POS_CHAT_SETTINGS_KEY, JSON.stringify(updated));
        return updated;
      }
      const { data, error } = await supabase
        .from("crm_pos_chat_settings" as any)
        .upsert({ ...settings, company_id: companyId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_pos_chat_settings"] });
      toast({ title: "Đã lưu thiết lập đồng bộ" });
    }
  });

  // ==========================================
  // 13. LEAD FORMS QUERIES & MUTATIONS (Ecosystem Upgrade)
  // ==========================================
  const leadFormsQuery = useQuery({
    queryKey: ["crm_lead_forms", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isDemo) return getLocal(LEAD_FORMS_KEY, seedLeadForms(companyId));
      const { data, error } = await supabase
        .from("crm_lead_forms" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CRMLeadForm[];
    },
    enabled: !!companyId
  });

  const createLeadForm = useMutation({
    mutationFn: async (form: Omit<CRMLeadForm, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isDemo) {
        const local = getLocal(LEAD_FORMS_KEY, seedLeadForms(companyId));
        const newForm: CRMLeadForm = {
          ...form,
          id: `form-${Date.now()}`,
          company_id: companyId,
          created_at: new Date().toISOString()
        };
        saveLocal(LEAD_FORMS_KEY, [newForm, ...local]);
        return newForm;
      }
      const { data, error } = await supabase
        .from("crm_lead_forms" as any)
        .insert({ ...form, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_lead_forms"] });
      toast({ title: "Tạo biểu mẫu quảng cáo thành công" });
    }
  });

  const updateLeadFormMappings = useMutation({
    mutationFn: async ({ id, mappings }: { id: string; mappings: Record<string, string> }) => {
      if (isDemo) {
        const local = getLocal(LEAD_FORMS_KEY, seedLeadForms(companyId || ""));
        const idx = local.findIndex(f => f.id === id);
        if (idx > -1) {
          local[idx].field_mappings = mappings;
          saveLocal(LEAD_FORMS_KEY, local);
          return local[idx];
        }
        throw new Error("Không tìm thấy form");
      }
      const { data, error } = await supabase
        .from("crm_lead_forms" as any)
        .update({ field_mappings: mappings } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_lead_forms"] });
      toast({ title: "Đã cập nhật ánh xạ trường" });
    }
  });

  // ==========================================
  // 14. AUTOMATION RULES QUERIES & MUTATIONS (Ecosystem Upgrade)
  // ==========================================
  const automationRulesQuery = useQuery({
    queryKey: ["crm_automation_rules", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isDemo) return getLocal(AUTOMATION_RULES_KEY, seedAutomationRules(companyId));
      const { data, error } = await supabase
        .from("crm_automation_rules" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CRMAutomationRule[];
    },
    enabled: !!companyId
  });

  const createAutomationRule = useMutation({
    mutationFn: async (rule: Omit<CRMAutomationRule, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isDemo) {
        const local = getLocal(AUTOMATION_RULES_KEY, seedAutomationRules(companyId));
        const newRule: CRMAutomationRule = {
          ...rule,
          id: `rule-${Date.now()}`,
          company_id: companyId,
          created_at: new Date().toISOString()
        };
        saveLocal(AUTOMATION_RULES_KEY, [newRule, ...local]);
        return newRule;
      }
      const { data, error } = await supabase
        .from("crm_automation_rules" as any)
        .insert({ ...rule, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_automation_rules"] });
      toast({ title: "Tạo quy tắc tự động hóa thành công" });
    }
  });

  const toggleAutomationRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (isDemo) {
        const local = getLocal(AUTOMATION_RULES_KEY, seedAutomationRules(companyId || ""));
        const idx = local.findIndex(r => r.id === id);
        if (idx > -1) {
          local[idx].is_active = is_active;
          saveLocal(AUTOMATION_RULES_KEY, local);
          return local[idx];
        }
        throw new Error("Không tìm thấy quy tắc");
      }
      const { data, error } = await supabase
        .from("crm_automation_rules" as any)
        .update({ is_active } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_automation_rules"] });
      toast({ title: "Đã cập nhật trạng thái quy tắc" });
    }
  });

  return {
    // Leads
    leads: leadsQuery.data || [],
    leadsLoading: leadsQuery.isLoading,
    createLead,
    updateLeadStatus,
    convertLeadToPartner,
    mergeLeads,

    // Deals
    deals: dealsQuery.data || [],
    dealsLoading: dealsQuery.isLoading,
    createDeal,
    updateDealStage,

    // Appointments
    appointments: appointmentsQuery.data || [],
    appointmentsLoading: appointmentsQuery.isLoading,
    createAppointment,
    updateAppointmentStatus,

    // Tickets
    tickets: ticketsQuery.data || [],
    ticketsLoading: ticketsQuery.isLoading,
    createTicket,
    updateTicketStatus,

    // Tasks
    tasks: tasksQuery.data || [],
    tasksLoading: tasksQuery.isLoading,
    createTask,
    toggleTaskStatus,

    // Companies (Advanced)
    companies: companiesQuery.data || [],
    companiesLoading: companiesQuery.isLoading,
    createCompany,

    // Contacts (Advanced)
    contacts: contactsQuery.data || [],
    contactsLoading: contactsQuery.isLoading,
    createContact,
    mergeContacts,

    // Custom Fields (Advanced)
    customFields: customFieldsQuery.data || [],
    customFieldsLoading: customFieldsQuery.isLoading,
    createCustomField,

    // Custom Field Values (Advanced)
    customFieldValues: customFieldValuesQuery.data || [],
    saveCustomFieldValues,

    // API Keys (Advanced)
    apiKeys: apiKeysQuery.data || [],
    apiKeysLoading: apiKeysQuery.isLoading,
    createApiKey,
    deleteApiKey,

    // Webhook simulation
    simulateWebhookIngest,

    // POS & Chat Settings (Ecosystem Upgrade)
    posChatSettings: posChatSettingsQuery.data || seedPosChatSettings(companyId || ""),
    updatePosChatSettings,

    // Lead Forms (Ecosystem Upgrade)
    leadForms: leadFormsQuery.data || [],
    createLeadForm,
    updateLeadFormMappings,

    // Automation Rules (Ecosystem Upgrade)
    automationRules: automationRulesQuery.data || [],
    createAutomationRule,
    toggleAutomationRule
  };
}
