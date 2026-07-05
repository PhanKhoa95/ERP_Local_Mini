import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export interface BotcakeButton {
  id: string;
  label: string;
  type: "url" | "call" | "flow";
  value: string;
}

export interface BotcakeFlow {
  id: string;
  name: string;
  trigger_keywords: string[];
  message_content: string;
  buttons: BotcakeButton[];
  created_at: string;
}

export interface BotcakeBroadcast {
  id: string;
  name: string;
  message_content: string;
  status: "draft" | "scheduled" | "sent";
  scheduled_at: string | null;
  sent_count: number;
  delivery_rate: number;
  created_at: string;
}

export interface BotcakeSequence {
  id: string;
  name: string;
  delay_value: number;
  delay_unit: "hours" | "days";
  trigger_flow_id: string;
  is_active: boolean;
  created_at: string;
}

export interface BotcakeRefLink {
  id: string;
  name: string;
  ref_code: string;
  trigger_flow_id: string;
  click_count: number;
  created_at: string;
}

const FLOWS_KEY = "botcake_flows";
const BROADCASTS_KEY = "botcake_broadcasts";
const SEQUENCES_KEY = "botcake_sequences";
const REFLINKS_KEY = "botcake_reflinks";

const getLocal = <T>(key: string, seed: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return seed;
  }
};

