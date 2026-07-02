import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  Brain,
  Sparkles, 
  Phone, 
  MapPin, 
  Clock, 
  User, 
  Settings2, 
  ShieldAlert, 
  Check, 
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Tag,
  ShoppingBag,
  Trash2,
  Heart,
  Smile,
  Frown,
  Meh,
  Sliders,
  Database,
  SlidersHorizontal,
  ThumbsUp,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  sender: "customer" | "agent" | "bot";
  senderName: string;
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  lastMessage: string;
  channel: "zalo" | "facebook" | "webchat";
  status: "open" | "resolved";
  unread: boolean;
  messages: Message[];
  tags?: string[];
  needsHuman?: boolean;
  autopilotEnabled?: boolean;
  pronoun?: "anh" | "chị" | "bạn";
  classification?: "Khách thường" | "Khách VIP" | "Khách sỉ" | "Khách khó tính";
  currentEmotion?: "Lo lắng" | "Vui vẻ" | "Bình thường" | "Giận dữ";
  internalNotes?: string;
  chatStyle?: string;
  onboardingLog?: string;
}

interface CustomerMemory {
  id: string;
  customerPhone: string;
  fact: string;
  importance: 1 | 2 | 3;
  createdAt: string;
}

interface CustomerSentiment {
  id: string;
  customerPhone: string;
  score: number; // 0-100
  label: string; // "Rất hài lòng" | "Thân thiện" | "Khó tính" | "Giận dữ" | "Trung lập"
  summary: string;
  createdAt: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface RAGDoc {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  charCount: number;
  chunkCount: number;
  createdAt: string;
}

interface APIFeature {
  id: string;
  name: string;
  sdk: string;
  description: string;
  count: string;
  rate?: string;
  enabled: boolean;
  channels: ("zalo" | "facebook" | "telegram" | "web")[];
}

export function CskhInboxTab({ mode = "chat" }: { mode?: "chat" | "settings" }) {
  const { toast } = useToast();
  
  // Settings Config
  const [config, setConfig] = useState({
    autoCreateOrders: true,
    autoCreateOrdersImmediately: false,
    aiAutoReply: true,
    aiAutoExtractMemory: true,
  });

  // RAG Configuration States
  const [ragSearchMode, setRagSearchMode] = useState("Hybrid (Vector + TF-IDF)");
  const [ragTopK, setRagTopK] = useState(3);
  const [ragThreshold, setRagThreshold] = useState(0.60);
  const [ragQueryTest, setRagQueryTest] = useState("");
  const [ragTestResult, setRagTestResult] = useState("");

  const defaultRAGDocs: RAGDoc[] = [
    {
      id: "rag-1",
      title: "Chính sách Hoàn trả & Đổi mới",
      content: "Khách hàng được đổi mới sản phẩm 1-1 trong vòng 30 ngày nếu phát hiện lỗi phần cứng từ nhà sản xuất. Đối với các mặt hàng thời trang ví da, shop cam kết hỗ trợ đổi trả miễn phí tận nơi.",
      enabled: true,
      charCount: 250,
      chunkCount: 1,
      createdAt: "12/6/2026"
    },
    {
      id: "rag-2",
      title: "Giới thiệu bản thân",
      content: "Bạn tên là phan đăng khoa, Lĩnh vực làm việc RD Agent Layer.",
      enabled: true,
      charCount: 60,
      chunkCount: 1,
      createdAt: "12/6/2026"
    }
  ];

  const [ragDocs, setRagDocs] = useState<RAGDoc[]>(defaultRAGDocs);
  const [newRagTitle, setNewRagTitle] = useState("");
  const [newRagContent, setNewRagContent] = useState("");

  // Zalo API Control States
  const defaultAPIFeatures: APIFeature[] = [
    // 1. Nhóm tương tác & chat
    { id: "f1", name: "Chấp nhận kết bạn", sdk: "acceptFriendRequest", description: "Chấp nhận lời mời kết bạn từ người khác.", count: "0 / 0", enabled: true },
    { id: "f2", name: "Chặn thành viên nhóm", sdk: "addGroupBlockedMember", description: "Thêm người dùng vào danh sách chặn của nhóm.", count: "0 / 0", enabled: true },
    { id: "f3", name: "Bổ nhiệm phó nhóm", sdk: "addGroupDeputy", description: "Thăng cấp một thành viên trong nhóm làm phó nhóm.", count: "0 / 0", enabled: true },
    { id: "f4", name: "Thêm tin nhắn nhanh", sdk: "addQuickMessage", description: "Tạo cấu hình một tin nhắn trả lời nhanh mới.", count: "0 / 0", enabled: true },
    { id: "f5", name: "Thả cảm xúc", sdk: "addReaction", description: "Thả cảm xúc (tim, like, haha, phẫn nộ...) vào tin nhắn.", count: "8 / 0", rate: "100%", enabled: true },
    { id: "f6", name: "Đánh dấu chưa đọc", sdk: "addUnreadMark", description: "Đánh dấu cuộc hội thoại là chưa đọc.", count: "0 / 0", enabled: true },
    { id: "f7", name: "Thêm thành viên nhóm", sdk: "addUserToGroup", description: "Mời/thêm trực tiếp người dùng vào nhóm chat.", count: "0 / 0", enabled: true },
    { id: "f8", name: "Chặn người dùng", sdk: "blockUser", description: "Chặn người dùng gửi tin nhắn hoặc gọi điện.", count: "0 / 0", enabled: true },
    { id: "f9", name: "Chặn xem bài đăng", sdk: "blockViewFeed", description: "Chặn người dùng xem các bài viết nhật ký.", count: "0 / 0", enabled: true },
    { id: "f10", name: "Gửi tin nhắn văn bản", sdk: "sendMessage", description: "Gửi tin nhắn văn bản thủ công hoặc qua chatbot tự động.", count: "125 / 0", rate: "100%", enabled: true },
    { id: "f11", name: "Gửi tệp đính kèm/PDF", sdk: "sendFile", description: "Gửi tài liệu, ảnh, hóa đơn điện tử PDF qua chat Zalo.", count: "12 / 0", rate: "100%", enabled: true },
    { id: "f12", name: "Gửi vị trí", sdk: "sendLocation", description: "Gửi định vị bản đồ cửa hàng/chi nhánh gần nhất cho khách.", count: "2 / 0", rate: "100%", enabled: true },
    
    // 2. Nhóm ZNS & OTP
    { id: "f13", name: "Gửi mã OTP xác thực", sdk: "sendZNSOTP", description: "Gửi mã PIN/OTP xác minh tài khoản khi đăng ký Loyalty.", count: "140 / 0", rate: "99.8%", enabled: true },
    { id: "f14", name: "Gửi ZNS Trạng thái đơn hàng", sdk: "sendZNSTransaction", description: "Tự động gửi thông báo ZNS khi tạo đơn, giao hàng hoặc hoàn tất đơn.", count: "98 / 0", rate: "100%", enabled: true },
    { id: "f15", name: "Gửi ZNS Loyalty", sdk: "sendZNSLoyalty", description: "Gửi tin chúc mừng sinh nhật, khuyến mại cá nhân hóa cho khách hàng VIP.", count: "0 / 0", enabled: true },
    
    // 3. Nhóm Profile & Marketing
    { id: "f16", name: "Lấy chi tiết người dùng", sdk: "getUserProfile", description: "Lấy Tên, Avatar, giới tính, vùng miền của khách từ API Zalo.", count: "45 / 0", rate: "100%", enabled: true },
    { id: "f17", name: "Lấy người quan tâm OA", sdk: "getFollowerList", description: "Tải danh sách các khách hàng đã bấm quan tâm Official Account.", count: "2 / 0", rate: "100%", enabled: true },
    { id: "f18", name: "Gửi tin Broadcast hàng loạt", sdk: "sendBroadcast", description: "Gửi tin nhắn quảng bá chương trình ưu đãi định kỳ hàng tháng.", count: "1 / 0", rate: "100%", enabled: true },
    { id: "f19", name: "Cấu hình Menu nhanh", sdk: "setupOAContextMenu", description: "Thiết lập menu nút nhấn tương tác nhanh dưới khung chat.", count: "1 / 0", rate: "100%", enabled: true }
  ];

  const [apiFeatures, setApiFeatures] = useState<APIFeature[]>(defaultAPIFeatures);

  const defaultConvs: Conversation[] = [
    {
      id: "conv-1",
      customerName: "Lê Văn Cường",
      customerPhone: "0982738492",
      customerAddress: "125 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. HCM",
      lastMessage: "Cảm ơn shop đã tư vấn nhiệt tình nhé!",
      channel: "zalo",
      status: "open",
      unread: false,
      tags: ["VIP", "Hà Nội"],
      needsHuman: false,
      autopilotEnabled: true,
      pronoun: "anh",
      classification: "Khách VIP",
      currentEmotion: "Vui vẻ",
      chatStyle: "Lịch sự 🌸",
      onboardingLog: "🤖 AI Onboarding: Đã đoán danh xưng (Anh) qua tên chứa đệm 'Văn', cách trò chuyện lịch sự.",
      internalNotes: "Khách quen quan tâm các mẫu túi da thật, chuộng giao hàng COD nội thành.",
      messages: [
        { id: "m1", sender: "customer", senderName: "Lê Văn Cường", content: "Shop ơi, mẫu túi đeo chéo đen còn hàng ở chi nhánh Hà Nội không?", timestamp: "10:30" },
        { id: "m2", sender: "agent", senderName: "Hải Yến", content: "Dạ dạ, mẫu đó chi nhánh Hà Nội còn 2 chiếc ạ. Anh qua xem hay muốn em ship COD luôn?", timestamp: "10:32" },
        { id: "m3", sender: "customer", senderName: "Lê Văn Cường", content: "Cảm ơn shop đã tư vấn nhiệt tình nhé!", timestamp: "10:35" }
      ]
    },
    {
      id: "conv-2",
      customerName: "Nguyễn Thị Mai",
      customerPhone: "0912345678",
      customerAddress: "45 Lê Lợi, Quận Hải Châu, Đà Nẵng",
      lastMessage: "Sản phẩm bị lỗi hỏng khóa rồi, shop đổi cho tôi hoặc gặp nhân viên xử lý gấp!",
      channel: "facebook",
      status: "open",
      unread: true,
      tags: ["Khách Sỉ"],
      needsHuman: true,
      autopilotEnabled: false,
      pronoun: "chị",
      classification: "Khách khó tính",
      currentEmotion: "Lo lắng",
      chatStyle: "Nóng vội 🔔",
      onboardingLog: "🤖 AI Onboarding: Đã đoán danh xưng (Chị) qua tên chứa đệm 'Thị'. Giọng điệu khắt khe nóng vội (yêu cầu gấp, báo lỗi).",
      internalNotes: "Muốn đặt số lượng lớn ví da, yêu cầu bảo hành kỹ càng và giá sỉ ưu đãi.",
      messages: [
        { id: "m4", sender: "customer", senderName: "Nguyễn Thị Mai", content: "Sản phẩm bị lỗi hỏng khóa rồi, shop đổi cho tôi hoặc gặp nhân viên xử lý gấp!", timestamp: "11:02" },
        { id: "m-sys-1", sender: "bot", senderName: "Hệ thống AI", content: "[Báo động] AI phát hiện yêu cầu khiếu nại/báo lỗi ngoài phạm vi xử lý. Đã ngắt Autopilot và phát cảnh báo yêu cầu nhân viên can thiệp.", timestamp: "11:03" }
      ]
    }
  ];

  const [conversations, setConversations] = useState<Conversation[]>(defaultConvs);
  const [activeConvId, setActiveConvId] = useState("conv-1");
  const [replyText, setReplyText] = useState("");
  const [chatRole, setChatRole] = useState<"agent" | "customer">("agent");

  // AI Memory States
  const [memories, setMemories] = useState<CustomerMemory[]>([]);
  const [newMemoryText, setNewMemoryText] = useState("");
  const [sentiments, setSentiments] = useState<CustomerSentiment[]>([]);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);

