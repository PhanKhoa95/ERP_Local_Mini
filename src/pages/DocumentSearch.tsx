import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Send, Loader2, Star, FileText, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: any[];
  error?: boolean;
}

export default function DocumentSearch() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addBookmark } = useBookmarks();
  const { user } = useAuth();
  const { companyId } = useCompanyContext();

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = query;
    setQuery("");
    setIsLoading(true);

    try {
      if (!companyId) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Bạn chưa được gán vào công ty nào. Vui lòng liên hệ quản trị viên.",
            error: true,
          },
        ]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("chat-with-docs", {
        body: { 
          question: currentQuery, 
          companyId,
          userId: user?.id,
        },
      });

      if (error) {
        console.error("Chat error:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Có lỗi xảy ra: ${error.message}. Vui lòng thử lại sau.`,
            error: true,
          },
        ]);
        return;
      }

      if (data?.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error,
            error: true,
          },
        ]);
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data?.answer || "Không thể tạo câu trả lời. Vui lòng thử lại.",
        citations: data?.citations || [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Search error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại sau.",
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = (msg: Message, prevMsg: Message) => {
    if (!companyId) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không tìm thấy công ty",
      });
      return;
    }

    addBookmark.mutate({
      company_id: companyId,
      question: prevMsg.content,
      answer: msg.content,
      citations: msg.citations,
      tags: [],
      folder: null,
      notes: null,
      is_shared: false,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tra cứu tài liệu</h1>
          <p className="text-muted-foreground">Tìm kiếm thông tin trong tài liệu nội bộ bằng AI</p>
        </div>

        {!user && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bạn cần đăng nhập để sử dụng tính năng này.
            </AlertDescription>
          </Alert>
        )}

        <Card className="h-[calc(100vh-220px)]">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Hội thoại
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Search className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-center">Đặt câu hỏi để tìm kiếm thông tin trong tài liệu</p>
                  <p className="text-sm text-center mt-2 max-w-md">
                    Ví dụ: "Quy trình thanh toán như thế nào?" hoặc "Hướng dẫn sử dụng sản phẩm X"
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : msg.error
                            ? "bg-destructive/10 border border-destructive/20"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.role === "assistant" && !msg.error && msg.citations && msg.citations.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/50 text-xs opacity-70">
                            <p className="font-medium mb-1">Nguồn tham khảo:</p>
                            {msg.citations.map((c, i) => (
                              <p key={i}>
                                • {c.document_name} (Trang {c.page_number || "N/A"}) - {c.similarity}% khớp
                              </p>
                            ))}
                          </div>
                        )}
                        {msg.role === "assistant" && !msg.error && idx > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-7 text-xs"
                            onClick={() => handleBookmark(msg, messages[idx - 1])}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Lưu bookmark
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Đang tìm kiếm...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nhập câu hỏi của bạn..."
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSearch()}
                  disabled={isLoading || !user}
                />
                <Button onClick={handleSearch} disabled={isLoading || !query.trim() || !user}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
