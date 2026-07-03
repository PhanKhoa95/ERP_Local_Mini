import React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import { useAIRotator } from "@/hooks/useAIRotator";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { Bot, Send, Loader2, X, Minimize2, Sparkles, BarChart3, Package, ShoppingCart, Users, CheckCircle2, ShoppingBag, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

interface DraftOrder {
  customerPhone: string;
  customerAddress: string;
  items: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  draftOrder?: DraftOrder;
  isConfirmed?: boolean;
  orderNumber?: string;
}

const suggestedQuestions = [
  { icon: Package, text: "Sản phẩm nào sắp hết hàng?", color: "text-warning" },
  { icon: ShoppingCart, text: "Đơn hàng hôm nay thế nào?", color: "text-primary" },
  { icon: BarChart3, text: "Doanh thu tháng này bao nhiêu?", color: "text-success" },
  { icon: Users, text: "Khách hàng nào nợ nhiều nhất?", color: "text-destructive" },
];

export function ERPChatbot() {
  const location = useLocation();
  if (location.pathname === "/pos") {
    return null;
  }

  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { createOrder } = useOrders();
  const { products = [] } = useProducts();

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    };

    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  const { activeConfig, rotateActiveKey, rotateToNextProvider, activeProviderId } = useAIRotator();

  const extractDraftOrder = (text: string, allProducts: any[]): DraftOrder | null => {
    // 1. Extract phone number (9-11 digits)
    const phoneRegex = /(?:0|\+84)\d{9,10}/g;
    const phoneMatch = text.replace(/\s+/g, "").match(phoneRegex);
    if (!phoneMatch) return null;
    const phone = phoneMatch[0];

    // Clean text for product matching
    const cleanText = text.toLowerCase();

    // 2. Match products
    const items: DraftOrder["items"] = [];
    allProducts.forEach(prod => {
      const prodNameLower = prod.name.toLowerCase();
      const prodSkuLower = (prod.sku || "").toLowerCase();
      
      const isSkuMatch = prodSkuLower && cleanText.includes(prodSkuLower);
      const isNameMatch = cleanText.includes(prodNameLower) || 
                          (prodNameLower.length > 5 && cleanText.includes(prodNameLower.substring(0, Math.min(prodNameLower.length, 12))));

      if (isSkuMatch || isNameMatch) {
        let quantity = 1;
        const matchTerm = isSkuMatch ? prodSkuLower : prodNameLower;
        const termIdx = cleanText.indexOf(matchTerm);
        
        if (termIdx !== -1) {
          const contextBefore = cleanText.substring(Math.max(0, termIdx - 15), termIdx);
          const contextAfter = cleanText.substring(termIdx + matchTerm.length, Math.min(cleanText.length, termIdx + matchTerm.length + 15));
          
          const numRegex = /\b(\d+)\b/;
          const matchBefore = contextBefore.match(numRegex);
          const matchAfter = contextAfter.match(numRegex);
          
          if (matchBefore) {
            quantity = parseInt(matchBefore[1], 10);
          } else if (matchAfter) {
            quantity = parseInt(matchAfter[1], 10);
          }
        }
        
        items.push({
          productId: prod.id,
          name: prod.name,
          sku: prod.sku || "",
          quantity,
          price: Number(prod.price || prod.sale_price || 0)
        });
      }
    });

    if (items.length === 0) return null;

    // 3. Extract address
    let address = "Chưa cung cấp địa chỉ";
    const addressKeywords = ["địa chỉ", "ở", "giao tại", "giao đến", "ship đến"];
    for (const kw of addressKeywords) {
      const kwIdx = cleanText.indexOf(kw);
      if (kwIdx !== -1) {
        const rawAddr = text.substring(kwIdx + kw.length).trim();
        const cleanedAddr = rawAddr.split(/[,.;\n]/)[0].replace(/^[:\s\-]+/, "").trim();
        if (cleanedAddr) {
          address = cleanedAddr;
          break;
        }
      }
    }

    return {
      customerPhone: phone,
      customerAddress: address,
      items
    };
  };

  const handleCancelDraft = (index: number) => {
    setMessages(prev =>
      prev.map((msg, i) =>
        i === index ? { ...msg, draftOrder: undefined } : msg
      )
    );
    setMessages(prev => [
      ...prev,
      { role: "assistant", content: "Đã hủy bỏ đơn hàng nháp." }
    ]);
  };

  const handleConfirmDraft = async (index: number) => {
    const msg = messages[index];
    if (!msg || !msg.draftOrder || !companyId) return;

    try {
      const draft = msg.draftOrder;
      const orderNumber = `AUTO-${Math.floor(1000 + Math.random() * 9000)}`;
      const itemsTotal = draft.items.reduce((sum, it) => sum + it.price * it.quantity, 0);

      const orderPayload = {
        order: {
          company_id: companyId,
          order_number: orderNumber,
          customer_name: "Khách chốt AI",
          customer_phone: draft.customerPhone,
          customer_email: "",
          customer_address: draft.customerAddress,
          shipping_address: draft.customerAddress,
          status: "pending" as any,
          payment_status: "pending" as any,
          payment_method: "cod",
          source_type: "chatbot" as any,
          total: itemsTotal,
          discount: 0,
          shipping_fee: 0,
          priority: "normal" as any,
          assigned_to: null,
          warehouse_id: "wh-1",
        },
        items: draft.items.map(it => ({
          product_id: it.productId,
          quantity: it.quantity,
          unit_price: it.price,
          total_price: it.price * it.quantity
        }))
      };

      await createOrder.mutateAsync(orderPayload);

      setMessages(prev =>
        prev.map((m, i) =>
          i === index ? { ...m, isConfirmed: true, orderNumber } : m
        )
      );

      toast({
        title: "Tạo đơn hàng tự động",
        description: `Mã đơn ${orderNumber} đã được chốt và lưu vào hệ thống!`
      });
      
      window.dispatchEvent(new Event("local-orders-updated"));
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Không thể chốt đơn",
        description: err.message || "Đã xảy ra lỗi khi tạo đơn hàng tự động."
      });
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !companyId) return;

    const userMessage = text.trim();
    setQuery("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    const draft = extractDraftOrder(userMessage, products);
    if (draft) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: "Chào bạn, tôi phát hiện thấy yêu cầu đặt hàng của bạn. Hãy kiểm tra lại thông tin đơn hàng nháp dưới đây và bấm nút Xác nhận chốt đơn để lưu vào hệ thống nhé!",
            draftOrder: draft
          }
        ]);
        setIsLoading(false);
      }, 500);
      return;
    }

    let attempts = 0;
    const maxAttempts = 3;
    let success = false;
    let currentConfig = { ...activeConfig };
    let currentProviderId = activeProviderId;

    while (attempts < maxAttempts && !success) {
      try {
        attempts++;
        const { data, error } = await supabase.functions.invoke("ai-erp-assistant", {
          body: {
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            companyId,
            aiProviderConfig: currentConfig
          },
        });

        if (error) throw error;

        setMessages(prev => [
          ...prev,
          { role: "assistant", content: data.answer || "Xin lỗi, tôi không thể trả lời." },
        ]);
        success = true;
      } catch (error: any) {
        console.error(`AI Connection attempt ${attempts} failed:`, error);
        
        const isRotatableError = 
          error?.message?.includes("429") || 
          error?.message?.includes("402") || 
          error?.message?.includes("401") ||
          error?.message?.includes("Rate limit") ||
          error?.message?.includes("quota") ||
          error?.message?.includes("API key") ||
          error?.message?.includes("unauthorized") ||
          error?.message?.includes("token");

        if (isRotatableError && attempts < maxAttempts) {
          // Try to rotate keys for current provider
          const rotatedKey = rotateActiveKey(currentProviderId);
          if (!rotatedKey) {
            // If all keys of current provider exhausted, rotate to next enabled provider
            const rotatedProvider = rotateToNextProvider();
            if (!rotatedProvider) {
              break;
            }
          }

          // Directly load the updated local storage state for the next loop run
          const rawRotationSettings = localStorage.getItem("erp-mini-ai-rotator-settings-v1");
          const activeId = localStorage.getItem("erp-mini-ai-rotator-settings-v1-active-id") || "gemini";
          if (rawRotationSettings) {
            const parsedProviders = JSON.parse(rawRotationSettings);
            const currentP = parsedProviders.find((p: any) => p.id === activeId) || parsedProviders[0];
            currentConfig = {
              provider: currentP.id,
              model: currentP.selectedModel,
              apiKey: currentP.keys[currentP.activeKeyIndex] || "",
              baseUrl: currentP.baseUrl
            };
            currentProviderId = currentP.id;
          }

          toast({
            title: "Lỗi kết nối AI - Đang tự động xoay tua",
            description: "Hệ thống đang định tuyến lại yêu cầu của bạn qua API Key dự phòng..."
          });
          continue;
        } else {
          const errorMsg = error?.message?.includes("429") 
            ? "Quá nhiều yêu cầu. Vui lòng thử lại sau."
            : error?.message?.includes("402")
            ? "Đã hết quota AI. Vui lòng nạp thêm credits."
            : "Lỗi kết nối đến dịch vụ AI. Vui lòng kiểm tra lại API Key.";
          toast({ variant: "destructive", title: "Lỗi", description: errorMsg });
          setMessages(prev => [...prev, { role: "assistant", content: errorMsg }]);
          break;
        }
      }
    }
    
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(query);
  };

  if (!isOpen) {
    return (
      <button
        className="fixed bottom-6 right-6 z-50 cursor-pointer group"
        onClick={() => setIsOpen(true)}
        aria-label="Trợ lý AI"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:scale-110 transition-transform">
            <Bot className="h-6 w-6" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
        </div>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full p-3 cursor-pointer shadow-lg hover:scale-105 transition-transform"
        onClick={() => setIsMinimized(false)}
      >
        <Bot className="h-6 w-6" />
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] shadow-2xl border-primary/20 flex flex-col animate-scale-in">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b bg-primary/5 rounded-t-lg">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          Trợ lý AI ERP
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(true)}>
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setIsOpen(false); setMessages([]); }}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col flex-1 min-h-0">
        <ScrollArea className="flex-1 min-h-0">
          <div ref={scrollRef} className="p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="text-center py-3">
                  <Bot className="h-10 w-10 mx-auto text-primary/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Xin chào! Tôi có thể giúp bạn tra cứu tồn kho, đơn hàng, công nợ và doanh thu.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q.text)}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors text-left text-sm"
                    >
                      <q.icon className={cn("h-4 w-4 shrink-0", q.color)} />
                      <span className="text-foreground">{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className="space-y-2">
                <div
                  className={cn(
                    "p-3 rounded-lg text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-8"
                      : "bg-muted mr-4"
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>

                {/* Draft Order Card UI */}
                {msg.draftOrder && !msg.isConfirmed && (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-xl p-3.5 mr-4 shadow-sm space-y-3">
                    <div className="flex items-center gap-1.5 border-b pb-2">
                      <ShoppingBag className="h-4 w-4 text-blue-600 animate-pulse" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Đơn hàng nháp tự động
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span>SĐT: <strong>{msg.draftOrder.customerPhone}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">Địa chỉ: <strong>{msg.draftOrder.customerAddress}</strong></span>
                      </div>
                    </div>

                    <div className="space-y-1 border-t pt-2">
                      {msg.draftOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="truncate max-w-[200px] text-slate-700 dark:text-slate-300">
                            {item.name} <span className="text-slate-400">x{item.quantity}</span>
                          </span>
                          <span className="font-semibold">
                            {Number(item.price * item.quantity).toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center border-t pt-2 text-xs">
                      <span className="font-bold">Tổng cộng:</span>
                      <span className="font-bold text-blue-600 text-sm">
                        {Number(
                          msg.draftOrder.items.reduce((sum, it) => sum + it.price * it.quantity, 0)
                        ).toLocaleString("vi-VN")}đ
                      </span>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelDraft(i)}
                        className="h-7 text-[10px] px-2.5"
                      >
                        Hủy
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleConfirmDraft(i)}
                        className="h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white font-semibold px-2.5"
                      >
                        Xác nhận chốt đơn
                      </Button>
                    </div>
                  </div>
                )}

                {/* Confirmed Order Card UI */}
                {msg.draftOrder && msg.isConfirmed && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3.5 mr-4 shadow-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>ĐÃ TẠO ĐƠN THÀNH CÔNG</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mã đơn hệ thống: <strong>{msg.orderNumber || "AUTO-0000"}</strong>
                    </p>
                    <div className="text-[10px] text-slate-500">
                      Sản phẩm: {msg.draftOrder.items.map(it => `${it.name} (x${it.quantity})`).join(", ")}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="bg-muted p-3 rounded-lg mr-4 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Đang phân tích...</span>
              </div>
            )}
            <div className="h-6" />
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-3 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hỏi về tồn kho, đơn hàng, doanh thu..."
              disabled={isLoading}
              className="text-sm"
            />
            <Button type="submit" size="icon" disabled={isLoading || !query.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

