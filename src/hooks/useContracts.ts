import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { invalidateContractRelated } from "@/lib/queryInvalidation";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { erpEventBus } from "@/lib/erpEventBus";

export interface SmartContract {
  id: string;
  company_id: string;
  project_id?: string;
  partner_id?: string;
  contract_number: string;
  contract_type: string;
  industry: string;
  title: string;
  content_template: any;
  variables: any;
  status: string;
  signer_user_id?: string;
  signer_vneid_hash?: string;
  signed_at?: string;
  offline_hash?: string;
  total_value: number;
  token_auto_issue: boolean;
  token_issue_percent: number;
  valid_from?: string;
  valid_to?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractMilestone {
  id: string;
  contract_id: string;
  milestone_name: string;
  milestone_order: number;
  due_date?: string;
  amount: number;
  status: string;
  completed_at?: string;
  token_issue_amount: number;
  created_at: string;
}

const CONTRACTS_KEY = "erp-mini-local-demo-smart-contracts";
const MILESTONES_KEY = "erp-mini-local-demo-contract-milestones";

function getLocalContracts(companyId?: string): SmartContract[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CONTRACTS_KEY);
  if (!raw) {
    const compId = companyId || "demo-company";
    const defaultContracts: SmartContract[] = [
      {
        id: "contract-1",
        company_id: compId,
        partner_id: "partner-retail",
        contract_number: "HD-2026-NIN-001",
        contract_type: "Dịch vụ in ấn",
        industry: "In ấn & Gia công",
        title: "Hợp đồng thiết kế & in decal tem nhãn chuỗi Trà Sữa X",
        content_template: null,
        variables: null,
        status: "signed",
        signer_user_id: "user-a",
        signer_vneid_hash: "vneid-hash-mock-1",
        signed_at: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
        total_value: 15000000,
        token_auto_issue: false,
        token_issue_percent: 0,
        valid_from: new Date(Date.now() - 30 * 24 * 3600000).toISOString().split("T")[0],
        valid_to: new Date(Date.now() + 60 * 24 * 3600000).toISOString().split("T")[0],
        created_by: "demo-user",
        created_at: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "contract-2",
        company_id: compId,
        partner_id: "partner-retail",
        contract_number: "HD-2026-NIN-002",
        contract_type: "Cung cấp vật tư",
        industry: "In ấn & Gia công",
        title: "Hợp đồng in ấn ấn phẩm lịch Tết 2027 cho Công ty Y",
        content_template: null,
        variables: null,
        status: "pending",
        total_value: 35000000,
        token_auto_issue: false,
        token_issue_percent: 0,
        valid_from: new Date(Date.now() - 5 * 24 * 3600000).toISOString().split("T")[0],
        valid_to: new Date(Date.now() + 90 * 24 * 3600000).toISOString().split("T")[0],
        created_by: "demo-user",
        created_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(CONTRACTS_KEY, JSON.stringify(defaultContracts));
    return defaultContracts;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalContracts(contracts: SmartContract[]) {
  localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));
}

function getLocalMilestones(): ContractMilestone[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(MILESTONES_KEY);
  if (!raw) {
    const defaultMilestones: ContractMilestone[] = [
      {
        id: "ms-1-1",
        contract_id: "contract-1",
        milestone_name: "Tạm ứng thiết kế & in test mẫu thử",
        milestone_order: 1,
        due_date: new Date(Date.now() - 25 * 24 * 3600000).toISOString().split("T")[0],
        amount: 5000000,
        status: "completed",
        completed_at: new Date(Date.now() - 25 * 24 * 3600000).toISOString(),
        token_issue_amount: 0,
        created_at: new Date(Date.now() - 30 * 24 * 3600000).toISOString()
      },
      {
        id: "ms-1-2",
        contract_id: "contract-1",
        milestone_name: "Bàn giao decal & tem nhãn đợt 1",
        milestone_order: 2,
        due_date: new Date(Date.now() - 5 * 24 * 3600000).toISOString().split("T")[0],
        amount: 5000000,
        status: "completed",
        completed_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
        token_issue_amount: 0,
        created_at: new Date(Date.now() - 30 * 24 * 3600000).toISOString()
      },
      {
        id: "ms-1-3",
        contract_id: "contract-1",
        milestone_name: "Nghiệm thu thanh lý hợp đồng",
        milestone_order: 3,
        due_date: new Date(Date.now() + 15 * 24 * 3600000).toISOString().split("T")[0],
        amount: 5000000,
        status: "pending",
        token_issue_amount: 0,
        created_at: new Date(Date.now() - 30 * 24 * 3600000).toISOString()
      },
      {
        id: "ms-2-1",
        contract_id: "contract-2",
        milestone_name: "Đặt cọc sản xuất",
        milestone_order: 1,
        due_date: new Date(Date.now() + 5 * 24 * 3600000).toISOString().split("T")[0],
        amount: 15000000,
        status: "pending",
        token_issue_amount: 0,
        created_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
      },
      {
        id: "ms-2-2",
        contract_id: "contract-2",
        milestone_name: "Nghiệm thu bàn giao lịch bloc & túi giấy",
        milestone_order: 2,
        due_date: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split("T")[0],
        amount: 20000000,
        status: "pending",
        token_issue_amount: 0,
        created_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
      }
    ];
    localStorage.setItem(MILESTONES_KEY, JSON.stringify(defaultMilestones));
    return defaultMilestones;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalMilestones(milestones: ContractMilestone[]) {
  localStorage.setItem(MILESTONES_KEY, JSON.stringify(milestones));
}

function createLocalOrderFromContract(companyId: string, contract: any) {
  const localOrdersRaw = localStorage.getItem("erp-mini-local-demo-orders") || "[]";
  const localOrders = JSON.parse(localOrdersRaw);

  const productsRaw = localStorage.getItem("erp-mini-local-demo-products") || "[]";
  const products = JSON.parse(productsRaw);
  const finishedProd = products.find((p: any) => p.sku === "SP001") || products[0];

  const partnersRaw = localStorage.getItem("erp-mini-local-demo-partners") || "[]";
  const partners = JSON.parse(partnersRaw);
  const distPartner = partners.find((p: any) => p.name.includes("Nhà phân phối miền Nam")) || partners.find((p: any) => p.id === contract.partner_id) || partners[0];

  const channelsRaw = localStorage.getItem("erp-mini-local-demo-sales-channels") || "[]";
  const channels = JSON.parse(channelsRaw);
  const retailChannel = channels.find((c: any) => c.platform_type === "vieterp") || channels[0];

  const orderId = `ord-${Date.now()}`;
  
  const orderItems = finishedProd ? [{
    id: `item-${Date.now()}`,
    order_id: orderId,
    product_id: finishedProd.id,
    quantity: 30,
    unit_price: 120000,
    total: 3600000,
    discount: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    products: {
      id: finishedProd.id,
      sku: finishedProd.sku,
      name: finishedProd.name,
      cost_price: finishedProd.cost_price || 100000,
      selling_price: finishedProd.selling_price || 150000,
      stock_quantity: finishedProd.stock_quantity || 190,
      unit: finishedProd.unit || "Cái",
    }
  }] : [];

  const newOrder = {
    id: orderId,
    company_id: companyId,
    order_number: `ORD-${Date.now().toString().slice(-6)}`,
    customer_name: distPartner ? distPartner.name : "Nhà phân phối miền Nam",
    customer_phone: distPartner ? distPartner.phone : "0900000000",
    shipping_address: distPartner ? distPartner.address : "Hồ Chí Minh",
    payment_method: "Ghi nợ",
    payment_status: "pending",
    status: "pending",
    total: 3600000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    channel_id: retailChannel ? retailChannel.id : null,
    warehouse_id: null,
    notes: `Tạo từ hợp đồng ${contract.contract_number}`,
    discount: 0,
    shipping_fee: 0,
    order_items: orderItems,
  };

  localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify([newOrder, ...localOrders]));
}

export function useContracts() {
  const { companyId } = useCompanyContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["smart-contracts", companyId],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        return getLocalContracts(companyId).filter(c => c.company_id === companyId);
      }
      const { data, error } = await supabase
        .from("smart_contracts")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SmartContract[];
    },
    enabled: !!companyId,
  });

  const createContract = useMutation({
    mutationFn: async (contract: Partial<SmartContract>) => {
      const contractNumber = contract.contract_number?.trim() || 
        `HD-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalContracts(companyId);
        const newContract: SmartContract = {
          ...contract,
          id: `contract-${Date.now()}`,
          contract_number: contractNumber,
          company_id: companyId!,
          created_by: user?.id || "local-demo-user",
          status: contract.status || "draft",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_value: contract.total_value || 0,
          token_auto_issue: contract.token_auto_issue || false,
          token_issue_percent: contract.token_issue_percent || 0,
          industry: contract.industry || "Bán sỉ",
          contract_type: contract.contract_type || "Bán hàng",
          title: contract.title || "Hợp đồng nguyên tắc",
          content_template: contract.content_template || null,
          variables: contract.variables || null,
        };
        saveLocalContracts([newContract, ...local]);
        return newContract;
      }

      const { data, error } = await supabase
        .from("smart_contracts")
        .insert({ 
          ...contract, 
          contract_number: contractNumber,
          company_id: companyId!, 
          created_by: user?.id 
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["smart-contracts"] });
      toast({ title: "Tạo hợp đồng thành công" });
    },
    onError: (e: any) => toast({ title: "Lỗi tạo hợp đồng", description: e.message, variant: "destructive" }),
  });

  const updateContract = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SmartContract> & { id: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalContracts(companyId);
        const idx = local.findIndex(c => c.id === id);
        if (idx >= 0) {
          const prevStatus = local[idx].status;
          local[idx] = {
            ...local[idx],
            ...updates,
            updated_at: new Date().toISOString(),
          } as SmartContract;
          saveLocalContracts(local);
          
          if (updates.status === "active" && prevStatus !== "active") {
            erpEventBus.publish("CONTRACT_SIGNED", { contract: local[idx], companyId: companyId || "" });
          }
          return local[idx];
        }
        throw new Error("Không tìm thấy hợp đồng local");
      }

      const { data, error } = await supabase
        .from("smart_contracts")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateContractRelated(qc);
      toast({ title: "Cập nhật hợp đồng thành công" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const generateTemplate = useMutation({
    mutationFn: async (params: { industry: string; contract_type: string; partner_name?: string }) => {
      if (isLocalDemoAuthEnabled()) {
        return "Mẫu hợp đồng nguyên tắc bán hàng thương mại. Điều 1: Điều khoản chung...";
      }
      const { data, error } = await supabase.functions.invoke("manage-contracts", {
        body: { action: "generate_template", ...params, company_id: companyId },
      });
      if (error) throw error;
      return data.template;
    },
    onError: (e: any) => {
      toast({ title: "Lỗi sinh mẫu hợp đồng", description: e.message || "AI không phản hồi, vui lòng thử lại", variant: "destructive" });
    },
  });

  const signContract = useMutation({
    mutationFn: async (params: { contract_id: string; vneid_hash?: string; offline_hash?: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalContracts(companyId);
        const idx = local.findIndex(c => c.id === params.contract_id);
        if (idx >= 0) {
          local[idx] = {
            ...local[idx],
            status: "active",
            signed_at: new Date().toISOString(),
            signer_user_id: user?.id || "local-demo-user",
            signer_vneid_hash: params.vneid_hash || "vneid-hash-mock",
            offline_hash: params.offline_hash || "offline-hash-mock",
            updated_at: new Date().toISOString(),
          };
          saveLocalContracts(local);
          erpEventBus.publish("CONTRACT_SIGNED", { contract: local[idx], companyId: companyId || "" });
          return { contract: local[idx] };
        }
        throw new Error("Không tìm thấy hợp đồng local để ký");
      }

      const { data, error } = await supabase.functions.invoke("manage-contracts", {
        body: { action: "sign_contract", ...params, user_id: user?.id },
      });
      if (error) throw error;
      return data.contract;
    },
    onSuccess: () => {
      invalidateContractRelated(qc);
      toast({ title: "Ký hợp đồng thành công" });
    },
  });

  return { contracts, isLoading, createContract, updateContract, generateTemplate, signContract };
}

export function useContractMilestones(contractId?: string) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ["contract-milestones", contractId],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        return getLocalMilestones().filter(m => m.contract_id === contractId);
      }
      const { data, error } = await supabase
        .from("contract_milestones")
        .select("*")
        .eq("contract_id", contractId!)
        .order("milestone_order");
      if (error) throw error;
      return data as ContractMilestone[];
    },
    enabled: !!contractId,
  });

  const addMilestone = useMutation({
    mutationFn: async (milestone: Partial<ContractMilestone>) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalMilestones();
        const newMilestone: ContractMilestone = {
          id: `milestone-${Date.now()}`,
          contract_id: milestone.contract_id!,
          milestone_name: milestone.milestone_name || "Giai đoạn mới",
          milestone_order: milestone.milestone_order || 1,
          due_date: milestone.due_date || undefined,
          amount: milestone.amount || 0,
          status: "pending",
          token_issue_amount: milestone.token_issue_amount || 0,
          created_at: new Date().toISOString(),
        };
        saveLocalMilestones([...local, newMilestone]);
        return newMilestone;
      }

      const { data, error } = await supabase
        .from("contract_milestones")
        .insert(milestone as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contract-milestones"] });
      toast({ title: "Thêm milestone thành công" });
    },
  });

  const completeMilestone = useMutation({
    mutationFn: async (params: { milestone_id: string; contract_id: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalMilestones();
        const idx = local.findIndex(m => m.id === params.milestone_id);
        if (idx >= 0) {
          local[idx] = {
            ...local[idx],
            status: "completed",
            completed_at: new Date().toISOString(),
          };
          saveLocalMilestones(local);
          return { milestone: local[idx] };
        }
        throw new Error("Không tìm thấy milestone local");
      }

      const { data, error } = await supabase.functions.invoke("manage-contracts", {
        body: { action: "complete_milestone", ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateContractRelated(qc);
      toast({ title: "Hoàn thành milestone" });
    },
  });

  return { milestones, isLoading, addMilestone, completeMilestone };
}
