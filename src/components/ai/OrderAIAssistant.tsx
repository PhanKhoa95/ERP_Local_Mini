import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, Loader2, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyContext } from "@/hooks/useCompanyContext";

interface OrderAIAssistantProps {
  orderContext?: string;
  className?: string;
}

export function OrderAIAssistant({ orderContext, className }: OrderAIAssistantProps) {
  const { toast } = useToast();
  const { companyId } = useCompanyContext();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setAnswer("");

    try {
      const systemContext = orderContext 
        ? `Ngữ cảnh đơn hàng: ${orderContext}\n\n`
        : "";

      const { data, error } = await supabase.functions.invoke("chat-with-docs", {
        body: {
          question: `${systemContext}Câu hỏi về đơn hàng: ${query}`,
          companyId: companyId || "",
        },
      });

      if (error) throw error;

      setAnswer(data.answer || "Không thể trả lời.");
    } catch (error) {
      console.error("AI error:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể kết nối AI.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "Tình trạng đơn hàng này?",
    "Khi nào giao hàng?",
    "Thanh toán thế nào?",
  ];

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn("gap-2", className)}
      >
        <MessageSquare className="h-4 w-4" />
        Hỏi AI
      </Button>
    );
  }

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bot className="h-4 w-4 text-primary" />
            Hỏi AI về đơn hàng
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setIsOpen(false);
              setAnswer("");
              setQuery("");
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Quick Questions */}
        <div className="flex flex-wrap gap-1">
          {quickQuestions.map((q) => (
            <Button
              key={q}
              variant="secondary"
              size="sm"
              className="text-xs h-7"
              onClick={() => setQuery(q)}
            >
              {q}
            </Button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập câu hỏi..."
            disabled={isLoading}
            className="text-sm"
          />
          <Button type="submit" size="icon" disabled={isLoading || !query.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>

        {answer && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
