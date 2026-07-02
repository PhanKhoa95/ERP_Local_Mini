import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Settings,
  Send,
  User,
  Phone,
  MapPin,
  ClipboardList,
  Sparkles,
  RefreshCw,
  Link2,
  ExternalLink,
  Bot,
  Zap,
  CheckCircle,
  Clock,
  Radio,
  FileCheck,
  Brain
} from "lucide-react";

interface ChatwootMessage {
  id: string;
  sender: "customer" | "agent" | "bot";
  senderName: string;
  content: string;
  timestamp: string;
}

interface ChatwootConversation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  lastMessage: string;
  status: "open" | "snoozed" | "resolved";
  unread: boolean;
  messages: ChatwootMessage[];
}

export function ChatwootSupportTab({ mode = "chat" }: { mode?: "chat" | "settings" }) {
  const { toast } = useToast();
  const [activeConvId, setActiveConvId] = useState("conv-1");
  const [replyText, setReplyText] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Web Chat Config
  const [webChatColor, setWebChatColor] = useState("#4F46E5");
  const [webChatGreeting, setWebChatGreeting] = useState("Xin chào! Chúng tôi có thể giúp gì cho bạn?");

  // Zalo OA Config
  const [zaloOAName, setZaloOAName] = useState("Levera Shop Zalo OA");

  // Facebook Config
  const [fbPageName, setFbPageName] = useState("Levera Boutique Facebook");

  // Chatwoot Config State
  const [config, setConfig] = useState({
    baseUrl: "https://app.chatwoot.com",
    accountId: "88912",
    websiteToken: "jR4Z5kXtiL7782A",
    apiToken: "r4Z5kXtiL-SecretToken",
    autoCreatePartners: true,
    autoDraftOrders: true,
    autoCreateOrdersImmediately: false,
    isWidgetEnabled: true,
  });

  const defaultConvs: ChatwootConversation[] = [
    {
      id: "conv-1",
      customerName: "Lê Văn Cường",
      customerPhone: "0982738492",
      customerAddress: "12 Phố Huế, Quận Hai Bà Trưng, Hà Nội",
      lastMessage: "Mình chốt lấy 1 Túi Ngọc NT20 nhé. Giao đến địa chỉ trên.",
      status: "open",
      unread: true,
      messages: [
        { id: "m1", sender: "customer", senderName: "Lê Văn Cường", content: "Xin chào shop, mình muốn hỏi về Túi Ngọc NT20 còn hàng không?", timestamp: "14:40" },
        { id: "m2", sender: "agent", senderName: "CSKH Lan Phương", content: "Dạ shop chào anh Cường, mẫu Túi Ngọc NT20 hiện đang còn hàng sẵn tại kho gốc ạ. Giá bán lẻ là 189.000đ.", timestamp: "14:42" },
        { id: "m3", sender: "customer", senderName: "Lê Văn Cường", content: "SĐT của mình: 0982738492. Ship cho mình 1 chiếc về địa chỉ: 12 Phố Huế, Quận Hai Bà Trưng, Hà Nội nhé.", timestamp: "14:48" },
        { id: "m4", sender: "customer", senderName: "Lê Văn Cường", content: "Mình chốt lấy 1 Túi Ngọc NT20 nhé. Giao đến địa chỉ trên.", timestamp: "14:49" }
      ]
    },
    {
      id: "conv-2",
      customerName: "Trần Thị Lan",
      customerPhone: "0912345678",
      customerAddress: "Chưa cung cấp",
      lastMessage: "Có được freeship không shop ơi?",
      status: "open",
      unread: false,
      messages: [
        { id: "m5", sender: "customer", senderName: "Trần Thị Lan", content: "Sản phẩm Túi Trắng VC20 có giảm giá không ạ?", timestamp: "13:15" },
        { id: "m6", sender: "bot", senderName: "AI Sales Agent", content: "Chào chị Lan, sản phẩm Túi Trắng VC20 hiện có giá 225.000đ. Đơn hàng từ 500k sẽ được miễn phí giao hàng ạ.", timestamp: "13:16" },
        { id: "m7", sender: "customer", senderName: "Trần Thị Lan", content: "Có được freeship không shop ơi?", timestamp: "13:17" }
      ]
    }
  ];

  // Simulated conversations representing omnichannel streams
  const [conversations, setConversations] = useState<ChatwootConversation[]>(defaultConvs);
  const [isServerOnline, setIsServerOnline] = useState(false);

  // Sync with local Express Chat server (Port 4500) if online
  useEffect(() => {
    const fetchServerConvs = async () => {
      try {
        const res = await fetch("http://localhost:4500/api/chat/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
          setIsServerOnline(true);
        } else {
          setIsServerOnline(false);
        }
      } catch (err) {
        setIsServerOnline(false);
      }
    };

    // Initial check
    fetchServerConvs();

    // Check & poll every 4 seconds
    const interval = setInterval(fetchServerConvs, 4000);
    return () => clearInterval(interval);
  }, []);

  // Load and persist conversations from localStorage so simulation updates instantly!
  useEffect(() => {
    // Only use localStorage if server is offline
    if (isServerOnline) return;

    const rawConvs = localStorage.getItem("erp-mini-local-demo-omnichannel-conversations");
    if (rawConvs) {
      try {
        setConversations(JSON.parse(rawConvs));
      } catch (e) {
        setConversations(defaultConvs);
      }
    } else {
      localStorage.setItem("erp-mini-local-demo-omnichannel-conversations", JSON.stringify(defaultConvs));
    }
  }, [isServerOnline]);

  const saveConversations = (newConvs: ChatwootConversation[]) => {
    setConversations(newConvs);
    localStorage.setItem("erp-mini-local-demo-omnichannel-conversations", JSON.stringify(newConvs));
  };

  const simulateZaloMessage = () => {
    const mockZaloConv: ChatwootConversation = {
      id: `zalo-${Date.now()}`,
      customerName: "Nguyễn Hoàng Nam (Zalo)",
      customerPhone: "0963847593",
      customerAddress: "320 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội",
      lastMessage: "Lấy cho mình 1 chiếc Túi Trắng VC20 nhé.",
      status: "open",
      unread: true,
      messages: [
        { id: `zm1-${Date.now()}`, sender: "customer", senderName: "Nguyễn Hoàng Nam", content: "Alo shop ơi, sản phẩm Túi Trắng VC20 còn hàng không?", timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) },
        { id: `zm2-${Date.now()}`, sender: "bot", senderName: "AI Sales Agent", content: "Dạ còn hàng ạ, giá sản phẩm là 225.000đ.", timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) },
        { id: `zm3-${Date.now()}`, sender: "customer", senderName: "Nguyễn Hoàng Nam", content: "Ok chốt lấy cho mình 1 chiếc Túi Trắng VC20 nhé. Ship về địa chỉ: 320 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội. Số điện thoại liên hệ: 0963847593.", timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) }
      ]
    };

    const newConvs = [mockZaloConv, ...conversations];
    saveConversations(newConvs);
    setActiveConvId(mockZaloConv.id);

    // If auto create partner & draft order is on, trigger it automatically!
    if (config.autoCreatePartners) {
      const rawPartners = localStorage.getItem("erp-mini-local-demo-partners");
      const partners = rawPartners ? JSON.parse(rawPartners) : [];
      if (!partners.some((p: any) => p.phone === mockZaloConv.customerPhone)) {
        const newPartner = {
          id: `partner-zalo-${Date.now()}`,
          code: `KH-${Math.floor(1000 + Math.random() * 9000)}`,
          name: mockZaloConv.customerName,
          phone: mockZaloConv.customerPhone,
          address: mockZaloConv.customerAddress,
          type: "customer",
          total_spent: 0,
          loyalty_points: 0,
          debt_amount: 0,
          created_at: new Date().toISOString()
        };
        localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify([newPartner, ...partners]));
      }
    }

    if (config.autoDraftOrders) {
      const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
      const orders = rawOrders ? JSON.parse(rawOrders) : [];
      const orderId = `ĐH-ZALO-${Math.floor(100000 + Math.random() * 900000)}`;
      const newOrder = {
        id: `order-zalo-${Date.now()}`,
        order_number: orderId,
        customer_name: mockZaloConv.customerName,
        customer_phone: mockZaloConv.customerPhone,
        shipping_address: mockZaloConv.customerAddress,
        status: config.autoCreateOrdersImmediately ? "confirmed" : "pending",
        payment_status: "pending",
        payment_method: "cod",
        total_amount: 225000,
        channel_id: "channel-zalo",
        notes: config.autoCreateOrdersImmediately ? "[Đơn tự động tạo chính thức từ hội thoại Zalo OA]" : "[Đơn tự động trích xuất từ hội thoại Zalo OA]",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify([newOrder, ...orders]));
    }

    toast({
      title: "Nhận tin nhắn Zalo OA giả lập! 💬",
      description: "Đã nhận tin nhắn từ khách hàng Nguyễn Hoàng Nam. Hồ sơ CRM & đơn hàng nháp đã được khởi tạo thành công.",
      duration: 4000
    });
  };

  const simulateFacebookMessage = () => {
    const mockFbConv: ChatwootConversation = {
      id: `fb-${Date.now()}`,
      customerName: "Phạm Minh Quân (Facebook)",
      customerPhone: "0849283749",
      customerAddress: "72 Nguyễn Trãi, Quận Thanh Xuân, Hà Nội",
      lastMessage: "Mình mua 1 chiếc Túi Xách ZL18 nhé.",
      status: "open",
      unread: true,
      messages: [
        { id: `fm1-${Date.now()}`, sender: "customer", senderName: "Phạm Minh Quân", content: "Shop ơi ship cho mình 1 chiếc Túi Xách ZL18 về địa chỉ 72 Nguyễn Trãi, Thanh Xuân với. SĐT mình 0849283749.", timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) },
        { id: `fm2-${Date.now()}`, sender: "customer", senderName: "Phạm Minh Quân", content: "Mình mua 1 chiếc Túi Xách ZL18 nhé.", timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) }
      ]
    };

    const newConvs = [mockFbConv, ...conversations];
    saveConversations(newConvs);
    setActiveConvId(mockFbConv.id);

    if (config.autoCreatePartners) {
      const rawPartners = localStorage.getItem("erp-mini-local-demo-partners");
      const partners = rawPartners ? JSON.parse(rawPartners) : [];
      if (!partners.some((p: any) => p.phone === mockFbConv.customerPhone)) {
        const newPartner = {
          id: `partner-fb-${Date.now()}`,
          code: `KH-${Math.floor(1000 + Math.random() * 9000)}`,
          name: mockFbConv.customerName,
          phone: mockFbConv.customerPhone,
          address: mockFbConv.customerAddress,
          type: "customer",
          total_spent: 0,
          loyalty_points: 0,
          debt_amount: 0,
          created_at: new Date().toISOString()
        };
        localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify([newPartner, ...partners]));
      }
    }

    if (config.autoDraftOrders) {
      const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
      const orders = rawOrders ? JSON.parse(rawOrders) : [];
      const orderId = `ĐH-FB-${Math.floor(100000 + Math.random() * 900000)}`;
      const newOrder = {
        id: `order-fb-${Date.now()}`,
        order_number: orderId,
        customer_name: mockFbConv.customerName,
        customer_phone: mockFbConv.customerPhone,
        shipping_address: mockFbConv.customerAddress,
        status: config.autoCreateOrdersImmediately ? "confirmed" : "pending",
        payment_status: "pending",
        payment_method: "cod",
        total_amount: 189000,
        channel_id: "channel-facebook",
        notes: config.autoCreateOrdersImmediately ? "[Đơn tự động tạo chính thức từ hội thoại Facebook Messenger]" : "[Đơn tự động trích xuất từ hội thoại Facebook Messenger]",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify([newOrder, ...orders]));
    }

    toast({
      title: "Nhận tin nhắn Messenger giả lập! 💬",
      description: "Đã nhận tin nhắn từ Phạm Minh Quân. Đã tự động tạo hồ sơ khách hàng mới và đơn hàng nháp.",
      duration: 4000
    });
  };

  // AI Long-Term Memory States & Handlers
  interface CustomerMemory {
    id: string;
    customerPhone: string;
    fact: string;
    importance: 1 | 2 | 3;
    createdAt: string;
  }

  const [memories, setMemories] = useState<CustomerMemory[]>(() => {
    const raw = localStorage.getItem("erp-mini-local-demo-customer-memories");
    return raw ? JSON.parse(raw) : [
      { id: "mem-1", customerPhone: "0982738492", fact: "Ưu tiên vận chuyển qua Viettel Post", importance: 2, createdAt: new Date().toISOString() },
      { id: "mem-2", customerPhone: "0982738492", fact: "Thích túi màu đen size lớn", importance: 3, createdAt: new Date().toISOString() }
    ];
  });
  const [newMemoryFact, setNewMemoryFact] = useState("");
  const [isExtractingMemory, setIsExtractingMemory] = useState(false);

  const saveMemories = (updated: CustomerMemory[]) => {
    setMemories(updated);
    localStorage.setItem("erp-mini-local-demo-customer-memories", JSON.stringify(updated));
  };

  const handleAddMemory = (phone: string) => {
    if (!newMemoryFact.trim() || !phone) return;
    const newMem: CustomerMemory = {
      id: `mem-${Date.now()}`,
      customerPhone: phone,
      fact: newMemoryFact.trim(),
      importance: 3,
      createdAt: new Date().toISOString()
    };
    saveMemories([newMem, ...memories]);
    setNewMemoryFact("");
    toast({ title: "Đã lưu trí nhớ AI cho khách hàng!" });
  };

  const handleDeleteMemory = (id: string) => {
    saveMemories(memories.filter(m => m.id !== id));
    toast({ title: "Đã xóa sự kiện ghi nhớ!" });
  };

  const handleExtractAIMemory = (phone: string, name: string) => {
    if (!phone) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Khách hàng phải có số điện thoại để lưu trữ bộ nhớ AI định danh."
      });
      return;
    }
    setIsExtractingMemory(true);
    setTimeout(() => {
      let facts: string[] = [];
      if (name.includes("Nam") || phone === "0963847593") {
        facts = [
          "Thích mẫu túi VC20 màu sáng",
          "Thường ship về Cầu Giấy Hà Nội",
          "Hỏi về chính sách đồng giá ship"
        ];
      } else if (name.includes("Quân") || phone === "0849283749") {
        facts = [
          "Mua Túi Xách ZL18 làm quà tặng bạn gái",
          "Thanh toán bằng COD nhận hàng kiểm tra",
          "Yêu cầu giao nhanh nội thành Hà Nội"
        ];
      } else {
        facts = [
          "Khách hàng mới quan tâm đến chính sách tích điểm",
          "Hỏi về thời gian bảo hành khóa kéo"
        ];
      }

      // Filter duplicates
      const currentCustomerMems = memories.filter(m => m.customerPhone === phone);
      const newMems: CustomerMemory[] = [];
      facts.forEach((fact, i) => {
        if (!currentCustomerMems.some(m => m.fact === fact)) {
          newMems.push({
            id: `mem-extracted-${Date.now()}-${i}`,
            customerPhone: phone,
            fact,
            importance: 3,
            createdAt: new Date().toISOString()
          });
        }
      });

      if (newMems.length > 0) {
        saveMemories([...newMems, ...memories]);
        toast({
          title: "Trích xuất thành công! 🤖",
          description: `AI đã phân tích đoạn chat và ghi nhớ thêm ${newMems.length} sự thật về khách hàng.`
        });
      } else {
        toast({
          title: "Không có thông tin mới",
          description: "AI chưa phát hiện thêm sự thật/sở thích mới nào từ cuộc hội thoại."
        });
      }
      setIsExtractingMemory(false);
    }, 1500);
  };

  // Webhook Test Console States & Handlers
  const [selectedWebhookChannel, setSelectedWebhookChannel] = useState<"zalo" | "facebook">("zalo");
  const [webhookPayload, setWebhookPayload] = useState("");
  const [webhookLogs, setWebhookLogs] = useState<string[]>([]);

  // Update default payload template based on channel selection
  useEffect(() => {
    if (selectedWebhookChannel === "zalo") {
      setWebhookPayload(JSON.stringify({
        event: "message_created",
        sender: {
          name: "Nguyễn Hoàng Nam",
          phone: "0963847593"
        },
        message: {
          text: "Alo shop ơi, ship cho mình 1 chiếc Túi Trắng VC20 về địa chỉ: 320 Cầu Giấy nhé. SĐT liên hệ là 0963847593."
        }
      }, null, 2));
    } else {
      setWebhookPayload(JSON.stringify({
        event: "message_created",
        sender: {
          name: "Phạm Minh Quân",
          phone: "0849283749"
        },
        message: {
          text: "Shop ơi ship cho mình 1 chiếc Túi Xách ZL18 về địa chỉ 72 Nguyễn Trãi, Thanh Xuân với. SĐT mình 0849283749."
        }
      }, null, 2));
    }
  }, [selectedWebhookChannel]);

  const handleTriggerWebhook = () => {
    try {
      const parsed = JSON.parse(webhookPayload);
      const senderName = parsed.sender?.name || "Khách hàng ẩn danh";
      const messageText = parsed.message?.text || "";
      const senderPhone = parsed.sender?.phone || "";

      // Start Webhook logging simulation
      const logs: string[] = [];
      const timestamp = () => `[${new Date().toLocaleTimeString("vi-VN")}]`;
      
      logs.push(`${timestamp()} [Webhook] Nhận yêu cầu POST từ ${selectedWebhookChannel === "zalo" ? "Zalo OA" : "Facebook Messenger"} API...`);
      logs.push(`${timestamp()} [Webhook] Đang xác thực Verify Token... Hợp lệ!`);
      logs.push(`${timestamp()} [AI Engine] Đang phân tích hội thoại và nội dung chat...`);

      // Simple regex parser inside simulator to find phone and address
      const phoneRegex = /(0[3|5|7|8|9][0-9]{8})/g;
      const phoneMatch = messageText.match(phoneRegex);
      const extractedPhone = phoneMatch ? phoneMatch[0] : senderPhone || "";

      let extractedAddress = "Chưa cung cấp";
      if (messageText.includes("địa chỉ:")) {
        extractedAddress = messageText.split("địa chỉ:")[1].split(".")[0].trim();
      } else if (messageText.includes("về")) {
        extractedAddress = messageText.split("về")[1].split(".")[0].trim();
      }

      logs.push(`${timestamp()} [AI Engine] Đã bóc tách dữ liệu: SĐT: "${extractedPhone}", Địa chỉ: "${extractedAddress}"`);

      // Add to conversations
      const mockConv: ChatwootConversation = {
        id: `${selectedWebhookChannel}-${Date.now()}`,
        customerName: `${senderName} (${selectedWebhookChannel === "zalo" ? "Zalo" : "Facebook"})`,
        customerPhone: extractedPhone,
        customerAddress: extractedAddress,
        lastMessage: messageText.length > 30 ? messageText.slice(0, 30) + "..." : messageText,
        status: "open",
        unread: true,
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: "customer",
            senderName: senderName,
            content: messageText,
            timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
          }
        ]
      };

      const newConvs = [mockConv, ...conversations];
      saveConversations(newConvs);
      setActiveConvId(mockConv.id);

      // CRM Sync
      if (config.autoCreatePartners && extractedPhone) {
        logs.push(`${timestamp()} [CRM Engine] Đang tìm kiếm khách hàng SĐT "${extractedPhone}" trong danh bạ...`);
        const rawPartners = localStorage.getItem("erp-mini-local-demo-partners");
        const partners = rawPartners ? JSON.parse(rawPartners) : [];
        if (!partners.some((p: any) => p.phone === extractedPhone)) {
          logs.push(`${timestamp()} [CRM Engine] SĐT chưa tồn tại. Tự động tạo hồ sơ khách hàng mới: "${senderName}"`);
          const newPartner = {
            id: `partner-auto-${Date.now()}`,
            code: `KH-${Math.floor(1000 + Math.random() * 9000)}`,
            name: senderName,
            phone: extractedPhone,
            address: extractedAddress,
            type: "customer",
            total_spent: 0,
            loyalty_points: 0,
            debt_amount: 0,
            created_at: new Date().toISOString()
          };
          localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify([newPartner, ...partners]));
        } else {
          logs.push(`${timestamp()} [CRM Engine] Khách hàng đã tồn tại. Liên kết hội thoại thành công.`);
        }
      }

      // Order Sync
      if (config.autoDraftOrders && extractedPhone) {
        logs.push(`${timestamp()} [Order Engine] Đang lập hóa đơn ${config.autoCreateOrdersImmediately ? "chính thức" : "nháp"} từ thông tin bóc tách...`);
        const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
        const orders = rawOrders ? JSON.parse(rawOrders) : [];
        const orderId = `ĐH-${selectedWebhookChannel.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
        const newOrder = {
          id: `order-auto-${Date.now()}`,
          order_number: orderId,
          customer_name: senderName,
          customer_phone: extractedPhone,
          shipping_address: extractedAddress,
          status: config.autoCreateOrdersImmediately ? "confirmed" : "pending",
          payment_status: "pending",
          payment_method: "cod",
          total_amount: messageText.includes("VC20") ? 225000 : 189000,
          channel_id: `channel-${selectedWebhookChannel}`,
          notes: `[Đơn tự động tạo ${config.autoCreateOrdersImmediately ? "chính thức" : "nháp"} từ Webhook ${selectedWebhookChannel === "zalo" ? "Zalo OA" : "Facebook Messenger"}]`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify([newOrder, ...orders]));
        logs.push(`${timestamp()} [Order Engine] Đã tạo thành công đơn hàng ${config.autoCreateOrdersImmediately ? "chính thức (Đã xác nhận)" : "nháp"}: ${orderId}`);
      }

      // If server is online, trigger backend webhook too
      if (isServerOnline) {
        try {
          await fetch(`http://localhost:4500/api/chat/webhooks/${selectedWebhookChannel}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: webhookPayload
          });
        } catch (err) {
          console.error("Failed to post webhook to local Zalo Bot server:", err);
        }
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
        title: "Lỗi Payload JSON",
        description: "Vui lòng nhập định dạng JSON hợp lệ để thực thi Webhook."
      });
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  const handleSendMessage = async () => {
    if (!replyText.trim()) return;
    
    const newMsg: ChatwootMessage = {
      id: `m-new-${Date.now()}`,
      sender: "agent",
      senderName: "Admin POS",
      content: replyText,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    const updated = conversations.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          lastMessage: replyText,
          unread: false,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    });

    saveConversations(updated);
    setReplyText("");

    if (isServerOnline) {
      try {
        await fetch(`http://localhost:4500/api/chat/conversations/${activeConvId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: "agent",
            senderName: "Admin POS",
            content: replyText
          })
        });
      } catch (err) {
        console.error("Failed to send message to Zalo Bot server:", err);
      }
    }

    // Simulate dummy webhook trigger response if auto draft is active
    toast({
      title: "Đã gửi phản hồi qua Chatwoot",
      description: "Tin nhắn được đồng bộ trực tiếp sang kênh chat khách hàng."
    });
  };

  // Extract customer info & draft order automatically (Chương trình Tự động nhận biết của Chatwoot)
  const handleExtractOrder = () => {
    if (!activeConv.customerPhone || activeConv.customerPhone === "Chưa cung cấp") {
      toast({
        variant: "destructive",
        title: "Không thể trích xuất",
        description: "Khách hàng chưa cung cấp số điện thoại liên hệ trong đoạn hội thoại."
      });
      return;
    }

    // Read existing draft orders
    const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
    const orders = rawOrders ? JSON.parse(rawOrders) : [];
    
    const orderId = `ĐH-WOOT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
      id: `order-woot-${Date.now()}`,
      order_number: orderId,
      customer_name: activeConv.customerName,
      customer_phone: activeConv.customerPhone,
      shipping_address: activeConv.customerAddress,
      status: config.autoCreateOrdersImmediately ? "confirmed" : "pending",
      payment_status: "pending",
      payment_method: "cod",
      total_amount: 189000,
      channel_id: "channel-facebook", // Facebook / Omnichannel
      notes: config.autoCreateOrdersImmediately ? "[Đơn tự động tạo chính thức từ hội thoại Chatwoot]" : "[Đơn tự động trích xuất từ hội thoại Chatwoot]",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify([newOrder, ...orders]));
    
    // Also save customer to partners
    const rawPartners = localStorage.getItem("erp-mini-local-demo-partners");
    const partners = rawPartners ? JSON.parse(rawPartners) : [];
    if (!partners.some((p: any) => p.phone === activeConv.customerPhone)) {
      const newPartner = {
        id: `partner-woot-${Date.now()}`,
        code: `KH-${Math.floor(1000 + Math.random() * 9000)}`,
        name: activeConv.customerName,
        phone: activeConv.customerPhone,
        address: activeConv.customerAddress,
        type: "customer",
        total_spent: 0,
        loyalty_points: 0,
        debt_amount: 0,
        created_at: new Date().toISOString()
      };
      localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify([newPartner, ...partners]));
    }

    toast({
      title: "Trích xuất thành công! 🚀",
      description: `Đã tự động tạo hồ sơ khách hàng và nháp đơn hàng #${orderId} trên hệ thống.`,
      duration: 6000
    });
  };

  const handleCopyScript = () => {
    const scriptSnippet = `<!-- Chatwoot Widget Embed Code -->
<script>
  (function(d,t) {
    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
    g.src="${config.baseUrl}/packs/js/sdk.js";
    g.defer = true;
    g.async = true;
    g.onload=function(){
      window.chatwootSDK.run({
        websiteToken: '${config.websiteToken}',
        baseUrl: '${config.baseUrl}'
      })
    }
    s.parentNode.insertBefore(g,s);
  })(document,"script");
</script>`;
    navigator.clipboard.writeText(scriptSnippet);
    setIsCopied(true);
    toast({ title: "Đã sao chép mã nhúng Widget Chatwoot!" });
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (mode === "settings") {
    return (
      <div className="space-y-6 text-xs text-foreground">
        {/* Connection status banner */}
        <div className="p-4 border rounded-lg bg-indigo-50 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-900/30 flex justify-between items-center">
          <div className="space-y-0.5">
            <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">Cấu hình Động cơ CSKH Đa kênh Tự chủ (Native Omnichannel Engine)</h4>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-400/90 leading-relaxed">
              Bạn đang sử dụng động cơ kết nối cục bộ do ERP phát triển. Trực tiếp nhận Webhook từ Zalo, Facebook, Website và xử lý bằng nhân máy AI nội bộ không phụ thuộc bên thứ 3.
            </p>
          </div>
          <Badge className="bg-indigo-600 text-white font-bold uppercase shrink-0">Bản tự chủ (Native)</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Zalo OA Configuration Card */}
          <Card className="border border-border shadow-none">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="h-4 w-4 text-blue-500 animate-pulse" />
                  Tích hợp Zalo Official Account
                </CardTitle>
                <CardDescription className="text-[10px] mt-0.5">Nhận tin nhắn thời gian thực từ trang Zalo OA</CardDescription>
              </div>
              <Button size="sm" onClick={simulateZaloMessage} className="h-7 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Giả lập khách chat Zalo
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1">
                <Label className="font-semibold text-muted-foreground">Tên Zalo OA</Label>
                <Input
                  value={zaloOAName}
                  onChange={e => setZaloOAName(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-semibold text-muted-foreground">Zalo OA ID</Label>
                  <Input
                    placeholder="392817293847283"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-semibold text-muted-foreground">Zalo App ID</Label>
                  <Input
                    placeholder="1827384928"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-semibold text-muted-foreground">Địa chỉ Webhook (Cấu hình trên Zalo Developer)</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value="http://localhost:8017/api/webhooks/zalo"
                    className="h-8 text-xs font-mono bg-muted flex-1"
                  />
                  <Button variant="outline" size="sm" className="h-8 text-[10px] shrink-0 font-semibold" onClick={() => {
                    navigator.clipboard.writeText("http://localhost:8017/api/webhooks/zalo");
                    toast({ title: "Đã copy link Webhook Zalo!" });
                  }}>
                    Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facebook Page Configuration Card */}
          <Card className="border border-border shadow-none">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 className="h-4 w-4 text-indigo-500" />
                  Tích hợp Facebook Messenger
                </CardTitle>
                <CardDescription className="text-[10px] mt-0.5">Nhận tin nhắn thời gian thực từ Fanpage Facebook</CardDescription>
              </div>
              <Button size="sm" onClick={simulateFacebookMessage} className="h-7 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Giả lập khách chat Facebook
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1">
                <Label className="font-semibold text-muted-foreground">Tên Trang Fanpage</Label>
                <Input
                  value={fbPageName}
                  onChange={e => setFbPageName(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-semibold text-muted-foreground">Facebook Page ID</Label>
                  <Input
                    placeholder="10928374928"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-semibold text-muted-foreground">Verify Token</Label>
                  <Input
                    placeholder="LeveraPOSVerifyTokenSecret"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-semibold text-muted-foreground">Địa chỉ Webhook (Cấu hình trên Facebook App)</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value="http://localhost:8017/api/webhooks/facebook"
                    className="h-8 text-xs font-mono bg-muted flex-1"
                  />
                  <Button variant="outline" size="sm" className="h-8 text-[10px] shrink-0 font-semibold" onClick={() => {
                    navigator.clipboard.writeText("http://localhost:8017/api/webhooks/facebook");
                    toast({ title: "Đã copy link Webhook Facebook!" });
                  }}>
                    Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Website Live Chat Widget Card */}
          <Card className="border border-border shadow-none">
            <CardHeader className="p-4 border-b flex flex-row justify-between items-center space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-500" />
                Bong bóng chat nhúng Website (Web widget)
              </CardTitle>
              <Switch
                checked={config.isWidgetEnabled}
                onCheckedChange={checked => setConfig({ ...config, isWidgetEnabled: checked })}
              />
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-semibold text-muted-foreground">Màu sắc chủ đạo</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={webChatColor}
                      onChange={e => setWebChatColor(e.target.value)}
                      className="w-10 h-8 p-1 shrink-0 cursor-pointer"
                    />
                    <Input
                      value={webChatColor}
                      onChange={e => setWebChatColor(e.target.value)}
                      className="h-8 text-xs font-mono flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="font-semibold text-muted-foreground">Lời chào mặc định</Label>
                  <Input
                    value={webChatGreeting}
                    onChange={e => setWebChatGreeting(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <Label className="font-semibold text-muted-foreground">Mã nhúng Website HTML SDK</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => {
                    navigator.clipboard.writeText(`<!-- Embed local chat widget -->\n<script src="http://localhost:8017/sdk/chat-widget.js" data-color="${webChatColor}" data-greeting="${webChatGreeting}"></script>`);
                    toast({ title: "Đã copy mã nhúng Website Widget!" });
                  }}>
                    Sao chép mã nhúng
                  </Button>
                </div>
                <pre className="p-2 border rounded bg-secondary/20 font-mono text-[9px] overflow-x-auto whitespace-pre leading-relaxed text-slate-600 dark:text-slate-400">
{`<!-- Embed local chat widget -->
<script 
  src="http://localhost:8017/sdk/chat-widget.js" 
  data-color="${webChatColor}" 
  data-greeting="${webChatGreeting}">
</script>`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* AI Automations Card */}
          <Card className="border border-border shadow-none">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="h-4 w-4 text-indigo-500" />
                Cơ chế tự động hóa AI (Local AI Engine)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b">
                  <span className="text-muted-foreground font-medium">Trạng thái kết nối:</span>
                  <Badge className="bg-green-500 text-white text-[9px] uppercase font-bold">Đang hoạt động</Badge>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b">
                  <span className="text-muted-foreground font-medium">Động cơ trí tuệ nhân tạo:</span>
                  <span className="font-semibold text-primary">AI Copilot POS (Internal)</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b">
                  <span className="text-muted-foreground font-medium">Khóa API sẵn có:</span>
                  <Badge variant="outline" className="text-[9px] text-green-600 bg-green-50">Sẵn sàng (Internal Key)</Badge>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">Tự tạo khách hàng mới</Label>
                    <p className="text-[9px] text-muted-foreground">Tự đồng bộ danh bạ từ hội thoại sang CRM</p>
                  </div>
                  <Switch
                    checked={config.autoCreatePartners}
                    onCheckedChange={checked => setConfig({ ...config, autoCreatePartners: checked })}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">Tự động phát hiện thông tin đơn</Label>
                    <p className="text-[9px] text-muted-foreground">AI phân tích SĐT/Địa chỉ để nháp đơn hàng</p>
                  </div>
                  <Switch
                    checked={config.autoDraftOrders}
                    onCheckedChange={checked => setConfig({ ...config, autoDraftOrders: checked })}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">Tự động tạo đơn hàng chính thức</Label>
                    <p className="text-[9px] text-muted-foreground">Tự duyệt và chuyển đơn sang Đã xác nhận thay vì đơn Nháp</p>
                  </div>
                  <Switch
                    checked={config.autoCreateOrdersImmediately}
                    onCheckedChange={checked => setConfig({ ...config, autoCreateOrdersImmediately: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Webhook Test Console Card */}
        <Card className="border border-border shadow-none">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-emerald-500" />
              Cổng thử nghiệm & giả lập Webhook Đa Kênh (Webhook Testing Console)
            </CardTitle>
            <CardDescription className="text-[10px] mt-0.5">
              Mô phỏng thực tế quá trình Zalo/Facebook truyền tin nhắn dạng Webhook JSON về ERP Local
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Left Column: JSON Editor */}
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase">Cấu hình Kênh & Webhook Payload (JSON)</span>
                  <div className="flex gap-1">
                    <Button
                      variant={selectedWebhookChannel === "zalo" ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-[9px] px-2 font-semibold"
                      onClick={() => setSelectedWebhookChannel("zalo")}
                    >
                      Kênh Zalo OA Webhook
                    </Button>
                    <Button
                      variant={selectedWebhookChannel === "facebook" ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-[9px] px-2 font-semibold"
                      onClick={() => setSelectedWebhookChannel("facebook")}
                    >
                      Kênh Facebook Webhook
                    </Button>
                  </div>
                </div>

                <textarea
                  value={webhookPayload}
                  onChange={e => setWebhookPayload(e.target.value)}
                  className="w-full h-36 p-3 border rounded bg-secondary/10 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />

                <Button
                  onClick={handleTriggerWebhook}
                  className="w-full h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" /> Gửi Webhook (Trigger HTTP POST /webhook)
                </Button>
              </div>

              {/* Right Column: Execution Logs Terminal */}
              <div className="lg:w-[320px] shrink-0 space-y-2 flex flex-col">
                <span className="font-semibold text-muted-foreground text-[10px] uppercase block">Kết quả thực thi (Console Log)</span>
                <div className="flex-1 min-h-[180px] p-3 border rounded bg-slate-950 dark:bg-slate-900 text-[10px] font-mono text-emerald-400 overflow-y-auto leading-relaxed select-none">
                  {webhookLogs.length === 0 ? (
                    <span className="text-muted-foreground/50 italic block mt-12 text-center">[ Nhấn nút Gửi Webhook để chạy trình giả lập ]</span>
                  ) : (
                    webhookLogs.map((log, index) => (
                      <div key={index} className="whitespace-pre-wrap mb-1">{log}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Omnichannel Integration Architecture & Guide */}
        <Card className="border border-border shadow-none">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-indigo-500" />
              Sơ đồ & Hướng dẫn tích hợp đa kênh (Omnichannel Hub)
            </CardTitle>
            <CardDescription className="text-[10px] mt-0.5">Mô hình định tuyến hội thoại từ các kênh chat về cơ sở dữ liệu POS</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Visual routing schema */}
            <div className="p-4 border rounded bg-secondary/10 font-mono text-[10px] overflow-x-auto whitespace-pre leading-relaxed text-indigo-800 dark:text-indigo-400">
{`   [ Kênh Chat Khách Hàng ]
   ├─► Facebook Page / Messenger  ──┐
   ├─► Zalo Official Account (OA) ──┼─► [ ERP OMNICHANNEL WEBHOOKS ] (Nhận tin nhắn cục bộ)
   ├─► Website Live Chat Widget   ──┤            │
   └─► Email / SMS Support        ──┘            ▼
                                      [ ERP LOCAL DATABASE - conversations & messages ]
                                                 │
                                                 ▼ (Động cơ AI Agent cục bộ phân tích)
                                      [ AI Parser: Trích xuất SĐT & Địa chỉ ]
                                                 │
                                                 ├─► Tự động tạo hồ sơ [ Khách hàng & Đối tác ]
                                                 └─► Tự động nháp [ Đơn hàng ] chờ xác nhận`}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 text-[11px] leading-relaxed">
              <div className="space-y-2">
                <h4 className="font-bold text-foreground flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" /> 1. Cơ chế hoạt động của Webhook tự chủ
                </h4>
                <p className="text-muted-foreground">
                  Khi khách hàng gửi tin nhắn trên bất kỳ kênh nào, máy chủ API của Zalo/Facebook sẽ bắn một yêu cầu HTTP POST (Webhook) trực tiếp đến địa chỉ IP ngoại vi của ERP Local của bạn.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" /> 2. AI phân tích NLP không cần khóa ngoài
                </h4>
                <p className="text-muted-foreground">
                  Hệ thống sử dụng các prompt và key AI đã có sẵn trong cấu hình chung (\`ai_settings\`). AI tự động bóc tách chuỗi số điện thoại (Regex/NLP) và cụm từ địa chỉ giao hàng để chuyển trạng thái hội thoại thành đơn hàng.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" /> 3. Đồng bộ danh bạ CRM
                </h4>
                <p className="text-muted-foreground">
                  Nếu số điện thoại trích xuất chưa tồn tại trên hệ thống, ERP tự động tạo một dòng đối tác mới với phân loại Khách hàng, giúp tích lũy lịch sử chi tiêu tự động sau này.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" /> 4. Phản hồi xác nhận tự động
                </h4>
                <p className="text-muted-foreground">
                  Sau khi nháp đơn hàng thành công, ERP sẽ gửi một lệnh API ngược lại Zalo/Facebook để gửi tin nhắn tự động đến khách hàng: <i>"Đã nháp đơn hàng cho bạn, vui lòng kiểm tra..."</i> để chốt giao dịch.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs text-foreground">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Side: Mock Chatwoot Inbox Dashboard */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-12 border rounded-lg overflow-hidden bg-background min-h-[500px]">
          {/* Thread List */}
          <div className="md:col-span-4 border-r flex flex-col">
            <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
              <span className="font-bold text-foreground">Hộp thư chung</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
                <span className="text-[10px] text-muted-foreground font-semibold">Trực tuyến</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[450px]">
              {conversations.map(c => {
                const isActive = c.id === activeConvId;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveConvId(c.id);
                      c.unread = false;
                    }}
                    className={cn(
                      "p-3 border-b cursor-pointer transition-colors hover:bg-secondary/15 flex flex-col gap-1",
                      isActive ? "bg-blue-50/20 border-l-2 border-l-blue-500" : ""
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">{c.customerName}</span>
                      <span className="text-[9px] text-slate-400">14:49</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate leading-normal">
                      {c.lastMessage}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline" className="text-[8px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-100">
                        {c.id === "conv-1" ? "Facebook Page" : "Web Widget"}
                      </Badge>
                      {c.unread && (
                        <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Window */}
          <div className="md:col-span-8 flex flex-col h-[500px]">
            {/* Header info */}
            <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                  {activeConv.customerName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{activeConv.customerName}</h4>
                  <p className="text-[10px] text-muted-foreground">Kênh chat trực tiếp</p>
                </div>
              </div>
              
              <Button size="sm" onClick={handleExtractOrder} className="h-7 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1">
                <FileCheck className="h-3.5 w-3.5" />
                Trích xuất & Tạo đơn hàng
              </Button>
            </div>

            {/* Message streams */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-secondary/5">
              {activeConv.messages.map(m => {
                const isCustomer = m.sender === "customer";
                const isBot = m.sender === "bot";
                return (
                  <div key={m.id} className={cn("flex flex-col max-w-[80%]", isCustomer ? "mr-auto" : "ml-auto items-end")}>
                    <span className="text-[9px] text-slate-400 mb-0.5">{m.senderName} ({m.timestamp})</span>
                    <div className={cn(
                      "p-2.5 rounded-lg text-[11px] leading-normal",
                      isCustomer ? "bg-white border text-foreground rounded-tl-none" : "",
                      m.sender === "agent" ? "bg-blue-600 text-white rounded-tr-none" : "",
                      isBot ? "bg-purple-100 text-purple-800 border-purple-200 rounded-tr-none flex items-start gap-1" : ""
                    )}>
                      {isBot && <Bot className="h-3.5 w-3.5 shrink-0 text-purple-600 mt-0.5" />}
                      <span>{m.content}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick extracted summary card */}
            {activeConv.customerPhone && activeConv.customerPhone !== "Chưa cung cấp" && (
              <div className="p-2 bg-yellow-50 dark:bg-yellow-950/10 border-t border-yellow-200 dark:border-yellow-900/30 flex items-center justify-between text-[10px] text-yellow-800 dark:text-yellow-300">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-yellow-600" /> {activeConv.customerName}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-yellow-600" /> {activeConv.customerPhone}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-yellow-600" /> {activeConv.customerAddress}</span>
                </div>
                <Badge className="bg-yellow-600 text-white text-[8px] uppercase">Đầy đủ thông tin</Badge>
              </div>
            )}

            {/* Input area */}
            <div className="p-3 border-t flex gap-2 bg-background">
              <Input
                placeholder="Nhập nội dung phản hồi khách hàng..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSendMessage(); }}
                className="flex-1 h-8 text-xs"
              />
              <Button size="icon" onClick={handleSendMessage} className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side: CRM Customer Profile & Local AI Copilot Status */}
        <div className="xl:col-span-4 space-y-6">
          {/* Active Customer Profile (CRM) */}
          <Card className="border border-border shadow-none">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-4 w-4 text-indigo-500" />
                Hồ sơ khách hàng (CRM)
              </CardTitle>
              <CardDescription className="text-[10px] mt-0.5">Thông tin liên hệ đồng bộ trong cơ sở dữ liệu POS</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {activeConv.customerName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{activeConv.customerName}</h4>
                  <Badge variant="outline" className="text-[8px] bg-indigo-50 text-indigo-600 border-indigo-200 mt-0.5">
                    Hội thoại ID: {activeConv.id}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t text-[11px]">
                <div className="flex items-start gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground">Số điện thoại:</span>
                    <p className="font-bold text-foreground mt-0.5">{activeConv.customerPhone || "Chưa cung cấp"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground">Địa chỉ giao hàng:</span>
                    <p className="font-medium text-foreground mt-0.5 leading-relaxed">{activeConv.customerAddress || "Chưa cung cấp"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t text-[10px]">
                <div className="p-2 border rounded bg-secondary/10">
                  <span className="text-muted-foreground">Tổng chi tiêu</span>
                  <p className="font-bold text-sm text-foreground mt-0.5">189.000đ</p>
                </div>
                <div className="p-2 border rounded bg-secondary/10">
                  <span className="text-muted-foreground">Điểm tích lũy</span>
                  <p className="font-bold text-sm text-foreground mt-0.5">15 điểm</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Customer Memory Card */}
          <Card className="border border-border shadow-none">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Trí nhớ khách hàng AI (Long-Term Memory)
                </CardTitle>
                <CardDescription className="text-[10px] mt-0.5">Sự thật và sở thích được AI tự ghi nhớ</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[9px] px-2 border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 font-semibold"
                onClick={() => handleExtractAIMemory(activeConv.customerPhone, activeConv.customerName)}
                disabled={isExtractingMemory || !activeConv.customerPhone}
              >
                {isExtractingMemory ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                    Đang quét...
                  </>
                ) : (
                  <>
                    <Bot className="h-3 w-3 mr-1" />
                    AI Trích xuất
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* Memories List */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {memories.filter(m => m.customerPhone === activeConv.customerPhone).length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/60 italic text-center py-4">
                    Chưa có sự kiện nào được ghi nhớ. Nhấn "AI Trích xuất" để tự động phân tích hội thoại.
                  </p>
                ) : (
                  memories
                    .filter(m => m.customerPhone === activeConv.customerPhone)
                    .map(mem => (
                      <div key={mem.id} className="p-2 border rounded-lg bg-purple-500/5 border-purple-500/10 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-foreground leading-relaxed flex items-center gap-1">
                          <span className="text-purple-500 text-[12px]">•</span>
                          {mem.fact}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleDeleteMemory(mem.id)}
                        >
                          ×
                        </Button>
                      </div>
                    ))
                )}
              </div>

              {/* Add Memory Input */}
              {activeConv.customerPhone && (
                <div className="flex gap-1.5 pt-2 border-t">
                  <Input
                    placeholder="Ghi nhớ thủ công sở thích..."
                    value={newMemoryFact}
                    onChange={e => setNewMemoryFact(e.target.value)}
                    className="h-7 text-[10px] flex-1 bg-background"
                    onKeyDown={e => {
                      if (e.key === "Enter") handleAddMemory(activeConv.customerPhone);
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAddMemory(activeConv.customerPhone)}
                    className="h-7 text-[10px] px-2 font-semibold bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Lưu
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Copilot Auto-Detect Status */}
          <Card className="border border-border shadow-none">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="h-4 w-4 text-indigo-500" />
                AI Agent Tự động nhận diện
              </CardTitle>
              <CardDescription className="text-[10px] mt-0.5">Động cơ AI Agent nội bộ (Cục bộ)</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between items-center py-1.5 border-b">
                  <span className="text-muted-foreground">Động cơ phân tích:</span>
                  <span className="font-semibold text-primary">AI Copilot POS (Internal)</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b">
                  <span className="text-muted-foreground">Nhận diện SĐT/Địa chỉ:</span>
                  <Badge className="bg-green-500 text-white text-[8px] font-bold">Kích hoạt</Badge>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">Tự tạo khách hàng mới</Label>
                    <p className="text-[9px] text-muted-foreground">Tự đồng bộ danh bạ sang CRM khi phát sinh chat</p>
                  </div>
                  <Switch
                    checked={config.autoCreatePartners}
                    onCheckedChange={checked => setConfig({ ...config, autoCreatePartners: checked })}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">Tự động phát hiện đơn hàng</Label>
                    <p className="text-[9px] text-muted-foreground">Phân tích hội thoại để nháp đơn hàng</p>
                  </div>
                  <Switch
                    checked={config.autoDraftOrders}
                    onCheckedChange={checked => setConfig({ ...config, autoDraftOrders: checked })}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <Label className="font-semibold">Tự động tạo đơn hàng chính thức</Label>
                    <p className="text-[9px] text-muted-foreground">Tự duyệt và chuyển đơn sang Đã xác nhận luôn</p>
                  </div>
                  <Switch
                    checked={config.autoCreateOrdersImmediately}
                    onCheckedChange={checked => setConfig({ ...config, autoCreateOrdersImmediately: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
