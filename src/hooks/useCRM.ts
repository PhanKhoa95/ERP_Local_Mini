import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

// Types
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

// LocalStorage Keys
const LEADS_KEY = "erp-mini-local-demo-crm-leads";
const DEALS_KEY = "erp-mini-local-demo-crm-deals";
const APPOINTMENTS_KEY = "erp-mini-local-demo-crm-appointments";
const TICKETS_KEY = "erp-mini-local-demo-crm-tickets";
const TASKS_KEY = "erp-mini-local-demo-crm-tasks";
const PARTNERS_KEY = "erp-mini-local-demo-partners";

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

export function useCRM() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  // 1. Leads Queries & Mutations
  const leadsQuery = useQuery({
    queryKey: ["crm_leads", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocal(LEADS_KEY, seedLeads(companyId));
      }
      const { data, error } = await supabase
        .from("crm_leads" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CRMLead[];
    },
    enabled: !!companyId
  });

  const createLead = useMutation({
    mutationFn: async (lead: Omit<CRMLead, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isLocalDemoAuthEnabled()) {
        const local = getLocal(LEADS_KEY, seedLeads(companyId));
        const newLead: CRMLead = {
          ...lead,
          id: `lead-${Date.now()}`,
          company_id: companyId,
          created_at: new Date().toISOString()
        };
        saveLocal(LEADS_KEY, [newLead, ...local]);
        return newLead;
      }
      const { data, error } = await supabase
        .from("crm_leads" as any)
        .insert({ ...lead, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads"] });
      toast({ title: "Thêm khách hàng tiềm năng thành công" });
    }
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CRMLead["status"] }) => {
      if (isLocalDemoAuthEnabled()) {
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_leads"] });
      toast({ title: "Cập nhật trạng thái lead thành công" });
    }
  });

  const convertLeadToPartner = useMutation({
    mutationFn: async ({ leadId, name, phone, email }: { leadId: string; name: string; phone: string | null; email: string | null }) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      
      // Step 1: Add to Partner directory
      if (isLocalDemoAuthEnabled()) {
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
      } else {
        const { error } = await supabase
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
        if (error) throw error;
      }

      // Step 2: Mark lead as Converted
      if (isLocalDemoAuthEnabled()) {
        const leads = getLocal(LEADS_KEY, seedLeads(companyId));
        const idx = leads.findIndex(l => l.id === leadId);
        if (idx > -1) {
          leads[idx].status = "converted";
          saveLocal(LEADS_KEY, leads);
        }
      } else {
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

  // 2. Deals Queries & Mutations
  const dealsQuery = useQuery({
    queryKey: ["crm_deals", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocal(DEALS_KEY, seedDeals(companyId));
      }
      const { data, error } = await supabase
        .from("crm_deals" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CRMDeal[];
    },
    enabled: !!companyId
  });

  const createDeal = useMutation({
    mutationFn: async (deal: Omit<CRMDeal, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isLocalDemoAuthEnabled()) {
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
      if (isLocalDemoAuthEnabled()) {
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

  // 3. Appointments Queries & Mutations
  const appointmentsQuery = useQuery({
    queryKey: ["crm_appointments", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocal(APPOINTMENTS_KEY, seedAppointments(companyId));
      }
      const { data, error } = await supabase
        .from("crm_appointments" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("appointment_time", { ascending: true });
      if (error) throw error;
      return data as CRMAppointment[];
    },
    enabled: !!companyId
  });

  const createAppointment = useMutation({
    mutationFn: async (apt: Omit<CRMAppointment, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isLocalDemoAuthEnabled()) {
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
      if (isLocalDemoAuthEnabled()) {
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

  // 4. Tickets Queries & Mutations
  const ticketsQuery = useQuery({
    queryKey: ["crm_tickets", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocal(TICKETS_KEY, seedTickets(companyId));
      }
      const { data, error } = await supabase
        .from("crm_tickets" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CRMTicket[];
    },
    enabled: !!companyId
  });

  const createTicket = useMutation({
    mutationFn: async (tkt: Omit<CRMTicket, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isLocalDemoAuthEnabled()) {
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
      if (isLocalDemoAuthEnabled()) {
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

  // 5. Tasks Queries & Mutations
  const tasksQuery = useQuery({
    queryKey: ["crm_tasks", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocal(TASKS_KEY, seedTasks(companyId));
      }
      const { data, error } = await supabase
        .from("crm_tasks" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as CRMTask[];
    },
    enabled: !!companyId
  });

  const createTask = useMutation({
    mutationFn: async (tsk: Omit<CRMTask, "id" | "company_id" | "created_at">) => {
      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");
      if (isLocalDemoAuthEnabled()) {
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
      if (isLocalDemoAuthEnabled()) {
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

  return {
    leads: leadsQuery.data || [],
    leadsLoading: leadsQuery.isLoading,
    createLead,
    updateLeadStatus,
    convertLeadToPartner,

    deals: dealsQuery.data || [],
    dealsLoading: dealsQuery.isLoading,
    createDeal,
    updateDealStage,

    appointments: appointmentsQuery.data || [],
    appointmentsLoading: appointmentsQuery.isLoading,
    createAppointment,
    updateAppointmentStatus,

    tickets: ticketsQuery.data || [],
    ticketsLoading: ticketsQuery.isLoading,
    createTicket,
    updateTicketStatus,

    tasks: tasksQuery.data || [],
    tasksLoading: tasksQuery.isLoading,
    createTask,
    toggleTaskStatus
  };
}
