import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, Loader2, X, Minimize2, Maximize2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyContext } from "@/hooks/useCompanyContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface QuickAIChatProps {
  context?: string;
  placeholder?: string;
  title?: string;
  className?: string;
  compact?: boolean;
}

export function QuickAIChat({ 
  context, 
  placeholder = "Hỏi AI về đơn hàng...",
  title = "Hỏi AI",
  className,
  compact = false,
}: QuickAIChatProps) {
  const { toast } = useToast();
  const { companyId } = useCompanyContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = query.trim();
    setQuery("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const fullQuestion = context 
        ? `[Ngữ cảnh: ${context}]\n\nCâu hỏi: ${userMessage}`
        : userMessage;

      const { data, error } = await supabase.functions.invoke("chat-with-docs", {
        body: {
          question: fullQuestion,
          companyId: companyId || "",
        },
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || "Không thể trả lời." },
      ]);
    } catch (error) {
      console.error("AI error:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể kết nối AI. Vui lòng thử lại.",
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={() => setIsOpen(true)}
        className={cn("gap-2", className)}
      >
        <Sparkles className="h-4 w-4" />
        {!compact && title}
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <div 
        className={cn(
          "fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground rounded-full p-3 cursor-pointer shadow-lg hover:scale-105 transition-transform",
          className
        )}
        onClick={() => setIsMinimized(false)}
      >
        <Bot className="h-6 w-6" />
      </div>
    );
  }

  return (
    <Card className={cn("w-full max-w-md shadow-xl", className)}>
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setIsOpen(false);
              setMessages([]);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {/* Messages */}
        {messages.length > 0 && (
          <div className="max-h-60 overflow-y-auto space-y-2 text-sm">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "p-2 rounded-lg",
                  msg.role === "user"
                    ? "bg-primary/10 ml-8"
                    : "bg-muted mr-8"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="bg-muted p-2 rounded-lg mr-8 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Đang trả lời...</span>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="text-sm"
          />
          <Button type="submit" size="icon" disabled={isLoading || !query.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