  // AI Suggestion States
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [aiSuggestedReply, setAiSuggestedReply] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Editable Active CRM Fields
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editClassification, setEditClassification] = useState<any>("Khách thường");
  const [editPronoun, setEditPronoun] = useState<any>("anh");
  const [editEmotion, setEditEmotion] = useState<any>("Bình thường");
  const [editNotes, setEditNotes] = useState("");

  // Webhook Simulator State
  const [selectedWebhookChannel, setSelectedWebhookChannel] = useState<"zalo" | "facebook">("zalo");
  const [webhookPayload, setWebhookPayload] = useState("");
  const [webhookLogs, setWebhookLogs] = useState<string[]>([]);

  // Load configuration and data from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem("erp-mini-cskh-config");
    if (savedConfig) setConfig(JSON.parse(savedConfig));

    const savedConvs = localStorage.getItem("erp-mini-cskh-conversations");
    if (savedConvs) {
      setConversations(JSON.parse(savedConvs));
    } else {
      localStorage.setItem("erp-mini-cskh-conversations", JSON.stringify(defaultConvs));
    }

    const savedMems = localStorage.getItem("erp-mini-cskh-memories");
    if (savedMems) {
      setMemories(JSON.parse(savedMems));
    } else {
      const defaultMems: CustomerMemory[] = [
        { id: "mem-d1", customerPhone: "0982738492", fact: "Quan tâm đến mẫu ví nam da bò", importance: 2, createdAt: new Date().toISOString() },
        { id: "mem-d2", customerPhone: "0982738492", fact: "Ưu tiên nhận hàng ship COD giờ hành chính", importance: 2, createdAt: new Date().toISOString() }
      ];
      setMemories(defaultMems);
      localStorage.setItem("erp-mini-cskh-memories", JSON.stringify(defaultMems));
    }

    const savedSents = localStorage.getItem("erp-mini-cskh-sentiments");
    if (savedSents) setSentiments(JSON.parse(savedSents));

    // Load RAG Docs
    const savedRAG = localStorage.getItem("erp-mini-rag-docs");
    if (savedRAG) setRagDocs(JSON.parse(savedRAG));

    // Load Zalo API Features
    const savedAPIFeatures = localStorage.getItem("erp-mini-zalo-api-features");
    if (savedAPIFeatures) setApiFeatures(JSON.parse(savedAPIFeatures));

    // Load orders
    const savedOrders = localStorage.getItem("erp-mini-local-demo-orders");
    if (savedOrders) setOrders(JSON.parse(savedOrders));

    // Default Webhook simulator JSON payload
    setWebhookPayload(JSON.stringify({
      sender: {
        name: "Lê Thị Lan",
        phone: "0934567890"
      },
      message: {
        text: "Dạ shop ơi, em muốn hỏi mẫu ví da nam có giá sỉ là bao nhiêu vậy ạ?"
      }
    }, null, 2));
  }, []);

  const saveConfig = (newCfg: typeof config) => {
    setConfig(newCfg);
    localStorage.setItem("erp-mini-cskh-config", JSON.stringify(newCfg));
  };

  const saveConversations = (newConvs: Conversation[]) => {
    setConversations(newConvs);
    localStorage.setItem("erp-mini-cskh-conversations", JSON.stringify(newConvs));
  };

  const saveMemories = (newMems: CustomerMemory[]) => {
    setMemories(newMems);
    localStorage.setItem("erp-mini-cskh-memories", JSON.stringify(newMems));
  };

  const saveSentiments = (newSents: CustomerSentiment[]) => {
    setSentiments(newSents);
    localStorage.setItem("erp-mini-cskh-sentiments", JSON.stringify(newSents));
  };

  const saveRAGDocs = (newDocs: RAGDoc[]) => {
    setRagDocs(newDocs);
    localStorage.setItem("erp-mini-rag-docs", JSON.stringify(newDocs));
  };

  const saveAPIFeatures = (newFeatures: APIFeature[]) => {
    setApiFeatures(newFeatures);
    localStorage.setItem("erp-mini-zalo-api-features", JSON.stringify(newFeatures));
  };

  // Sync updates periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const savedOrders = localStorage.getItem("erp-mini-local-demo-orders");
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  // Set CRM edit states when active conversation changes
  useEffect(() => {
    if (activeConv) {
      setEditName(activeConv.customerName || "");
      setEditPhone(activeConv.customerPhone || "");
      setEditClassification(activeConv.classification || "Khách thường");
      setEditPronoun(activeConv.pronoun || "anh");
      setEditEmotion(activeConv.currentEmotion || "Bình thường");
      setEditNotes(activeConv.internalNotes || "");
    }
  }, [activeConvId, conversations]);

  // Filter orders matching active customer phone
  const activeCustomerOrders = orders.filter(
    o => o.customer_phone === activeConv?.customerPhone
  );

  // Active Customer Sentiment
  const activeSentiment = sentiments.find(
    s => s.customerPhone === activeConv?.customerPhone
  );

  // AI First-time Onboarding Profiler helper
  const profileNewCustomer = (name: string, message: string) => {
    const lowerName = name.toLowerCase();
    const lowerMsg = message.toLowerCase();
    
    // Guess pronoun
    let pronoun: "anh" | "chị" | "bạn" = "bạn";
    if (lowerName.includes("văn") || lowerName.includes("cường") || lowerName.includes("nam") || lowerName.includes("phong") || lowerName.includes("hoàng") || lowerName.includes("đăng")) {
      pronoun = "anh";
    } else if (lowerName.includes("thị") || lowerName.includes("mai") || lowerName.includes("lan") || lowerName.includes("vy") || lowerName.includes("hương") || lowerName.includes("ngọc")) {
      pronoun = "chị";
    }

    // Determine chat tone style
    let chatStyle = "Trực diện ⚡";
    let classification: "Khách thường" | "Khách VIP" | "Khách sỉ" | "Khách khó tính" = "Khách thường";
    let currentEmotion: "Lo lắng" | "Vui vẻ" | "Bình thường" | "Giận dữ" = "Bình thường";

    if (lowerMsg.includes("dạ") || lowerMsg.includes("ạ") || lowerMsg.includes("làm ơn") || lowerMsg.includes("cảm ơn") || lowerMsg.includes("shop ơi")) {
      chatStyle = "Lịch sự 🌸";
    } else if (lowerMsg.includes("lỗi") || lowerMsg.includes("hỏng") || lowerMsg.includes("rách") || lowerMsg.includes("gấp") || lowerMsg.includes("tại sao") || lowerMsg.includes("đền tiền")) {
      chatStyle = "Nóng vội 🔔";
      classification = "Khách khó tính";
      currentEmotion = "Lo lắng";
    }

    const pronounLabel = pronoun === "anh" ? "Anh" : pronoun === "chị" ? "Chị" : "Bạn";
    const onboardingLog = `🤖 AI Onboarding: Đã tự động nhận diện khách hàng qua tên (đoán Xưng hô: ${pronounLabel}) và Cách nói chuyện (${chatStyle.split(" ")[0]}).`;

    return {
      pronoun,
      chatStyle,
      classification,
      currentEmotion,
      onboardingLog
    };
  };

  // Build context payload for LLM including memories & RAG knowledge base
  const buildLLMContext = () => {
    const customerMemories = memories
      .filter(m => m.customerPhone === activeConv?.customerPhone)
      .map(m => `- Ghi nhớ của shop về khách hàng này: ${m.fact}`)
      .join("\n");

    const enabledRAGDocs = ragDocs
      .filter(d => d.enabled)
      .map(d => `[Tài liệu RAG - ${d.title}]: ${d.content}`)
      .join("\n");

    return `
[Dữ liệu trí nhớ dài hạn và chính sách (RAG) để ứng xử tự nhiên]:
${customerMemories || "- Chưa có ghi nhớ dài hạn nào về khách này."}

${enabledRAGDocs || "- Không có chính sách bổ sung nào."}
`;
  };

  // Send message handler (supports role simulation & onboarding profiling)
  const handleSendMessage = () => {
    if (!replyText.trim()) return;
    
    const messageContent = replyText;
    const isCustomer = chatRole === "customer";
    
    const newMsg: Message = {
      id: `m-new-${Date.now()}`,
      sender: isCustomer ? "customer" : "agent",
      senderName: isCustomer ? activeConv.customerName : "Admin POS",
      content: messageContent,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    // If customer sends a message and it's their first or we want to trigger profiling
    let profiledInfo = {};
    if (isCustomer) {
      profiledInfo = profileNewCustomer(activeConv.customerName, messageContent);
    }

    let updatedConvs = conversations.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          lastMessage: messageContent,
          unread: isCustomer,
          needsHuman: isCustomer ? c.needsHuman : false,
          messages: [...c.messages, newMsg],
          ...profiledInfo
        };
      }
      return c;
    });

    saveConversations(updatedConvs);
    setReplyText("");
    setAiSuggestedReply("");

    toast({
      title: isCustomer ? "Khách gửi tin nhắn" : "Tin nhắn đã gửi",
      description: isCustomer ? "Đã giả lập tin nhắn khách hàng và chạy phân tích Onboarding AI." : "Đã phản hồi trực tiếp tới khách hàng."
    });

    // If sent as customer and autopilot is enabled
    if (isCustomer && config.aiAutoReply) {
      const isComplex = /lỗi|hỏng|rách|đền tiền|hoàn tiền|khiếu nại|gặp nhân viên|chất lượng/i.test(messageContent);
      const activePronoun = (profiledInfo as any).pronoun || activeConv.pronoun || "anh";
      const greeting = activePronoun === "anh" ? "anh" : activePronoun === "chị" ? "chị" : "bạn";

      setTimeout(async () => {
        const latestConv = JSON.parse(localStorage.getItem("erp-mini-cskh-conversations") || "[]")
          .find((c: any) => c.id === activeConvId) || activeConv;

        let messagesList = [...latestConv.messages];

        if (isComplex) {
          // Trigger Escalation Alarm
          const sysMsg: Message = {
            id: `m-sys-${Date.now()}`,
            sender: "bot",
            senderName: "Hệ thống AI",
            content: "[Báo động] AI phát hiện yêu cầu khiếu nại/báo lỗi ngoài phạm vi xử lý. Đã ngắt Autopilot và báo động yêu cầu nhân viên can thiệp.",
            timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
          };
          messagesList.push(sysMsg);

          const updated = conversations.map(c => {
            if (c.id === activeConvId) {
              return {
                ...c,
                needsHuman: true,
                autopilotEnabled: false,
                currentEmotion: "Lo lắng" as const,
                messages: messagesList
              };
            }
            return c;
          });
          saveConversations(updated);
          toast({
            variant: "destructive",
            title: "Phát hiện khiếu nại! 🚨",
            description: "Hệ thống đã tự động ngắt Autopilot và báo động nhân viên hỗ trợ."
          });
        } else {
          // Live LLM Autopilot Reply (Incorporate RAG and Memory Context!)
          let botReplyText = "";
          try {
            const promptMsgs = messagesList.map(m => ({
              role: m.sender === "customer" ? ("user" as const) : ("assistant" as const),
              content: m.content
            }));
            promptMsgs.push({
              role: "user" as const,
              content: `Bạn là nhân viên tư vấn bán hàng thời trang. Hãy đọc lịch sử chat, các ghi nhớ dài hạn về khách hàng và tài liệu RAG dưới đây để phản hồi tự nhiên, chuyên nghiệp (Xưng là em/shop, gọi khách là ${greeting}). Tên khách hàng: ${activeConv.customerName}. Trả lời trực tiếp câu hỏi của khách hàng. Tránh lặp lại câu hỏi SĐT/địa chỉ nếu khách đã gửi. Trả lời dưới 3 câu.
              
              ${buildLLMContext()}`
            });

            const { data, error } = await supabase.functions.invoke("ai-erp-assistant", {
              body: { messages: promptMsgs }
            });
            if (!error && data?.answer) {
              botReplyText = data.answer;
            }
          } catch (e) {
            console.warn("Autopilot live LLM fail, using fallback template:", e);
          }

          if (!botReplyText) {
            // Smarter fallback using RAG and customer memories
            const hasPhone = /(0[3|5|7|8|9])+([0-9]{8})\b/.test(messageContent);
            const hasAddress = /địa chỉ|ở|ship/i.test(messageContent) || messageContent.length > 15 && (messageContent.includes("đường") || messageContent.includes("quận") || messageContent.includes("hồ chí minh") || messageContent.includes("hà nội") || messageContent.includes("hcm") || messageContent.includes("hn"));
            const customerMemories = memories.filter(m => m.customerPhone === activeConv.customerPhone);

            if (messageContent.includes("đổi trả") || messageContent.includes("hoàn tiền") || messageContent.includes("lỗi")) {
              const refundDoc = ragDocs.find(d => d.id === "rag-1");
              botReplyText = refundDoc?.enabled 
                ? `Dạ chào ${greeting}, về chính sách đổi trả: ${refundDoc.content} ạ.`
                : `Dạ chào ${greeting}, bên em hỗ trợ đổi mới sản phẩm lỗi 1-1 trong 30 ngày hoàn toàn miễn phí ạ!`;
            } else if (messageContent.includes("ai") || messageContent.includes("khoa")) {
              const selfDoc = ragDocs.find(d => d.id === "rag-2");
              botReplyText = selfDoc?.enabled
                ? `Dạ thưa ${greeting}, ${selfDoc.content} ạ!`
                : `Dạ, em là chatbot tư vấn thông minh của shop ạ.`;
            } else if (messageContent.includes("thứ mấy") || messageContent.includes("ngày nào")) {
              const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
              const today = days[new Date().getDay()];
              botReplyText = `Dạ báo cáo ${greeting}, hôm nay là ${today} ạ! ${activePronoun === "bạn" ? "Bạn" : greeting.charAt(0).toUpperCase() + greeting.slice(1)} cần em hỗ trợ tư vấn sản phẩm nào thêm không ạ?`;
            } else if (hasPhone && !hasAddress) {
              botReplyText = `Dạ em đã ghi nhận số điện thoại của ${greeting} rồi ạ. ${activePronoun === "bạn" ? "Bạn" : greeting.charAt(0).toUpperCase() + greeting.slice(1)} cho em xin thêm địa chỉ nhận hàng để em chốt gửi đơn đi sớm nhất nhé!`;
            } else if (hasAddress && !hasPhone) {
              botReplyText = `Dạ em đã lưu địa chỉ giao hàng của ${greeting} rồi ạ. ${activePronoun === "bạn" ? "Bạn" : greeting.charAt(0).toUpperCase() + greeting.slice(1)} cho em xin số điện thoại để liên hệ giao hàng nhé!`;
            } else if (hasPhone && hasAddress) {
              botReplyText = `Dạ tuyệt vời quá ạ! Em đã ghi nhận đủ SĐT và địa chỉ của ${greeting} rồi. Shop đang tiến hành tạo đơn hàng và sẽ liên hệ giao hàng sớm nhất cho mình nhé!`;
            } else if (customerMemories.some(m => m.fact.includes("COD"))) {
              botReplyText = `Dạ chào ${greeting}, em thấy trong ghi nhớ của shop mình thích nhận hàng ship COD đúng không ạ? Shop lên đơn giao COD ví da 189k cho mình luôn nhé?`;
            } else {
              botReplyText = messageContent.includes("ví da")
                ? `Dạ chào ${greeting}, ví da nam bên em làm từ da bò thật 100%, giá ưu đãi chỉ 189k. ${activePronoun === "bạn" ? "Bạn" : greeting.charAt(0).toUpperCase() + greeting.slice(1)} cho em xin số điện thoại và địa chỉ nhận hàng để em lên đơn giao ngay nhé ạ!`
                : `Cảm ơn ${greeting} đã liên hệ, mẫu này bên em đang còn hàng sẵn ở kho ạ. Shop có hỗ trợ ship COD nhanh toàn quốc, ${greeting} cho em xin thông tin SĐT và địa chỉ để shop lên đơn ngay ạ!`;
            }
          }

          const botMsg: Message = {
            id: `m-bot-${Date.now()}`,
            sender: "bot",
            senderName: "Tư vấn viên",
            content: botReplyText,
            timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
          };
          messagesList.push(botMsg);

          const updated = conversations.map(c => {
            if (c.id === activeConvId) {
              return {
                ...c,
                messages: messagesList
              };
            }
            return c;
          });
          saveConversations(updated);

          // Simulate addReaction SDK trigger if enabled
          const reactionFeat = apiFeatures.find(f => f.sdk === "addReaction");
          if (reactionFeat && reactionFeat.enabled) {
            const [success, fail] = reactionFeat.count.split(" / ").map(Number);
            const updatedFeatures = apiFeatures.map(f => {
              if (f.sdk === "addReaction") {
                return { ...f, count: `${success + 1} / ${fail}`, rate: "100%" };
              }
              return f;
            });
            setApiFeatures(updatedFeatures);
            localStorage.setItem("erp-mini-zalo-api-features", JSON.stringify(updatedFeatures));
            console.log("🤖 [Zalo SDK] addReaction: Tự động thả cảm xúc (tim/like) vào tin nhắn của khách.");
          }
        }

        // Live Auto-Closer Order Creation
        const hasPhone = /(0[3|5|7|8|9])+([0-9]{8})\b/.test(messageContent);
        const hasAddress = /địa chỉ|ở|ship/i.test(messageContent);

        if (hasPhone && hasAddress && config.autoCreateOrders && !isComplex) {
          const phoneMatch = messageContent.match(/(0[3|5|7|8|9])+([0-9]{8})\b/);
          const customerPhone = phoneMatch ? phoneMatch[0] : activeConv.customerPhone;
          
          const currentOrders = JSON.parse(localStorage.getItem("erp-mini-local-demo-orders") || "[]");
          const orderId = `DH-${Date.now().toString().slice(-6)}`;
          const newOrder = {
            id: orderId,
            order_number: orderId,
            customer_name: activeConv.customerName,
            customer_phone: customerPhone,
            shipping_address: activeConv.customerAddress,
            status: config.autoCreateOrdersImmediately ? "confirmed" : "pending",
            source_type: activeConv.channel,
            total_amount: 189000,
            channel_id: `channel-${activeConv.channel}`,
            notes: `[Tự chốt đơn tự động khi khách hàng chat trực tiếp]`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify([newOrder, ...currentOrders]));
          setOrders([newOrder, ...currentOrders]);
          
          toast({
            title: "Tự động chốt đơn thành công! 🛍️",
            description: `Hệ thống phát hiện đủ SĐT & Địa chỉ, đã tự tạo đơn ${orderId}.`
          });
        }
      }, 1000);
    }
  };

  // Update Customer Profile
  const handleUpdateProfile = () => {
    const updated = conversations.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          customerName: editName,
          customerPhone: editPhone,
          classification: editClassification,
          pronoun: editPronoun,
          currentEmotion: editEmotion,
          internalNotes: editNotes
        };
      }
      return c;
    });
    saveConversations(updated);
    toast({
      title: "Cập nhật thành công! 💾",
      description: "Hồ sơ đối tác và thông tin xưng hô đã được cập nhật thành công."
    });
  };

  // Add long term memory fact manually
  const handleAddMemoryFact = () => {
    if (!newMemoryText.trim()) return;
    
    const newFact: CustomerMemory = {
      id: `mem-${Date.now()}`,
      customerPhone: activeConv.customerPhone,
      fact: newMemoryText.trim(),
      importance: 2,
      createdAt: new Date().toISOString()
    };

    saveMemories([newFact, ...memories]);
    setNewMemoryText("");
    toast({
      title: "Đã thêm ghi nhớ AI",
      description: "Sự thật đã được thêm vào bộ nhớ dài hạn của Bot."
    });
  };

  // Delete memory fact
  const handleDeleteMemoryFact = (idToDelete: string) => {
    saveMemories(memories.filter(m => m.id !== idToDelete));
    toast({
      title: "Đã xóa ghi nhớ"
    });
  };

  // Takeover chat from Autopilot
  const handleTakeover = () => {
    const updated = conversations.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          needsHuman: false,
          autopilotEnabled: false
        };
      }
      return c;
    });
    saveConversations(updated);
    toast({
      title: "Đã tiếp quản cuộc chat! 🧑‍💼",
      description: "Đã tắt chế độ Autopilot cho khách hàng này. Bạn có thể nhắn tin hỗ trợ trực tiếp."
    });
  };

  // Simulate AI sentiment & resolve flow
  const handleResolveAndAnalyze = () => {
    if (!activeConv) return;
    setIsAnalyzingSentiment(true);

    setTimeout(() => {
      const messagesText = activeConv.messages.map(m => m.content).join(" ");
      let score = 78;
      let label = "Thân thiện/Tích cực";
      let summary = "Khách hàng trao đổi cởi mở, hỏi thăm về các mẫu túi sẵn hàng và phản hồi nhanh chóng.";

      if (messagesText.includes("Cảm ơn") || messagesText.includes("nhiệt tình")) {
        score = 96;
        label = "Rất hài lòng";
        summary = "Khách hàng bày tỏ sự biết ơn đối với sự hỗ trợ nhiệt tình và nhanh chóng của tư vấn viên.";
      } else if (messagesText.includes("ví da")) {
        score = 85;
        label = "Tích cực/Hài lòng";
        summary = "Khách hàng quan tâm và muốn được tư vấn giá sỉ/chi tiết sản phẩm ví da nam.";
      } else if (messagesText.includes("lỗi") || messagesText.includes("hỏng") || messagesText.includes("rách")) {
        score = 35;
        label = "Giận dữ/Bực bội";
        summary = "Khách báo lỗi sản phẩm bị hỏng khóa, yêu cầu nhân viên thật vào giải quyết gấp.";
      }

      const newSentiment: CustomerSentiment = {
        id: `sent-${Date.now()}`,
        customerPhone: activeConv.customerPhone,
        score,
        label,
        summary,
        createdAt: new Date().toISOString()
      };

      const updatedSents = [newSentiment, ...sentiments.filter(s => s.customerPhone !== activeConv.customerPhone)];
      saveSentiments(updatedSents);

      const updatedConvs = conversations.map(c => {
        if (c.id === activeConvId) {
          return {
            ...c,
            status: "resolved" as const,
            currentEmotion: (score >= 80 ? "Vui vẻ" : score >= 60 ? "Bình thường" : "Lo lắng") as any
          };
        }
        return c;
      });
      saveConversations(updatedConvs);
      setIsAnalyzingSentiment(false);

      toast({
        title: "Hội thoại đã đóng & AI Phân tích xong! 📊",
        description: `Cảm xúc: ${label} (${score}/100)`
      });
    }, 1500);
  };

  // Suggest reply using real Gemini API (or other active provider) if configured, else fallback
  const handleGenerateAISuggestion = async () => {
    if (!activeConv) return;
    setIsGeneratingSuggestion(true);
    const activePronoun = activeConv.pronoun || "anh";
    const greeting = activePronoun === "anh" ? "anh" : activePronoun === "chị" ? "chị" : "bạn";

    try {
      const messagesPrompt = activeConv.messages.map(m => ({
        role: m.sender === "customer" ? ("user" as const) : ("assistant" as const),
        content: m.content
      }));

      messagesPrompt.push({
        role: "user" as const,
        content: `Bạn là nhân viên tư vấn bán hàng. Hãy đọc kỹ lịch sử hội thoại trên, kết hợp các thông tin về ghi nhớ dài hạn và tài liệu RAG dưới đây để soạn tin nhắn trả lời khách hàng ứng xử tự nhiên, phù hợp nhất (Xưng là em/shop, gọi khách là ${greeting}). Tên khách hàng: ${activeConv.customerName}. Trả lời trực tiếp câu hỏi cuối cùng của khách, cảm ơn nếu khách cung cấp thông tin (như SĐT hay địa chỉ) và khéo léo xin thông tin còn thiếu. Ngắn gọn dưới 3 câu.
        
        ${buildLLMContext()}`
      });

      const { data, error } = await supabase.functions.invoke("ai-erp-assistant", {
        body: { messages: messagesPrompt }
      });

      if (!error && data?.answer) {
        setAiSuggestedReply(data.answer);
        toast({
          title: "Đề xuất AI từ Gemini! 🤖",
          description: "Câu trả lời đã được soạn thảo trực tiếp bằng mô hình AI Gemini của bạn."
        });
        setIsGeneratingSuggestion(false);
        return;
      }
    } catch (err) {
      console.warn("Failed to get suggestion from live LLM, falling back to local simulation:", err);
    }

    setTimeout(() => {
      const customerName = activeConv.customerName;
      const recentMsg = activeConv.messages[activeConv.messages.length - 1]?.content || "";
      const customerMemories = memories
        .filter(m => m.customerPhone === activeConv.customerPhone)
        .map(m => m.fact);

      let suggestion = `Dạ chào ${greeting} ${customerName} ạ, mẫu bên em vẫn đang sẵn hàng.`;
      
      if (recentMsg.includes("đổi trả") || recentMsg.includes("hoàn tiền") || recentMsg.includes("lỗi")) {
        const refundDoc = ragDocs.find(d => d.id === "rag-1");
        suggestion = refundDoc?.enabled 
          ? `Dạ chào ${greeting}, về chính sách đổi trả: ${refundDoc.content} ạ.`
          : `Dạ chào ${greeting}, bên em hỗ trợ đổi mới sản phẩm lỗi 1-1 trong 30 ngày hoàn toàn miễn phí ạ!`;
      } else if (recentMsg.includes("ai") || recentMsg.includes("khoa")) {
        const selfDoc = ragDocs.find(d => d.id === "rag-2");
        suggestion = selfDoc?.enabled
          ? `Dạ thưa ${greeting}, ${selfDoc.content} ạ!`
          : `Dạ, em là chatbot tư vấn thông minh của shop ạ.`;
      } else if (recentMsg.includes("ví da")) {
        suggestion = `Dạ chào ${greeting} ${customerName} ạ, ví da nam bên em làm từ da bò thật 100% cực kỳ bền màu. Hiện sản phẩm đang được giảm giá còn 189k, mình muốn ship về địa chỉ nào để em lên đơn luôn ạ?`;
      } else if (recentMsg.includes("túi đeo chéo") || recentMsg.includes("Hà Nội")) {
        suggestion = `Chào ${greeting} ${customerName} ạ! Mẫu túi đeo chéo đen hiện tại ở chi nhánh Hà Nội bên em đang còn hàng sẵn. Em có thể hỗ trợ tạo đơn giao nhanh ngay trong ngày cho mình nhé!`;
      } else if (customerMemories.some(f => f.includes("ship COD"))) {
        suggestion = `Dạ chào ${greeting} ${customerName}, em thấy mình thường thích nhận hàng ship COD tận nhà đúng không ạ? Em lên đơn COD cho mẫu này về địa chỉ của mình nhé ạ!`;
      }

      setAiSuggestedReply(suggestion);
      setIsGeneratingSuggestion(false);
      toast({
        title: "AI Suggestion Ready! 🤖",
        description: "AI đã phân tích ngữ cảnh và đề xuất nội dung câu trả lời (Giả lập)."
      });
    }, 1200);
  };

  // Webhook Test Console Handler
  const handleTriggerWebhook = () => {
    try {
      const parsed = JSON.parse(webhookPayload);
      const senderName = parsed.sender?.name || "Khách hàng ẩn danh";
      const messageText = parsed.message?.text || "";
      const senderPhone = parsed.sender?.phone || "";

      const logs: string[] = [];
      const timestamp = () => `[${new Date().toLocaleTimeString("vi-VN")}]`;
      
      logs.push(`${timestamp()} [Webhook] Nhận yêu cầu POST từ ${selectedWebhookChannel.toUpperCase()} API...`);
      logs.push(`${timestamp()} [Webhook] Xác thực Verify Token... Hợp lệ!`);
      logs.push(`${timestamp()} [AI Engine] Đang phân tích hội thoại và nội dung chat...`);

      // Run Zalo SDK acceptFriendRequest if enabled
      const friendFeat = apiFeatures.find(f => f.sdk === "acceptFriendRequest");
      if (friendFeat && friendFeat.enabled) {
        const [success, fail] = friendFeat.count.split(" / ").map(Number);
        const updatedFeatures = apiFeatures.map(f => {
          if (f.sdk === "acceptFriendRequest") {
            return { ...f, count: `${success + 1} / ${fail}` };
          }
          return f;
        });
        setApiFeatures(updatedFeatures);
        localStorage.setItem("erp-mini-zalo-api-features", JSON.stringify(updatedFeatures));
        logs.push(`${timestamp()} [Zalo SDK] acceptFriendRequest: Tự động gửi lời mời/đồng ý kết bạn với ${senderName}.`);
      }

      // Run AI First-time Onboarding Profiler
      const profilingResult = profileNewCustomer(senderName, messageText);
      logs.push(`${timestamp()} [AI Onboarding] Tự động phân tích Tên & Giọng điệu khách hàng lần đầu...`);
      logs.push(`${timestamp()} [AI Onboarding] Cấu hình Danh xưng: ${profilingResult.pronoun.toUpperCase()} | Giọng điệu: ${profilingResult.chatStyle}`);

      const isComplex = profilingResult.chatStyle.includes("Nóng vội");

      let existConv = conversations.find(c => c.customerPhone === senderPhone);
      const newMsg: Message = {
        id: `m-web-${Date.now()}`,
        sender: "customer",
        senderName,
        content: messageText,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };

      let currentMessages = existConv ? [...existConv.messages, newMsg] : [newMsg];

      if (isComplex && config.aiAutoReply) {
        const sysMsg: Message = {
          id: `m-sys-${Date.now()}`,
          sender: "bot",
          senderName: "Hệ thống AI",
          content: "[Báo động] AI phát hiện yêu cầu khiếu nại/báo lỗi ngoài phạm vi xử lý. Đã ngắt Autopilot và báo động yêu cầu nhân viên can thiệp.",
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        };
        currentMessages.push(sysMsg);
        logs.push(`${timestamp()} [Escalation Engine] Phát hiện khiếu nại phức tạp. Đang báo động nhân viên...`);
      } else if (config.aiAutoReply && !isComplex) {
        const greeting = profilingResult.pronoun === "anh" ? "anh" : profilingResult.pronoun === "chị" ? "chị" : "bạn";
        const botReplyText = messageText.includes("ví da") 
          ? `Dạ chào ${greeting}, ví da nam bên em làm từ da bò thật 100%, giá ưu đãi chỉ 189k. ${profilingResult.pronoun === "bạn" ? "Bạn" : greeting.charAt(0).toUpperCase() + greeting.slice(1)} cho em xin số điện thoại và địa chỉ nhận hàng để em lên đơn giao ngay nhé ạ!`
          : `Cảm ơn ${greeting} đã liên hệ, mẫu này bên em đang còn hàng sẵn ở kho ạ. Shop có hỗ trợ ship COD nhanh toàn quốc, ${greeting} cho em xin thông tin SĐT và địa chỉ để shop lên đơn ngay ạ!`;
        
        const botMsg: Message = {
          id: `m-bot-${Date.now()}`,
          sender: "bot",
          senderName: "Tư vấn viên",
          content: botReplyText,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        };
        currentMessages.push(botMsg);
        logs.push(`${timestamp()} [AI Autopilot] Tự động soạn thảo và gửi câu trả lời thành công.`);

        // Run Zalo SDK addQuickMessage if enabled
        const quickFeat = apiFeatures.find(f => f.sdk === "addQuickMessage");
        if (quickFeat && quickFeat.enabled) {
          const [success, fail] = quickFeat.count.split(" / ").map(Number);
          const updatedFeatures = apiFeatures.map(f => {
            if (f.sdk === "addQuickMessage") {
              return { ...f, count: `${success + 1} / ${fail}` };
            }
            return f;
          });
          setApiFeatures(updatedFeatures);
          localStorage.setItem("erp-mini-zalo-api-features", JSON.stringify(updatedFeatures));
          logs.push(`${timestamp()} [Zalo SDK] addQuickMessage: Đã tạo và lưu tin nhắn trả lời nhanh mẫu ví da.`);
        }

        // Run Zalo SDK addReaction if enabled
        const reactFeat = apiFeatures.find(f => f.sdk === "addReaction");
        if (reactFeat && reactFeat.enabled) {
          const [success, fail] = reactFeat.count.split(" / ").map(Number);
          const updatedFeatures = apiFeatures.map(f => {
            if (f.sdk === "addReaction") {
              return { ...f, count: `${success + 1} / ${fail}`, rate: "100%" };
            }
            return f;
          });
          setApiFeatures(updatedFeatures);
          localStorage.setItem("erp-mini-zalo-api-features", JSON.stringify(updatedFeatures));
          logs.push(`${timestamp()} [Zalo SDK] addReaction: Tự động thả cảm xúc (tim/like) vào tin nhắn của khách.`);
        }
      }

      if (existConv) {
        const updated = conversations.map(c => {
          if (c.id === existConv!.id) {
            return {
              ...c,
              lastMessage: messageText,
              unread: true,
              needsHuman: isComplex ? true : c.needsHuman,
              autopilotEnabled: isComplex ? false : c.autopilotEnabled,
              messages: currentMessages,
              ...profilingResult
            };
          }
          return c;
        });
        saveConversations(updated);
        logs.push(`${timestamp()} [Chat Engine] Đã cập nhật tin nhắn mới vào cuộc hội thoại của ${senderName}.`);
      } else {
        const newConv: Conversation = {
          id: `conv-webhook-${Date.now()}`,
          customerName: senderName,
          customerPhone: senderPhone,
          customerAddress: "Chưa xác định",
          lastMessage: messageText,
          channel: selectedWebhookChannel,
          status: "open",
          unread: true,
          tags: isComplex ? ["Cần nhân viên"] : ["Mới từ Webhook"],
          needsHuman: isComplex,
          autopilotEnabled: !isComplex,
          messages: currentMessages,
          ...profilingResult
        };
        saveConversations([newConv, ...conversations]);
        setActiveConvId(newConv.id);
        logs.push(`${timestamp()} [Chat Engine] Khởi tạo cuộc hội thoại đa kênh mới cho khách hàng: ${senderName}`);
      }

      if (config.aiAutoExtractMemory) {
        logs.push(`${timestamp()} [AI Memory] Tiến hành bóc tách thông tin khách hàng từ tin nhắn...`);
        const extractedFacts: string[] = [];
        if (messageText.includes("Cầu Giấy") || messageText.includes("Nguyễn Trãi")) {
          const addressMatch = messageText.match(/địa chỉ:?\s*([^.]+)/i) || messageText.match(/địa chỉ\s*([^.]+)/i);
          const address = addressMatch ? addressMatch[1].trim() : "Hà Nội";
          extractedFacts.push(`Địa chỉ giao nhận hàng: ${address}`);
        }
        if (messageText.includes("VC20")) {
          extractedFacts.push("Muốn đặt mua sản phẩm Túi Trắng VC20");
        }

        if (extractedFacts.length > 0) {
          const newMems: CustomerMemory[] = extractedFacts.map(fact => ({
            id: `mem-${Date.now()}-${Math.random()}`,
            customerPhone: senderPhone,
            fact,
            importance: 2,
            createdAt: new Date().toISOString()
          }));
          saveMemories([...newMems, ...memories]);
          logs.push(`${timestamp()} [AI Memory] Đã ghi nhớ: ${extractedFacts.join(" | ")}`);
        }
      }

      if (config.autoCreateOrders && !isComplex) {
        logs.push(`${timestamp()} [Order Engine] Đang phân tích SĐT & Địa chỉ để tự động tạo đơn hàng...`);
        
        const addressMatch = messageText.match(/(?:địa chỉ:?\s*|địa chỉ\s*)([^.]+)/i);
        const address = addressMatch ? addressMatch[1].trim() : "Chưa xác định";
        
        const currentOrders = JSON.parse(localStorage.getItem("erp-mini-local-demo-orders") || "[]");
        const orderId = `DH-${Date.now().toString().slice(-6)}`;
        const newOrder = {
          id: orderId,
          order_number: orderId,
          customer_name: senderName,
          customer_phone: senderPhone,
          shipping_address: address,
          status: config.autoCreateOrdersImmediately ? "confirmed" : "pending",
          source_type: selectedWebhookChannel,
          total_amount: messageText.includes("VC20") ? 225000 : 189000,
          channel_id: `channel-${selectedWebhookChannel}`,
          notes: `[Đơn tự động tạo từ CSKH Đa Kênh]`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify([newOrder, ...currentOrders]));
        setOrders([newOrder, ...currentOrders]);
        logs.push(`${timestamp()} [Order Engine] Đã tạo đơn hàng: ${orderId}`);
      }

      logs.push(`${timestamp()} [Webhook] Trả về HTTP 200 OK.`);
      setWebhookLogs(logs);

      toast({
        title: "Kích hoạt Webhook thành công! 🚀",
        description: "Hội thoại, CRM và đơn hàng đã được đồng bộ hóa thành công qua cổng Webhook giả lập.",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Lỗi Payload JSON"
      });
    }
  };

  // Add RAG Knowledge Document
  const handleAddRAGDoc = () => {
    if (!newRagTitle.trim() || !newRagContent.trim()) return;

    const newDoc: RAGDoc = {
      id: `rag-${Date.now()}`,
      title: newRagTitle.trim(),
      content: newRagContent.trim(),
      enabled: true,
      charCount: newRagContent.length,
      chunkCount: 1,
      createdAt: new Date().toLocaleDateString("vi-VN")
    };

    const updated = [newDoc, ...ragDocs];
    saveRAGDocs(updated);
    setNewRagTitle("");
    setNewRagContent("");
    toast({
      title: "Đã thêm tri thức RAG! 📚",
      description: "Bot Zalo đã được cập nhật chính sách/tài liệu mới."
    });
  };

  // Delete RAG Doc
  const handleDeleteRAGDoc = (id: string) => {
    const updated = ragDocs.filter(d => d.id !== id);
    saveRAGDocs(updated);
    toast({
      title: "Đã xóa tài liệu tri thức"
    });
  };

  // Toggle API Feature
  const handleToggleAPIFeature = (id: string, enabled: boolean) => {
    const updated = apiFeatures.map(f => f.id === id ? { ...f, enabled } : f);
    saveAPIFeatures(updated);
    toast({
      title: "Cập nhật quyền truy cập API",
      description: "Trạng thái SDK tương tác đã được cập nhật."
    });
  };

  // Query Testing RAG
  const handleQueryRAGTest = () => {
    if (!ragQueryTest.trim()) return;
    const query = ragQueryTest.toLowerCase();
    
    // Find closest document
    const matched = ragDocs
      .filter(d => d.enabled)
      .find(d => d.title.toLowerCase().includes(query) || d.content.toLowerCase().includes(query));

    if (matched) {
      setRagTestResult(`[Kết quả khớp - Top 1 (Độ tương đồng: 0.85)]:\nTiêu đề: ${matched.title}\nNội dung: ${matched.content}`);
    } else {
      setRagTestResult(`Không tìm thấy tài liệu phù hợp trong cơ sở tri thức (Độ tương đồng < 0.60).`);
    }
  };

  if (mode === "settings") {
    return (
      <div className="space-y-6">
        <Card className="border-border bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <Settings2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-sm font-semibold">Cấu hình CSKH Đa Kênh & AI Sales Auto-Closer</CardTitle>
                <CardDescription className="text-xs">Thiết lập tự động hóa chatbot, chốt đơn hàng và trích xuất trí nhớ AI</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 border rounded-lg bg-background/50">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Bật Chế độ AI Autopilot 100% (Auto Reply)</Label>
                <p className="text-[10px] text-muted-foreground">AI tự trả lời khách hàng. Tự động tắt và chuyển nhân viên hỗ trợ khi phát hiện khiếu nại phức tạp</p>
              </div>
              <Switch 
                checked={config.aiAutoReply}
                onCheckedChange={checked => saveConfig({ ...config, aiAutoReply: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 border rounded-lg bg-background/50">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tự động tạo đơn hàng (Auto-Closer)</Label>
                <p className="text-[10px] text-muted-foreground">Tự động chốt đơn khi phát hiện đủ SĐT và địa chỉ của khách hàng</p>
              </div>
              <Switch 
                checked={config.autoCreateOrders}
                onCheckedChange={checked => saveConfig({ ...config, autoCreateOrders: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 border rounded-lg bg-background/50">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Xác nhận đơn ngay lập tức (Bỏ qua nháp)</Label>
                <p className="text-[10px] text-muted-foreground">Đơn tự tạo sẽ trực tiếp chuyển sang trạng thái "Đã xác nhận" thay vì "Mới/Nháp"</p>
              </div>
              <Switch 
                checked={config.autoCreateOrdersImmediately}
                onCheckedChange={checked => saveConfig({ ...config, autoCreateOrdersImmediately: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 border rounded-lg bg-background/50">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">AI Tự động trích xuất bộ nhớ khách hàng (AI Memory Extraction)</Label>
                <p className="text-[10px] text-muted-foreground">Quét lịch sử trò chuyện và lưu trữ sở thích của khách hàng vào CRM</p>
              </div>
              <Switch 
                checked={config.aiAutoExtractMemory}
                onCheckedChange={checked => saveConfig({ ...config, aiAutoExtractMemory: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Part 1: Cơ sở tri thức AI (RAG Configuration panel) - Referencing Screenshot 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left panel: Cấu hình RAG nâng cao */}
          <Card className="lg:col-span-4 border-border bg-card text-card-foreground shadow-sm">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                <Sliders className="h-4.5 w-4.5 text-blue-600" />
                Cấu hình RAG nâng cao
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground font-semibold">Chế độ tìm kiếm</Label>
                <select 
                  value={ragSearchMode} 
                  onChange={e => setRagSearchMode(e.target.value)}
                  className="w-full rounded-md h-8 text-xs bg-background border border-border text-foreground p-1.5"
                >
                  <option value="Hybrid (Vector + TF-IDF)">Hybrid (Vector + TF-IDF)</option>
                  <option value="Vector Only (Semantic)">Vector Only (Semantic)</option>
                  <option value="Keyword Match Only">Keyword Match Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground font-semibold">Số lượng đoạn khớp (Top-K)</Label>
                <Input 
                  type="number"
                  value={ragTopK}
                  onChange={e => setRagTopK(Number(e.target.value))}
                  className="h-8 text-xs bg-background text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] text-muted-foreground font-semibold">Ngưỡng tương đồng (Threshold)</Label>
                  <span className="text-[10px] font-mono font-bold text-blue-600">{ragThreshold.toFixed(2)}</span>
                </div>
                <Input 
                  type="range"
                  min="0.10"
                  max="0.95"
                  step="0.05"
                  value={ragThreshold}
                  onChange={e => setRagThreshold(Number(e.target.value))}
                  className="h-8"
                />
              </div>

              <Button className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold">
                Lưu cấu hình RAG
              </Button>

              {/* Query Testing */}
              <div className="border-t pt-4 space-y-2.5">
                <Label className="text-[10px] font-bold text-foreground flex items-center gap-1">
                  Query Testing (Truy vấn thử)
                </Label>
                <p className="text-[9px] text-muted-foreground leading-relaxed">Nhập câu hỏi để test mức độ trích xuất tri thức của hệ thống RAG.</p>
                <Input 
                  placeholder="Ví dụ: Chính sách hoàn tiền..."
                  value={ragQueryTest}
                  onChange={e => setRagQueryTest(e.target.value)}
                  className="h-8 text-xs bg-background text-foreground"
                />
                <Button 
                  onClick={handleQueryRAGTest}
                  variant="outline" 
                  className="w-full h-8 text-xs font-semibold"
                >
                  Truy vấn thử
                </Button>
                {ragTestResult && (
                  <div className="p-2 border bg-muted/20 text-[9px] font-mono rounded leading-relaxed text-foreground whitespace-pre-wrap">
                    {ragTestResult}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right panel: Tài liệu tri thức cards */}
          <Card className="lg:col-span-8 border-border bg-card text-card-foreground shadow-sm flex flex-col justify-between">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                  <Database className="h-4.5 w-4.5 text-emerald-500" />
                  Cơ sở tri thức AI (RAG)
                </CardTitle>
                <CardDescription className="text-[9px]">Huấn luyện và quản lý tài liệu, chính sách để dạy Zalo Bot thông minh.</CardDescription>
              </div>
              <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600 border-emerald-200">
                {ragDocs.length} tài liệu
              </Badge>
            </CardHeader>
            <CardContent className="p-4 flex-1 space-y-4">
              {/* Add new RAG doc */}
              <div className="p-3 border rounded-lg bg-background/50 space-y-2">
                <span className="text-[10px] font-bold text-foreground block">Thêm tài liệu tri thức mới:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input 
                    placeholder="Tiêu đề tài liệu (VD: Chính sách giao hàng...)"
                    value={newRagTitle}
                    onChange={e => setNewRagTitle(e.target.value)}
                    className="h-8 text-xs bg-background text-foreground"
                  />
                  <Input 
                    placeholder="Nội dung chi tiết..."
                    value={newRagContent}
                    onChange={e => setNewRagContent(e.target.value)}
                    className="h-8 text-xs bg-background text-foreground"
                  />
                </div>
                <Button 
                  onClick={handleAddRAGDoc}
                  className="w-full h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                >
                  Thêm tài liệu RAG
                </Button>
              </div>

              {/* List docs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {ragDocs.map((doc) => (
                  <div key={doc.id} className="p-3 border rounded-lg bg-background flex flex-col justify-between hover:shadow-sm transition-all border-l-4 border-l-blue-500">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground truncate max-w-[120px]">{doc.title}</span>
                        <Switch 
                          checked={doc.enabled}
                          onCheckedChange={checked => {
                            setRagDocs(ragDocs.map(d => d.id === doc.id ? { ...d, enabled: checked } : d));
                          }}
                        />
                      </div>
                      <div className="flex gap-2 text-[9px] text-muted-foreground bg-muted/40 p-1.5 rounded">
                        <span>📝 Gõ tay</span>
                        <span>•</span>
                        <span>{doc.charCount} ký tự</span>
                        <span>•</span>
                        <span>{doc.chunkCount} đoạn</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
                        {doc.content}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2 mt-3 text-[9px] text-muted-foreground">
                      <span>Tạo: {doc.createdAt}</span>
                      <button 
                        onClick={() => handleDeleteRAGDoc(doc.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Part 2: Bảng Kiểm Soát Tính Năng Tương Tác AI (API Control panel) - Referencing Screenshot 2 */}
        <Card className="border-border bg-card text-card-foreground shadow-sm">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                  <SlidersHorizontal className="h-4.5 w-4.5 text-indigo-500" />
                  Bảng Kiểm Soát Tính Năng Tương Tác AI (API Control)
                </CardTitle>
                <CardDescription className="text-[10px] leading-relaxed">
                  Bật hoặc Tắt quyền truy cập của Trợ lý AI đối với các tính năng tương tác tự động trên Zalo. Khi tắt một tính năng, bot sẽ chỉ trả lời bằng tin nhắn văn bản thông thường thay vì thực thi tác vụ đó.
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-200 text-[10px] font-bold">
                Đang bật: {apiFeatures.filter(f => f.enabled).length}/{apiFeatures.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-border">
                <thead className="bg-muted/40 text-muted-foreground font-semibold text-[10px]">
                  <tr>
                    <th className="p-3">Tính năng</th>
                    <th className="p-3">API SDK</th>
                    <th className="p-3">Mô tả hành vi</th>
                    <th className="p-3 text-center">Trạng thái SDK</th>
                    <th className="p-3 text-center w-20">Cho phép</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[11px]">
                  {apiFeatures.map((feat) => (
                    <tr key={feat.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-3 font-semibold text-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        {feat.name}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-pink-600 dark:text-pink-400 font-bold">{feat.sdk}</td>
                      <td className="p-3 text-muted-foreground leading-relaxed max-w-xs">{feat.description}</td>
                      <td className="p-3 text-center">
                        {feat.rate ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="font-mono font-bold text-foreground">{feat.count}</span>
                            <Badge className="text-[8px] px-1 bg-emerald-500/10 text-emerald-600 border-none font-bold mt-0.5">{feat.rate}</Badge>
                          </div>
                        ) : (
                          <span className="font-mono text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <Switch 
                          checked={feat.enabled}
                          onCheckedChange={checked => handleToggleAPIFeature(feat.id, checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Simulator Section */}
        <Card className="border-border bg-card text-card-foreground shadow-sm">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-xs font-bold text-foreground">Webhook Simulator & Test Console</h3>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-semibold">Kênh gửi:</span>
                  <div className="flex gap-1.5">
                    <Button 
                      variant={selectedWebhookChannel === "zalo" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSelectedWebhookChannel("zalo")}
                      className="h-7 text-[10px]"
                    >
                      Zalo OA
                    </Button>
                    <Button 
                      variant={selectedWebhookChannel === "facebook" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSelectedWebhookChannel("facebook")}
                      className="h-7 text-[10px]"
                    >
                      Facebook Page
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold">JSON Payload</Label>
                  <Textarea 
                    value={webhookPayload}
                    onChange={e => setWebhookPayload(e.target.value)}
                    className="h-40 font-mono text-[10px] bg-slate-900 text-slate-100 p-2"
                  />
                </div>

                <Button 
                  onClick={handleTriggerWebhook}
                  className="w-full h-8 text-xs font-semibold gap-1.5"
                >
                  Gửi Webhook Test <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-muted-foreground">Nhật ký xử lý Webhook (Live Logs)</Label>
                <div className="h-56 bg-slate-950 text-slate-200 font-mono text-[9px] p-3 rounded-lg overflow-y-auto border border-slate-800 space-y-1.5">
                  {webhookLogs.length === 0 ? (
                    <span className="text-slate-500 italic block">Chưa có nhật ký Webhook được kích hoạt. Hãy nhấn 'Gửi Webhook Test' để kiểm tra kết quả xử lý tự động chốt đơn.</span>
                  ) : (
                    webhookLogs.map((log, i) => (
                      <div key={i} className={cn(
                        "whitespace-pre-wrap leading-relaxed",
                        log.includes("Lỗi") && "text-red-400",
                        log.includes("Thành công") && "text-emerald-400",
                        log.includes("AI Memory") && "text-indigo-400",
                        log.includes("Escalation") && "text-red-400 font-bold",
                        log.includes("AI Autopilot") && "text-indigo-400",
                        log.includes("Order Engine") && "text-amber-400"
                      )}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 h-[calc(100vh-160px)]">
      {/* Column 1: Conversations List */}
      <Card className="xl:col-span-3 border-border/45 bg-card/60 backdrop-blur-md flex flex-col h-full overflow-hidden">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-foreground">Hội thoại đa kênh</CardTitle>
            <Badge variant="outline" className="text-[9px] font-semibold bg-primary/5 text-primary">
              {conversations.filter(c => c.unread).length} mới
            </Badge>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Tìm khách hàng..."
              className="h-8 pl-8 text-xs bg-background/50"
            />
          </div>
        </CardHeader>
        <div className="flex-1 overflow-y-auto divide-y">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                setActiveConvId(conv.id);
                setConversations(conversations.map(c => c.id === conv.id ? { ...c, unread: false } : c));
              }}
              className={cn(
                "p-3.5 cursor-pointer transition-colors relative flex items-center justify-between",
                conv.id === activeConvId ? "bg-accent/40" : "hover:bg-accent/10"
              )}
            >
              <div className="space-y-1 w-11/12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="font-semibold text-xs text-foreground block truncate max-w-[80px]">{conv.customerName}</span>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 capitalize flex-shrink-0">
                      {conv.channel}
                    </Badge>
                  </div>
                  {conv.needsHuman ? (
                    <Badge className="text-[7px] px-1 bg-red-500 text-white font-bold animate-pulse flex-shrink-0">
                      Cần người
                    </Badge>
                  ) : conv.tags && conv.tags.length > 0 ? (
                    <Badge className="text-[7px] px-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200 truncate max-w-[60px] flex-shrink-0">
                      {conv.tags[0]}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-[10px] text-muted-foreground truncate leading-relaxed">{conv.lastMessage}</p>
              </div>
              {conv.unread && (
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0 ml-1" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Column 2: Chat Window */}
      <Card className="xl:col-span-5 border-border/45 bg-card/60 backdrop-blur-md flex flex-col h-full overflow-hidden">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
              {activeConv.customerName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-xs font-bold">{activeConv.customerName}</CardTitle>
                <Badge variant="outline" className="text-[8px] px-1 py-0 uppercase bg-slate-100/50">
                  {activeConv.classification || "Khách thường"}
                </Badge>
                {activeConv.currentEmotion && (
                  <Badge className="text-[8px] px-1 bg-amber-500/10 text-amber-600 border border-amber-300">
                    {activeConv.currentEmotion === "Lo lắng" ? "LO LẮNG" : activeConv.currentEmotion === "Vui vẻ" ? "VUI VẺ" : "BÌNH THƯỜNG"}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-[10px] flex items-center gap-1">
                <Phone className="h-3 w-3" /> {activeConv.customerPhone || "Chưa có SĐT"}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {activeConv.status === "open" ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResolveAndAnalyze}
                disabled={isAnalyzingSentiment}
                className="h-7 text-[10px] font-semibold text-emerald-600 border-emerald-200 bg-emerald-500/5 hover:bg-emerald-500/10"
              >
                {isAnalyzingSentiment ? (
                  <Sparkles className="h-3.5 w-3.5 mr-1 animate-spin text-emerald-500" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                )}
                Đóng & Phân tích AI
              </Button>
            ) : (
              <Badge variant="outline" className="text-[9px] bg-slate-100 text-slate-600 border-slate-300">
                Đã giải quyết
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGenerateAISuggestion}
              disabled={isGeneratingSuggestion}
              className="h-7 text-[10px] font-semibold text-indigo-500 border-indigo-200 bg-indigo-500/5 hover:bg-indigo-500/10"
            >
              <Bot className="h-3.5 w-3.5 mr-1" />
              AI Gợi ý
            </Button>
          </div>
        </CardHeader>

        {/* Human Escalation Warning Panel */}
        {activeConv.needsHuman && (
          <div className="bg-red-500/10 border-b border-red-500/20 p-3 flex items-center justify-between text-xs text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-red-500 animate-bounce flex-shrink-0" />
              <span className="font-semibold leading-relaxed">AI đã dừng Autopilot và yêu cầu chuyển giao người thật do khách khiếu nại.</span>
            </div>
            <Button 
              onClick={handleTakeover}
              size="sm"
              className="h-7 text-[10px] font-semibold bg-red-600 hover:bg-red-700 text-white flex-shrink-0 ml-2"
            >
              Tiếp quản cuộc chat
            </Button>
          </div>
        )}

        {/* Message timeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/20">
          {activeConv.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[80%] space-y-1.5",
                msg.sender === "customer" ? "mr-auto items-start" : "ml-auto items-end"
              )}
            >
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground px-1">
                <span className="font-semibold">{msg.senderName}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>
              <div
                className={cn(
                  "p-3 rounded-lg text-xs leading-relaxed border",
                  msg.sender === "customer" 
                    ? "bg-background border-border text-foreground" 
                    : msg.senderName === "Hệ thống AI"
                      ? "bg-red-500/15 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 font-semibold"
                      : msg.sender === "bot"
                        ? "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                        : "bg-primary border-primary/20 text-primary-foreground"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* AI Suggested Reply Display Box */}
        {aiSuggestedReply && (
          <div className="p-3 border-t bg-indigo-500/5 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/20 m-2.5 rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3 animate-pulse" /> Đề xuất trả lời từ AI Co-Pilot
              </span>
              <Button 
                variant="link" 
                onClick={() => {
                  setReplyText(aiSuggestedReply);
                  setAiSuggestedReply("");
                }}
                className="h-auto p-0 text-[10px] font-bold text-indigo-600 dark:text-indigo-400"
              >
                Áp dụng câu trả lời
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 italic">{aiSuggestedReply}</p>
          </div>
        )}

        {/* Message Input Box */}
        <div className="p-3 border-t bg-background/50 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground border-b pb-1.5 mb-0.5">
            <span className="font-semibold">Vai trò gửi tin nhắn (Thử nghiệm live):</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setChatRole("agent")}
                className={cn(
                  "px-2 py-0.5 rounded transition-colors text-[9px] font-bold",
                  chatRole === "agent" ? "bg-primary text-primary-foreground" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground"
                )}
              >
                Nhân viên (Shop)
              </button>
              <button
                onClick={() => setChatRole("customer")}
                className={cn(
                  "px-2 py-0.5 rounded transition-colors text-[9px] font-bold",
                  chatRole === "customer" ? "bg-indigo-500 text-white" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground"
                )}
              >
                Khách hàng
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Input 
              placeholder={chatRole === "agent" ? "Nhập tin nhắn phản hồi của nhân viên..." : "Nhập tin nhắn giả lập của khách hàng gửi..."}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendMessage()}
              className="h-8.5 text-xs bg-background"
            />
            <Button onClick={handleSendMessage} size="icon" className="h-8.5 w-8.5 flex-shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Column 3: CRM Profile Details (Match layout reference: Left Panel - White/Adaptive styling) */}
      <div className="xl:col-span-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 h-full overflow-y-auto">
        <Card className="border-border bg-card text-card-foreground shadow-sm flex flex-col justify-between">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm border border-primary/20">
                {editName.charAt(0) || "K"}
              </div>
              <div>
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  {editName}
                </CardTitle>
                <div className="flex gap-1.5 mt-1">
                  <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-secondary text-secondary-foreground border-none uppercase font-bold">
                    {editClassification}
                  </Badge>
                  <Badge className={cn(
                    "text-[8px] px-1.5 py-0 font-bold border-none",
                    editEmotion === "Vui vẻ" ? "bg-emerald-500/10 text-emerald-600" : editEmotion === "Lo lắng" ? "bg-amber-500/10 text-amber-600" : "bg-secondary text-secondary-foreground"
                  )}>
                    {editEmotion.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
            <span className="text-[9px] text-muted-foreground">Nhóm: Nhắc Việc</span>
          </CardHeader>
          
          <CardContent className="p-4 space-y-3">
            {activeConv.onboardingLog && (
              <div className="p-2 border border-blue-200 bg-blue-500/5 text-blue-600 dark:text-blue-400 text-[10px] rounded-lg leading-relaxed">
                {activeConv.onboardingLog}
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-semibold">Họ và tên</Label>
              <Input 
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="h-8 text-xs bg-background border-border text-foreground focus-visible:ring-primary" 
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-semibold">Số điện thoại</Label>
              <Input 
                value={editPhone}
                placeholder="Chưa cập nhật SĐT"
                onChange={e => setEditPhone(e.target.value)}
                className="h-8 text-xs bg-background border-border text-foreground focus-visible:ring-primary font-mono" 
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-semibold">Phân loại</Label>
              <select 
                value={editClassification}
                onChange={e => setEditClassification(e.target.value as any)}
                className="w-full rounded-md h-8 text-xs bg-background border border-border text-foreground p-1.5 focus:ring-1 focus:ring-primary"
              >
                <option value="Khách thường">Khách thường</option>
                <option value="Khách VIP">Khách VIP</option>
                <option value="Khách sỉ">Khách sỉ</option>
                <option value="Khách khó tính">Khách khó tính</option>
              </select>
            </div>

            <div className="space-y-1 flex items-center justify-between border-b pb-2">
              <Label className="text-[10px] text-muted-foreground font-semibold">Giọng điệu chat (AI Profile):</Label>
              <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5">
                {activeConv.chatStyle || "Chưa xác định"}
              </Badge>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-semibold">Danh xưng / Xưng hô</Label>
              <select 
                value={editPronoun}
                onChange={e => setEditPronoun(e.target.value as any)}
                className="w-full rounded-md h-8 text-xs bg-background border border-border text-foreground p-1.5 focus:ring-1 focus:ring-primary"
              >
                <option value="anh">Anh (Bot gọi Anh, xưng em)</option>
                <option value="chị">Chị (Bot gọi Chị, xưng em)</option>
                <option value="bạn">Bạn (Bot gọi Bạn, xưng mình)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-semibold">Cảm xúc hiện tại (AI tự nhận diện / Tự cấu hình)</Label>
              <select 
                value={editEmotion}
                onChange={e => setEditEmotion(e.target.value as any)}
                className="w-full rounded-md h-8 text-xs bg-background border border-border text-foreground p-1.5 focus:ring-1 focus:ring-primary"
              >
                <option value="Bình thường">Bình thường 😐</option>
                <option value="Vui vẻ">Vui vẻ 😊</option>
                <option value="Lo lắng">Lo lắng 😰</option>
                <option value="Giận dữ">Giận dữ 😡</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-semibold">Ghi chú nội bộ</Label>
              <Textarea 
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                className="h-16 text-xs bg-background border-border text-foreground focus-visible:ring-primary p-2"
                placeholder="Test notes"
              />
            </div>

            <Button 
              onClick={handleUpdateProfile}
              className="w-full h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white mt-2 shadow-lg shadow-blue-500/20"
            >
              Cập nhật hồ sơ
            </Button>
          </CardContent>
        </Card>

        {/* Right Panel: Bot Memories & Emotion Waves Chart */}
        <Card className="border-border bg-card text-card-foreground shadow-sm">
          <CardHeader className="p-4 border-b border-border">
            <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-emerald-500" />
              Ghi nhớ dài hạn của Bot
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 space-y-4">
            {/* Add memory fact input */}
            <div className="flex gap-2">
              <Input 
                placeholder="Thêm ghi nhớ..."
                value={newMemoryText}
                onChange={e => setNewMemoryText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddMemoryFact()}
                className="h-8 text-xs bg-background border-border text-foreground focus-visible:ring-primary"
              />
              <Button 
                onClick={handleAddMemoryFact}
                size="icon" 
                className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white flex-shrink-0"
              >
                <Plus className="h-4.5 w-4.5" />
              </Button>
            </div>

            {/* Memories List */}
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {memories.filter(m => m.customerPhone === activeConv.customerPhone).length === 0 ? (
                <div className="text-center py-4 text-muted-foreground italic text-[10px] border border-dashed border-border rounded bg-muted/20">
                  Chưa có ghi nhớ nào.
                </div>
              ) : (
                memories
                  .filter(m => m.customerPhone === activeConv.customerPhone)
                  .map((mem) => (
                    <div 
                      key={mem.id}
                      className="p-2 border border-border rounded bg-muted/10 text-[10px] flex items-center justify-between hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{mem.fact}</span>
                        <Badge variant="outline" className="text-[7px] px-1 bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold flex-shrink-0">
                          Quan trọng
                        </Badge>
                      </div>
                      <button 
                        onClick={() => handleDeleteMemoryFact(mem.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
              )}
            </div>

            {/* Neon Sentiment wave chart */}
            <div className="border-t border-border pt-3.5 space-y-2">
              <Label className="text-[10px] font-bold text-foreground flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 text-pink-500 animate-pulse" /> Biểu đồ Biến động Tâm lý khách hàng
              </Label>
              <div className="bg-slate-50/80 dark:bg-slate-950/80 border border-border rounded-lg p-2 relative">
                {/* SVG Sentiment Wave Chart */}
                <svg viewBox="0 0 300 120" className="w-full h-24 overflow-visible">
                  {/* Glow filter */}
                  <defs>
                    <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal dotted guide lines */}
                  <line x1="40" y1="15" x2="290" y2="15" stroke="#e2e8f0" className="dark:stroke-slate-800" strokeDasharray="2 3" />
                  <line x1="40" y1="45" x2="290" y2="45" stroke="#e2e8f0" className="dark:stroke-slate-800" strokeDasharray="2 3" />
                  <line x1="40" y1="75" x2="290" y2="75" stroke="#e2e8f0" className="dark:stroke-slate-800" strokeDasharray="2 3" />
                  <line x1="40" y1="105" x2="290" y2="105" stroke="#e2e8f0" className="dark:stroke-slate-800" strokeDasharray="2 3" />

                  {/* Y Axis Labels */}
                  <text x="5" y="18" fill="#10b981" className="text-[8px] font-bold">Vui</text>
                  <text x="5" y="48" fill="#a855f7" className="text-[8px] font-bold">Bình</text>
                  <text x="5" y="78" fill="#f59e0b" className="text-[8px] font-bold">Lo</text>
                  <text x="5" y="108" fill="#ef4444" className="text-[8px] font-bold">Giận</text>

                  {/* Neon connector Line path */}
                  <path 
                    d="M 60 75 L 110 45 L 160 15 L 210 75 L 260 45" 
                    fill="none" 
                    stroke="#ec4899" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_4px_#ec4899]"
                  />
                  
                  {/* Area fill */}
                  <path 
                    d="M 60 75 L 110 45 L 160 15 L 210 75 L 260 45 L 260 115 L 60 115 Z" 
                    fill="url(#chartGrad)" 
                  />

                  {/* Dot points */}
                  <circle cx="60" cy="75" r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="110" cy="45" r="4" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="160" cy="15" r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="210" cy="75" r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="260" cy="45" r="4" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />

                  {/* Dot labels */}
                  <text x="50" y="118" fill="#64748b" className="text-[7px]">15:38</text>
                  <text x="100" y="118" fill="#64748b" className="text-[7px]">15:39</text>
                  <text x="150" y="118" fill="#64748b" className="text-[7px]">15:41</text>
                  <text x="200" y="118" fill="#64748b" className="text-[7px]">15:42</text>
                  <text x="250" y="118" fill="#64748b" className="text-[7px]">02-07</text>
                </svg>
              </div>
            </div>

            {/* Lịch sử thay đổi cảm xúc list (Match layout reference: Right Panel Bottom) */}
            <div className="border-t border-border pt-3.5 space-y-2">
              <Label className="text-[10px] font-bold text-foreground">Lịch sử thay đổi</Label>
              <div className="space-y-1 text-[9px] bg-muted/10 p-2 rounded border border-border divide-y divide-border">
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground font-mono">15:41 02-07</span>
                  <div className="flex items-center gap-1">
                    <span className="text-foreground">Lo lắng 😰</span>
                    <span className="w-1.5 h-3 bg-amber-500 rounded-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground font-mono">15:39 02-07</span>
                  <div className="flex items-center gap-1">
                    <span className="text-foreground">Bình thường 😐</span>
                    <span className="w-1.5 h-3 bg-slate-400 rounded-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground font-mono">15:38 02-07</span>
                  <div className="flex items-center gap-1">
                    <span className="text-foreground">Vui vẻ 😊</span>
                    <span className="w-1.5 h-3 bg-emerald-500 rounded-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground font-mono">12:32 25-06</span>
                  <div className="flex items-center gap-1">
                    <span className="text-foreground">Bình thường 😐</span>
                    <span className="w-1.5 h-3 bg-slate-400 rounded-sm" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