const saveLocal = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Seed Data
const seedFlows = (): BotcakeFlow[] => [
  {
    id: "flow-welcome",
    name: "Lời chào mừng tự động",
    trigger_keywords: ["hello", "hi", "bắt đầu", "start"],
    message_content: "Chào mừng bạn đến với shop! 🌟 Chúng tôi có thể giúp gì cho bạn hôm nay? Vui lòng chọn danh mục tư vấn dưới đây để được hỗ trợ nhanh nhất.",
    buttons: [
      { id: "btn-1", label: "Xem báo giá sỉ 📋", type: "flow", value: "flow-wholesale" },
      { id: "btn-2", label: "Gọi hotline tư vấn 📞", type: "call", value: "19008080" },
      { id: "btn-3", label: "Truy cập website 🌐", type: "url", value: "https://pancake.vn" }
    ],
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: "flow-wholesale",
    name: "Kịch bản báo giá sỉ",
    trigger_keywords: ["giá sỉ", "chiết khấu", "bán buôn"],
    message_content: "Dưới đây là chính sách giá sỉ mới nhất dành cho Sticker & Thiệp của shop:\n- Đơn từ 1.000 chiếc: Chiết khấu 10%\n- Đơn từ 5.000 chiếc: Chiết khấu 20%\n- Đơn từ 10.000 chiếc: Chiết khấu 30% kèm miễn phí thiết kế khuôn in.",
    buttons: [
      { id: "btn-4", label: "Tải catalog sticker 📂", type: "url", value: "https://pancake.vn/catalog" },
      { id: "btn-5", label: "Tạo cơ hội sỉ trên CRM 📈", type: "flow", value: "flow-crm-sync" }
    ],
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const seedBroadcasts = (): BotcakeBroadcast[] => [
  {
    id: "bc-1",
    name: "Chiến dịch Tết 2026 - Tặng Coupon 15%",
    message_content: "Chương trình tri ân khách hàng cũ: Nhập mã TET2026 giảm ngay 15% cho mọi đơn in ấn Sticker & Thiệp cảm ơn đặt trước ngày 20/12 âm lịch!",
    status: "sent",
    scheduled_at: null,
    sent_count: 1450,
    delivery_rate: 98.6,
    created_at: new Date(Date.now() - 3600000 * 120).toISOString()
  },
  {
    id: "bc-2",
    name: "Lịch phát sóng Livestream Xưởng in",
    message_content: "Bấm xem Livestream trực tiếp quy trình in Offset sticker khổ lớn vào lúc 19:30 tối nay để nhận 50 voucher freeship toàn quốc!",
    status: "scheduled",
    scheduled_at: new Date(Date.now() + 3600000 * 4).toISOString(),
    sent_count: 0,
    delivery_rate: 0,
    created_at: new Date().toISOString()
  }
];

const seedSequences = (): BotcakeSequence[] => [
  {
    id: "seq-1",
    name: "Chuỗi chăm sóc khách mới (Sequence Welcome)",
    delay_value: 1,
    delay_unit: "hours",
    trigger_flow_id: "flow-welcome",
    is_active: true,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString()
  },
  {
    id: "seq-2",
    name: "Gửi ưu đãi sau 24h tư vấn sỉ",
    delay_value: 1,
    delay_unit: "days",
    trigger_flow_id: "flow-wholesale",
    is_active: false,
    created_at: new Date().toISOString()
  }
];

const seedRefLinks = (): BotcakeRefLink[] => [
  {
    id: "ref-1",
    name: "Ref Link Quảng cáo Facebook Sticker",
    ref_code: "sticker_sale_15",
    trigger_flow_id: "flow-welcome",
    click_count: 480,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: "ref-2",
    name: "Ref Link Thiệp B2B trên Bio Tiktok",
    ref_code: "tiktok_bio_card",
    trigger_flow_id: "flow-wholesale",
    click_count: 124,
    created_at: new Date().toISOString()
  }
];

export function useBotcake() {
  const queryClient = useQueryClient();

  // Queries
  const flowsQuery = useQuery({
    queryKey: ["botcake_flows"],
    queryFn: async () => getLocal(FLOWS_KEY, seedFlows())
  });

  const broadcastsQuery = useQuery({
    queryKey: ["botcake_broadcasts"],
    queryFn: async () => getLocal(BROADCASTS_KEY, seedBroadcasts())
  });

  const sequencesQuery = useQuery({
    queryKey: ["botcake_sequences"],
    queryFn: async () => getLocal(SEQUENCES_KEY, seedSequences())
  });

  const refLinksQuery = useQuery({
    queryKey: ["botcake_reflinks"],
    queryFn: async () => getLocal(REFLINKS_KEY, seedRefLinks())
  });

  // Mutations - Flows
  const createFlow = useMutation({
    mutationFn: async (flow: Omit<BotcakeFlow, "id" | "created_at">) => {
      const local = getLocal(FLOWS_KEY, seedFlows());
      const newFlow: BotcakeFlow = {
        ...flow,
        id: `flow-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      saveLocal(FLOWS_KEY, [newFlow, ...local]);
      return newFlow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["botcake_flows"] });
      toast({ title: "Tạo kịch bản chatbot mới thành công" });
    }
  });

  const updateFlow = useMutation({
    mutationFn: async (flow: BotcakeFlow) => {
      const local = getLocal(FLOWS_KEY, seedFlows());
      const idx = local.findIndex(f => f.id === flow.id);
      if (idx > -1) {
        local[idx] = flow;
        saveLocal(FLOWS_KEY, local);
        return flow;
      }
      throw new Error("Không tìm thấy kịch bản");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["botcake_flows"] });
      toast({ title: "Cập nhật kịch bản chatbot thành công" });
    }
  });

  const deleteFlow = useMutation({
    mutationFn: async (id: string) => {
      const local = getLocal(FLOWS_KEY, seedFlows());
      const updated = local.filter(f => f.id !== id);
      saveLocal(FLOWS_KEY, updated);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["botcake_flows"] });
      toast({ title: "Đã xóa kịch bản chatbot" });
    }
  });

  // Mutations - Broadcasts
  const createBroadcast = useMutation({
    mutationFn: async (broadcast: Omit<BotcakeBroadcast, "id" | "created_at" | "sent_count" | "delivery_rate" | "status">) => {
      const local = getLocal(BROADCASTS_KEY, seedBroadcasts());
      const newBc: BotcakeBroadcast = {
        ...broadcast,
        id: `bc-${Date.now()}`,
        status: "draft",
        sent_count: 0,
        delivery_rate: 0,
        created_at: new Date().toISOString()
      };
      saveLocal(BROADCASTS_KEY, [newBc, ...local]);
      return newBc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["botcake_broadcasts"] });
      toast({ title: "Tạo chiến dịch gửi tin hàng loạt thành công" });
    }
  });

  const sendBroadcast = useMutation({
    mutationFn: async (id: string) => {
      const local = getLocal(BROADCASTS_KEY, seedBroadcasts());
      const idx = local.findIndex(b => b.id === id);
      if (idx > -1) {
        local[idx].status = "sent";
        local[idx].sent_count = Math.floor(1000 + Math.random() * 1500);
        local[idx].delivery_rate = parseFloat((95 + Math.random() * 4).toFixed(1));
        saveLocal(BROADCASTS_KEY, local);
        return local[idx];
      }
      throw new Error("Không tìm thấy chiến dịch");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["botcake_broadcasts"] });
      toast({ title: "Gửi tin hàng loạt thành công tới tất cả khách đăng ký!" });
    }
  });

  // Mutations - Sequences
  const createSequence = useMutation({
    mutationFn: async (seq: Omit<BotcakeSequence, "id" | "created_at" | "is_active">) => {
      const local = getLocal(SEQUENCES_KEY, seedSequences());
      const newSeq: BotcakeSequence = {
        ...seq,
        id: `seq-${Date.now()}`,
        is_active: true,
        created_at: new Date().toISOString()
      };
      saveLocal(SEQUENCES_KEY, [newSeq, ...local]);
      return newSeq;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["botcake_sequences"] });
      toast({ title: "Tạo chuỗi chăm sóc tự động thành công" });
    }
  });

  const toggleSequence = useMutation({
    mutationFn: async (id: string) => {
      const local = getLocal(SEQUENCES_KEY, seedSequences());
      const idx = local.findIndex(s => s.id === id);
      if (idx > -1) {
        local[idx].is_active = !local[idx].is_active;
        saveLocal(SEQUENCES_KEY, local);
        return local[idx];
      }
      throw new Error("Không tìm thấy chuỗi");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["botcake_sequences"] });
      toast({ title: "Cập nhật trạng thái chuỗi thành công" });
    }
  });

  // Mutations - Ref Links
  const createRefLink = useMutation({
    mutationFn: async (ref: Omit<BotcakeRefLink, "id" | "created_at" | "click_count">) => {
      const local = getLocal(REFLINKS_KEY, seedRefLinks());
      const newRef: BotcakeRefLink = {
        ...ref,
        id: `ref-${Date.now()}`,
        click_count: 0,
        created_at: new Date().toISOString()
      };
      saveLocal(REFLINKS_KEY, [newRef, ...local]);
      return newRef;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["botcake_reflinks"] });
      toast({ title: "Tạo Ref Link tăng trưởng thành công" });
    }
  });

  return {
    flows: flowsQuery.data || [],
    flowsLoading: flowsQuery.isLoading,
    createFlow,
    updateFlow,
    deleteFlow,

    broadcasts: broadcastsQuery.data || [],
    broadcastsLoading: broadcastsQuery.isLoading,
    createBroadcast,
    sendBroadcast,

    sequences: sequencesQuery.data || [],
    sequencesLoading: sequencesQuery.isLoading,
    createSequence,
    toggleSequence,

    refLinks: refLinksQuery.data || [],
    refLinksLoading: refLinksQuery.isLoading,
    createRefLink
  };
}
