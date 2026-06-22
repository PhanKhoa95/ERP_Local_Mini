import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, Loader2, X, Minimize2, Sparkles, BarChart3, Package, ShoppingCart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  { icon: Package, text: "Sản phẩm nào sắp hết hàng?", color: "text-warning" },
  { icon: ShoppingCart, text: "Đơn hàng hôm nay thế nào?", color: "text-primary" },
  { icon: BarChart3, text: "Doanh thu tháng này bao nhiêu?", color: "text-success" },
  { icon: Users, text: "Khách hàng nào nợ nhiều nhất?", color: "text-destructive" },
];

export function ERPChatbot() {
  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    };

    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !companyId) return;

    const userMessage = text.trim();
    setQuery("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-erp-assistant", {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          companyId,
        },
      });

      if (error) throw error;

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.answer || "Xin lỗi, tôi không thể trả lời." },
      ]);
    } catch (error: any) {
      console.error("ERP Assistant error:", error);
      const errorMsg = error?.message?.includes("429") 
        ? "Quá nhiều yêu cầu. Vui lòng thử lại sau."
        : error?.message?.includes("402")
        ? "Đã hết quota AI. Vui lòng nạp thêm credits."
        : "Có lỗi xảy ra. Vui lòng thử lại.";
      toast({ variant: "destructive", title: "Lỗi", description: errorMsg });
      setMessages(prev => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
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
              <div
                key={i}
                className={cn(
                  "p-3 rounded-lg text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-8"
                    : "bg-muted mr-4"
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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

