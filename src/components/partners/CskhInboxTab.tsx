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
  ArrowRight
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
}

interface CustomerMemory {
  id: string;
  customerPhone: string;
  fact: string;
  importance: 1 | 2 | 3;
  createdAt: string;
}

export function CskhInboxTab({ mode = "chat" }: { mode?: "chat" | "settings" }) {
  const { toast } = useToast();
  
  // Settings Config
  const [config, setConfig] = useState({
    autoCreateOrders: true,
    autoCreateOrdersImmediately: false,
    aiAutoReply: false,
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
      messages: [
        { id: "m4", sender: "customer", senderName: "Nguyễn Thị Mai", content: "Báo giá sỉ mẫu ví da nam nhé shop.", timestamp: "11:02" }
      ]
    }
  ];

  const [conversations, setConversations] = useState<Conversation[]>(defaultConvs);
  const [activeConvId, setActiveConvId] = useState("conv-1");
  const [replyText, setReplyText] = useState("");
  
  // AI Memory States
  const [memories, setMemories] = useState<CustomerMemory[]>([]);
  const [isExtractingMemory, setIsExtractingMemory] = useState(false);
  
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

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

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
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    });

    saveConversations(updated);
    setReplyText("");

    toast({
      title: "Tin nhắn đã gửi",
      description: "Đã phản hồi trực tiếp tới khách hàng."
    });
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

      // Search existing or create conversation
      let existConv = conversations.find(c => c.customerPhone === senderPhone);
      const newMsg: Message = {
        id: `m-web-${Date.now()}`,
        sender: "customer",
        senderName,
        content: messageText,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };

      if (existConv) {
        const updated = conversations.map(c => {
          if (c.id === existConv!.id) {
            return {
              ...c,
              lastMessage: messageText,
              unread: true,
              messages: [...c.messages, newMsg]
            };
          }
          return c;
        });
        saveConversations(updated);
        logs.push(`${timestamp()} [Chat Engine] Đã cập nhật tin nhắn mới vào cuộc hội thoại có sẵn của ${senderName}.`);
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
          messages: [newMsg]
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

      // 2. Auto Create Order
      if (config.autoCreateOrders) {
        logs.push(`${timestamp()} [Order Engine] Đang phân tích SĐT & Địa chỉ để tự động tạo đơn hàng...`);
        
        // Simple address parsing
        const addressMatch = messageText.match(/(?:địa chỉ:?\s*|địa chỉ\s*)([^.]+)/i);
        const address = addressMatch ? addressMatch[1].trim() : "Chưa xác định";
        
        const orders = JSON.parse(localStorage.getItem("erp-mini-local-demo-orders") || "[]");
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
        localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify([newOrder, ...orders]));
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
          <div className="space-y-4">
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
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-foreground block truncate">{conv.customerName}</span>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 capitalize">
                    {conv.channel}
                  </Badge>
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
          <Badge variant={activeConv.status === "open" ? "default" : "outline"} className="text-[9px] px-1.5 py-0 font-semibold">
            {activeConv.status === "open" ? "Đang mở" : "Đã đóng"}
          </Badge>
        </CardHeader>

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
