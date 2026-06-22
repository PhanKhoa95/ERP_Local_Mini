import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bot, User, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Message {
  sender: "bot" | "user";
  text: string;
  tasks?: Array<{
    task: string;
    type: "completed" | "pending" | "blocker";
    project_code?: string;
  }>;
}

interface Props {
  onTasksParsed: (tasks: any[]) => void;
}

export function WorkReportChatbot({ onTasksParsed }: Props) {
  const { projects = [] } = useProjects();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Xin chào! Hãy kể cho tôi những việc bạn đã làm hôm nay (Ví dụ: 'Tôi đã hoàn thành task viết API, đang làm dở tài liệu và bị block bởi lỗi server'). Tôi sẽ giúp bạn định khoản và tạo báo cáo tự động."
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, { sender: "user", text: userText }]);
    setInputValue("");
    setLoading(true);

    try {
      const projectList = projects.map(p => ({ id: p.id, code: p.code, name: p.name }));
      
      const { data, error } = await supabase.functions.invoke("parse-voice-report", {
        body: {
          transcript: userText,
          projects: projectList
        }
      });

      if (error) throw error;

      if (data?.tasks && data.tasks.length > 0) {
        onTasksParsed(data.tasks);
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `Đã phân tích thành công ${data.tasks.length} đầu việc và thêm vào bản nháp của bạn!`,
            tasks: data.tasks
          }
        ]);
        toast.success(`Đã thêm ${data.tasks.length} công việc mới!`);
      } else {
        // Fallback
        const fallback = {
          task: userText,
          type: userText.toLowerCase().includes("xong") ? "completed" as const : "pending" as const
        };
        onTasksParsed([fallback]);
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: "Tôi đã ghi nhận đầu việc của bạn vào bản nháp (xử lý cơ bản).",
            tasks: [fallback]
          }
        ]);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Lỗi AI: " + err.message);
      // Local fallback
      const fallback = {
        task: userText,
        type: userText.toLowerCase().includes("xong") ? "completed" as const : "pending" as const
      };
      onTasksParsed([fallback]);
      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: "Đã có lỗi xảy ra nhưng tôi vẫn ghi nhận công việc của bạn vào bản nháp.",
          tasks: [fallback]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[400px]">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Trợ lý Báo cáo AI
        </CardTitle>
        <CardDescription className="text-xs">
          Trò chuyện tự nhiên để điền nhanh nội dung báo cáo công việc hàng ngày
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 max-w-[85%] ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
            }`}
          >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted border text-muted-foreground"
            }`}>
              {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            
            <div className="space-y-1">
              <div className={`rounded-lg p-3 text-sm leading-relaxed ${
                msg.sender === "user" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted border text-foreground"
              }`}>
                {msg.text}
              </div>
              
              {msg.tasks && (
                <div className="bg-background border rounded-md p-2 space-y-1.5 mt-1.5 shadow-sm">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    Công việc được AI trích xuất:
                  </div>
                  {msg.tasks.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs px-1 py-0.5 rounded hover:bg-muted/30">
                      <CheckCircle2 className={`h-3.5 w-3.5 ${
                        t.type === "completed" 
                          ? "text-emerald-500" 
                          : t.type === "blocker" 
                          ? "text-destructive" 
                          : "text-amber-500"
                      }`} />
                      <span className="font-medium line-clamp-1">{t.task}</span>
                      {t.project_code && (
                        <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 border-primary/20 bg-primary/5 text-primary">
                          {t.project_code}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pl-10">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span>AI đang phân tích và định khoản công việc...</span>
          </div>
        )}
      </CardContent>

      <div className="p-3 border-t bg-muted/10 flex items-center gap-2">
        <Input
          placeholder="Nhập những việc bạn đã làm hôm nay..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading}
          className="bg-background text-sm"
        />
        <Button size="icon" onClick={handleSend} disabled={loading || !inputValue.trim()} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
