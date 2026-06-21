import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bot, X, Send, MessageCircle } from "lucide-react";
import { sendSalesAgentMessage } from "@/hooks/useSalesAgent";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { toast } from "@/hooks/use-toast";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  /** Optional override; defaults to current user's company. Used for embedding on public pages. */
  companyId?: string;
  greeting?: string;
}

const STORAGE_KEY = "sales_agent_session";

export function SalesChatWidget({ companyId: companyIdProp, greeting }: Props) {
  const { companyId: ctxCompanyId } = useCompanyContext();
  const companyId = companyIdProp || ctxCompanyId;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => [
    { role: "assistant", content: greeting || "Xin chào! Tôi có thể giúp gì cho bạn hôm nay?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | undefined>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")?.token;
    } catch {
      return undefined;
    }
  });
  const [conversationId, setConversationId] = useState<string | undefined>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")?.cid;
    } catch {
      return undefined;
    }
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    if (!companyId) {
      toast({ title: "Chưa sẵn sàng", description: "Thiếu thông tin doanh nghiệp.", variant: "destructive" });
      return;
    }
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const data: any = await sendSalesAgentMessage({
        message: text,
        company_id: companyId,
        session_token: sessionToken,
        conversation_id: conversationId,
      });
      if (data?.session_token) {
        setSessionToken(data.session_token);
        setConversationId(data.conversation_id);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ token: data.session_token, cid: data.conversation_id }),
        );
      }
      setMessages((m) => [...m, { role: "assistant", content: data?.reply || "..." }]);
    } catch (e: any) {
      toast({
        title: "Lỗi gửi tin",
        description: e?.message || "Không gửi được tin nhắn.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="fixed bottom-5 right-5 rounded-full h-14 w-14 shadow-lg z-50"
        aria-label="Mở chat tư vấn"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-5 right-5 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)] flex flex-col shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <div>
            <div className="font-semibold text-sm">Trợ lý bán hàng</div>
            <div className="text-xs opacity-80">Phản hồi ngay</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8 text-primary-foreground hover:bg-white/10">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-3 py-2 text-sm">Đang soạn…</div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t p-2 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Nhập câu hỏi…"
          disabled={loading}
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
