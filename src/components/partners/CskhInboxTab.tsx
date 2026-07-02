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
  Meh
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

export function CskhInboxTab({ mode = "chat" }: { mode?: "chat" | "settings" }) {
  const { toast } = useToast();
  
  // Settings Config
  const [config, setConfig] = useState({
    autoCreateOrders: true,
    autoCreateOrdersImmediately: false,
    aiAutoReply: true, // Default to true so Autopilot runs automatically!
    aiAutoExtractMemory: true,
  });

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
      lastMessage: "Báo giá sỉ mẫu ví da nam nhé shop.",
      channel: "facebook",
      status: "open",
      unread: true,
      tags: ["Khách Sỉ"],
      needsHuman: true,
      autopilotEnabled: false,
      messages: [
        { id: "m4", sender: "customer", senderName: "Nguyễn Thị Mai", content: "Sản phẩm bị lỗi hỏng khóa rồi, shop đổi cho tôi hoặc gặp nhân viên xử lý gấp!", timestamp: "11:02" },
        { id: "m-sys-1", sender: "bot", senderName: "Hệ thống AI", content: "[Báo động] Phát hiện khiếu nại/báo lỗi ngoài phạm vi xử lý. Đã ngắt Autopilot và phát cảnh báo yêu cầu nhân viên can thiệp.", timestamp: "11:03" }
      ]
    }
  ];

  const [conversations, setConversations] = useState<Conversation[]>(defaultConvs);
  const [activeConvId, setActiveConvId] = useState("conv-1");
  const [replyText, setReplyText] = useState("");
  
  // AI Memory States
  const [memories, setMemories] = useState<CustomerMemory[]>([]);
  const [isExtractingMemory, setIsExtractingMemory] = useState(false);
  
  // AI Sentiment States
  const [sentiments, setSentiments] = useState<CustomerSentiment[]>([]);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);

  // AI Suggestion States
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [aiSuggestedReply, setAiSuggestedReply] = useState("");
  
  // CRM Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Customer Tag State
  const [newTagText, setNewTagText] = useState("");

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
    if (savedMems) setMemories(JSON.parse(savedMems));

    const savedSents = localStorage.getItem("erp-mini-cskh-sentiments");
    if (savedSents) setSentiments(JSON.parse(savedSents));

    // Load orders
    const savedOrders = localStorage.getItem("erp-mini-local-demo-orders");
    if (savedOrders) setOrders(JSON.parse(savedOrders));
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

  // Sync updates periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const savedOrders = localStorage.getItem("erp-mini-local-demo-orders");
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  // Filter orders matching active customer phone
  const activeCustomerOrders = orders.filter(
    o => o.customer_phone === activeConv?.customerPhone
  );

  // Active Customer Sentiment
  const activeSentiment = sentiments.find(
    s => s.customerPhone === activeConv?.customerPhone
  );

  const handleSendMessage = () => {
    if (!replyText.trim()) return;
    
    const newMsg: Message = {
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
          needsHuman: false, // Resolve human alarm on response
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    });

    saveConversations(updated);
    setReplyText("");
    setAiSuggestedReply(""); // Clear suggestion after send

    toast({
      title: "Tin nhắn đã gửi",
      description: "Đã phản hồi trực tiếp tới khách hàng."
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

      // Update sentiments list
      const updatedSents = [newSentiment, ...sentiments.filter(s => s.customerPhone !== activeConv.customerPhone)];
      saveSentiments(updatedSents);

      // Set conversation resolved
      const updatedConvs = conversations.map(c => {
        if (c.id === activeConvId) {
          return {
            ...c,
            status: "resolved" as const
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

  // Simulate AI suggest reply
  const handleGenerateAISuggestion = () => {
    if (!activeConv) return;
    setIsGeneratingSuggestion(true);

    setTimeout(() => {
      const customerName = activeConv.customerName;
      const recentMsg = activeConv.messages[activeConv.messages.length - 1]?.content || "";
      const customerMemories = memories
        .filter(m => m.customerPhone === activeConv.customerPhone)
        .map(m => m.fact);

      let suggestion = `Dạ chào ${customerName} ạ, mẫu bên em vẫn đang sẵn hàng.`;
      
      if (recentMsg.includes("ví da")) {
        suggestion = `Dạ chào ${customerName} ạ, ví da nam bên em làm từ da thật 100% cực kỳ bền màu. Hiện sản phẩm đang được giảm giá còn 189k, mình muốn ship về địa chỉ nào để em lên đơn luôn ạ?`;
      } else if (recentMsg.includes("túi đeo chéo") || recentMsg.includes("Hà Nội")) {
        suggestion = `Chào ${customerName} ạ! Mẫu túi đeo chéo đen hiện tại ở chi nhánh Hà Nội bên em đang còn hàng sẵn. Em có thể hỗ trợ tạo đơn giao nhanh ngay trong ngày cho mình nhé!`;
      } else if (recentMsg.includes("lỗi") || recentMsg.includes("hỏng")) {
        suggestion = `Dạ chào ${customerName}, em vô cùng xin lỗi vì sự cố sản phẩm bị hỏng khóa ạ. Shop có chính sách 1 đổi 1 miễn phí, anh/chị cho em xin thông tin để em gửi hàng đổi trả ngay nhé ạ!`;
      } else if (customerMemories.some(f => f.includes("ship COD"))) {
        suggestion = `Dạ chào ${customerName}, em thấy mình thường thích nhận hàng ship COD tận nhà đúng không ạ? Em lên đơn COD cho mẫu này về địa chỉ của mình nhé ạ!`;
      }

      setAiSuggestedReply(suggestion);
      setIsGeneratingSuggestion(false);
      toast({
        title: "AI Suggestion Ready! 🤖",
        description: "AI đã phân tích ngữ cảnh và đề xuất nội dung câu trả lời."
      });
    }, 1200);
  };

  // Add tag to customer profile
  const handleAddTag = () => {
    if (!newTagText.trim()) return;
    const currentTags = activeConv.tags || [];
    if (currentTags.includes(newTagText.trim())) {
      toast({ title: "Nhãn đã tồn tại" });
      return;
    }

    const updated = conversations.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          tags: [...currentTags, newTagText.trim()]
        };
      }
      return c;
    });

    saveConversations(updated);
    setNewTagText("");
    toast({
      title: "Gắn nhãn thành công",
      description: `Đã thêm nhãn "${newTagText.trim()}" vào đối tác.`
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = conversations.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          tags: (c.tags || []).filter(t => t !== tagToRemove)
        };
      }
      return c;
    });
    saveConversations(updated);
  };

  // AI Fact Memory Extraction Simulation
  const handleExtractMemory = () => {
    if (!activeConv) return;
    setIsExtractingMemory(true);
    
    setTimeout(() => {
      const extractedFacts: string[] = [];
      const messagesText = activeConv.messages.map(m => m.content).join(" ");
      const phone = activeConv.customerPhone;

      if (messagesText.includes("ví da")) {
        extractedFacts.push("Đang quan tâm và tìm hiểu ví da nam");
      }
      if (messagesText.includes("Hà Nội")) {
        extractedFacts.push("Thường trú hoặc làm việc tại khu vực Hà Nội");
      }
      if (messagesText.includes("ship COD") || messagesText.includes("địa chỉ")) {
        extractedFacts.push("Thích giao hàng ship COD tận nhà");
      }
      if (messagesText.includes("Túi Trắng") || messagesText.includes("VC20")) {
        extractedFacts.push("Muốn đặt mua sản phẩm Túi Trắng mã VC20");
      }

      if (extractedFacts.length === 0) {
        extractedFacts.push("Khách hàng thân thiện, cần tư vấn thêm mẫu túi đeo chéo");
      }

      // Filter out duplicate facts for this customer phone
      const newMems: CustomerMemory[] = [];
      extractedFacts.forEach(fact => {
        const exist = memories.some(m => m.customerPhone === phone && m.fact === fact);
        if (!exist) {
          newMems.push({
            id: `mem-${Date.now()}-${Math.random()}`,
            customerPhone: phone,
            fact,
            importance: 2,
            createdAt: new Date().toISOString()
          });
        }
      });

      if (newMems.length > 0) {
        saveMemories([...newMems, ...memories]);
        toast({
          title: "Trích xuất thành công! 🤖",
          description: `AI đã ghi nhớ thêm ${newMems.length} sự thật về khách hàng.`
        });
      } else {
        toast({
          title: "Không có thông tin mới",
          description: "AI chưa phát hiện thêm sở thích hoặc sự thật mới nào từ cuộc hội thoại."
        });
      }
      setIsExtractingMemory(false);
    }, 1500);
  };

  // Webhook Test Console Handler
  const handleTriggerWebhook = () => {
    try {
      const parsed = JSON.parse(webhookPayload);
      const senderName = parsed.sender?.name || "Khách hàng ẩn danh";
      const messageText = parsed.message?.text || "";
      const senderPhone = parsed.sender?.phone || "";

      // Start Webhook logging simulation
      const logs: string[] = [];
      const timestamp = () => `[${new Date().toLocaleTimeString("vi-VN")}]`;
      
      logs.push(`${timestamp()} [Webhook] Nhận yêu cầu POST từ ${selectedWebhookChannel.toUpperCase()} API...`);
      logs.push(`${timestamp()} [Webhook] Xác thực Verify Token... Hợp lệ!`);
      logs.push(`${timestamp()} [AI Engine] Đang phân tích hội thoại và nội dung chat...`);

      // Check for human escalation keywords
      const isComplex = /lỗi|hỏng|rách|đền tiền|hoàn tiền|khiếu nại|gặp nhân viên|chất lượng/i.test(messageText);

      // Search existing or create conversation
      let existConv = conversations.find(c => c.customerPhone === senderPhone);
      const newMsg: Message = {
        id: `m-web-${Date.now()}`,
        sender: "customer",
        senderName,
        content: messageText,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };

      let currentMessages = existConv ? [...existConv.messages, newMsg] : [newMsg];

      // If complex, insert system warning message and escalate
      if (isComplex && config.aiAutoReply) {
        const sysMsg: Message = {
          id: `m-sys-${Date.now()}`,
          sender: "bot",
          senderName: "Hệ thống AI",
          content: "[Báo động] AI phát hiện yêu cầu khiếu nại/báo lỗi ngoài phạm vi xử lý. Đã tạm dừng Autopilot và báo động yêu cầu nhân viên can thiệp.",
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        };
        currentMessages.push(sysMsg);
        logs.push(`${timestamp()} [Escalation Engine] Phát hiện khiếu nại phức tạp. Đang báo động nhân viên...`);
      } else if (config.aiAutoReply && !isComplex) {
        // AI Auto Reply (Autopilot)
        const botReplyText = messageText.includes("ví da") 
          ? `[Bot AI] Dạ chào anh/chị, ví da nam bên em làm từ da bò thật 100%, giá ưu đãi chỉ 189k. Anh/chị cho em xin số điện thoại và địa chỉ nhận hàng để em lên đơn giao ngay nhé ạ!`
          : `[Bot AI] Cảm ơn anh/chị đã liên hệ, mẫu này bên em đang còn hàng sẵn ở kho ạ. Shop có hỗ trợ ship COD nhanh toàn quốc, anh/chị cho em xin thông tin SĐT và địa chỉ để shop lên đơn ngay ạ!`;
        
        const botMsg: Message = {
          id: `m-bot-${Date.now()}`,
          sender: "bot",
          senderName: "Bot AI Assistant",
          content: botReplyText,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        };
        currentMessages.push(botMsg);
        logs.push(`${timestamp()} [AI Autopilot] Tự động soạn thảo và gửi câu trả lời thành công.`);
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
              messages: currentMessages
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
          messages: currentMessages
        };
        saveConversations([newConv, ...conversations]);
        setActiveConvId(newConv.id);
        logs.push(`${timestamp()} [Chat Engine] Khởi tạo cuộc hội thoại đa kênh mới cho khách hàng: ${senderName}`);
      }

      // 1. AI Auto Fact Extract
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
        if (messageText.includes("ZL18")) {
          extractedFacts.push("Muốn đặt mua sản phẩm Túi Xách ZL18");
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

      // 2. Auto Create Order (only if not a complex error complaint)
      if (config.autoCreateOrders && !isComplex) {
        logs.push(`${timestamp()} [Order Engine] Đang phân tích SĐT & Địa chỉ để tự động tạo đơn hàng...`);
        
        // Simple address parsing
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
          notes: `[Đơn tự động tạo ${config.autoCreateOrdersImmediately ? "chính thức" : "nháp"} từ CSKH Đa Kênh]`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify([newOrder, ...currentOrders]));
        setOrders([newOrder, ...currentOrders]);
        logs.push(`${timestamp()} [Order Engine] Đã tạo đơn hàng ${config.autoCreateOrdersImmediately ? "chính thức (Đã xác nhận)" : "nháp"}: ${orderId}`);
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

  if (mode === "settings") {
    return (
      <Card className="border-border/45 bg-card/60 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Settings2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-sm font-semibold">Cấu hình CSKH Đa Kênh & AI Sales Auto-Closer</CardTitle>
              <CardDescription className="text-xs">Thiết lập tự động hóa chatbot, chốt đơn hàng và trích xuất trí nhớ AI</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Performance Dashboard Stat Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-5">
            <Card className="bg-background/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold">TỔNG TIN NHẮN</span>
                  <h3 className="text-lg font-bold text-foreground mt-0.5">1,284</h3>
                </div>
                <div className="h-9 w-9 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-background/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold">TỔNG ĐIỂM CẢM XÚC</span>
                  <h3 className="text-lg font-bold text-foreground mt-0.5">88 / 100</h3>
                </div>
                <div className="h-9 w-9 rounded bg-pink-500/10 flex items-center justify-center text-pink-500">
                  <Heart className="h-5 w-5 animate-pulse" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-background/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold">TỶ LỆ CHỐT ĐƠN</span>
                  <h3 className="text-lg font-bold text-foreground mt-0.5">85.4%</h3>
                </div>
                <div className="h-9 w-9 rounded bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
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
          </div>

          {/* Webhook Simulator Section */}
          <div className="border-t pt-5">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-xs font-bold text-foreground">Webhook Simulator & Test Console</h3>
            </div>
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
                  <Label className="text-[10px] font-semibold">JSON Payload (Thử gõ các từ 'lỗi', 'hỏng khóa' để kiểm tra tự báo động nhân viên)</Label>
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
          </div>
        </CardContent>
      </Card>
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
                // Mark read locally
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
      <Card className="xl:col-span-6 border-border/45 bg-card/60 backdrop-blur-md flex flex-col h-full overflow-hidden">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
              {activeConv.customerName.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-xs font-bold">{activeConv.customerName}</CardTitle>
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
              <span className="font-semibold leading-relaxed">AI đã dừng Autopilot và yêu cầu chuyển giao người thật do khách khiếu nại/báo lỗi.</span>
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
        <div className="p-3 border-t bg-background/50 flex gap-2">
          <Input 
            placeholder="Nhập nội dung phản hồi..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSendMessage()}
            className="h-8.5 text-xs bg-background"
          />
          <Button onClick={handleSendMessage} size="icon" className="h-8.5 w-8.5 flex-shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Column 3: AI Long-Term Memory & CRM profile */}
      <div className="xl:col-span-3 space-y-4 h-full overflow-y-auto">
        {/* Customer Profiles card */}
        <Card className="border-border/45 bg-card/60 backdrop-blur-md">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-xs font-bold">Thông tin CRM & Giao nhận</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-semibold">Họ tên</span>
              <Input value={activeConv.customerName} readOnly className="h-7 text-xs font-medium bg-muted/30" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-semibold">Số điện thoại</span>
              <Input value={activeConv.customerPhone} readOnly className="h-7 text-xs font-medium font-mono bg-muted/30" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-semibold">Địa chỉ nhận hàng</span>
              <div className="flex gap-1.5 items-start">
                <MapPin className="h-4 w-4 text-slate-500 mt-1.5 flex-shrink-0" />
                <span className="text-xs leading-relaxed text-foreground">{activeConv.customerAddress || "Chưa cung cấp"}</span>
              </div>
            </div>

            {/* Classification tags */}
            <div className="space-y-2 border-t pt-3.5">
              <Label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> Thẻ/Nhãn đối tác
              </Label>
              <div className="flex gap-1 flex-wrap mb-2">
                {(activeConv.tags || []).map((tag, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className="text-[9px] pr-1 gap-1 flex items-center"
                  >
                    {tag}
                    <button 
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground hover:text-destructive font-bold text-[8px] px-0.5 rounded"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Input 
                  placeholder="Thêm nhãn mới..."
                  value={newTagText}
                  onChange={e => setNewTagText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddTag()}
                  className="h-7 text-[10px]"
                />
                <Button onClick={handleAddTag} variant="outline" size="sm" className="h-7 text-[10px]">
                  Thêm
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Customer Sentiment Card */}
        <Card className="border-border/45 bg-card/60 backdrop-blur-md">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-primary" />
              <CardTitle className="text-xs font-bold">Đo lường Cảm xúc AI</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {!activeSentiment ? (
              <div className="text-center py-6 text-slate-500 italic text-[10px] border border-dashed rounded-lg bg-background/50">
                Chưa có dữ liệu cảm xúc. Bấm nút "Đóng & Phân tích AI" tại khung chat để bắt đầu đo lường.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-semibold">Chỉ số cảm xúc:</span>
                  <span className="text-xs font-bold text-foreground">{activeSentiment.score} / 100</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className={cn(
                    "h-full rounded-full transition-all duration-300",
                    activeSentiment.score >= 80 ? "bg-emerald-500" : activeSentiment.score >= 60 ? "bg-blue-500" : "bg-red-500"
                  )} style={{ width: `${activeSentiment.score}%` }} />
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {activeSentiment.score >= 80 ? (
                    <Smile className="h-4.5 w-4.5 text-emerald-500" />
                  ) : activeSentiment.score >= 60 ? (
                    <Meh className="h-4.5 w-4.5 text-blue-500" />
                  ) : (
                    <Frown className="h-4.5 w-4.5 text-red-500" />
                  )}
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-semibold px-2 py-0",
                    activeSentiment.score >= 80 ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                  )}>
                    {activeSentiment.label}
                  </Badge>
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground italic border-t pt-2 mt-1">
                  "{activeSentiment.summary}"
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CRM Order History card */}
        <Card className="border-border/45 bg-card/60 backdrop-blur-md">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <CardTitle className="text-xs font-bold">Lịch sử đơn hàng ({activeCustomerOrders.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {activeCustomerOrders.length === 0 ? (
              <div className="text-center py-6 text-slate-500 italic text-[10px] border border-dashed rounded-lg bg-background/50">
                Chưa có đơn hàng nào được tạo cho SĐT này.
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {activeCustomerOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="p-2 border rounded bg-background/50 flex flex-col gap-1 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold font-mono text-foreground">{order.order_number}</span>
                      <Badge variant="outline" className={cn(
                        "text-[8px] px-1 py-0",
                        order.status === "confirmed" ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                      )}>
                        {order.status === "confirmed" ? "Đã xác nhận" : "Mới/Nháp"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{Number(order.total_amount).toLocaleString("vi-VN")}đ</span>
                      <span>{new Date(order.created_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Memory panel */}
        <Card className="border-border/45 bg-card/60 backdrop-blur-md">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-primary" />
              <CardTitle className="text-xs font-bold">Trí nhớ dài hạn AI</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              disabled={isExtractingMemory}
              onClick={handleExtractMemory}
              className="h-7 w-7"
            >
              <Sparkles className={cn("h-4 w-4 text-indigo-500", isExtractingMemory && "animate-spin")} />
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            {isExtractingMemory && (
              <div className="text-center py-4 space-y-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">
                <Sparkles className="h-5 w-5 mx-auto animate-spin mb-1 text-indigo-500" />
                <span>AI đang đọc lịch sử chat...</span>
              </div>
            )}
            
            {!isExtractingMemory && (
              <div className="space-y-2">
                {memories.filter(m => m.customerPhone === activeConv.customerPhone).length === 0 ? (
                  <div className="text-center py-6 text-slate-500 italic text-[10px] border border-dashed rounded-lg bg-background/50">
                    Chưa có bộ nhớ AI được lưu trữ. Bấm biểu tượng Sparkles ở trên để trích xuất tự động.
                  </div>
                ) : (
                  memories
                    .filter(m => m.customerPhone === activeConv.customerPhone)
                    .map((mem) => (
                      <div 
                        key={mem.id}
                        className="flex items-start gap-1.5 p-2 border rounded-lg bg-background/50 text-[10px] leading-relaxed text-foreground hover:shadow-sm transition-shadow"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <span>{mem.fact}</span>
                      </div>
                    ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
