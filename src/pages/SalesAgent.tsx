import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useSalesLeads,
  useSalesConversations,
  useSalesMessages,
  useSalesAgentConfig,
} from "@/hooks/useSalesAgent";
import { Bot, MessageCircle, Users, Settings as SettingsIcon, Phone, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const STATUS_COLOR: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-600",
  qualifying: "bg-amber-500/15 text-amber-600",
  proposed: "bg-purple-500/15 text-purple-600",
  won: "bg-green-500/15 text-green-600",
  lost: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  new: "Mới",
  qualifying: "Đang đánh giá",
  proposed: "Đã chào giá",
  won: "Chốt đơn",
  lost: "Mất khách",
};

export default function SalesAgent() {
  const { leads, isLoading: leadsLoading, updateLead } = useSalesLeads();
  const { conversations, isLoading: convLoading } = useSalesConversations();
  const { config, upsertConfig } = useSalesAgentConfig();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const { messages } = useSalesMessages(selectedConvId || undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]") || scrollRef.current;
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    };
    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, selectedConvId]);

  const [form, setForm] = useState<any>({});
  const cfg = useMemo(() => ({ ...config, ...form }), [config, form]);

  const kanbanCols = ["new", "qualifying", "proposed", "won", "lost"] as const;
  const grouped = useMemo(() => {
    const out: Record<string, any[]> = { new: [], qualifying: [], proposed: [], won: [], lost: [] };
    leads.forEach((l: any) => out[l.status]?.push(l));
    return out;
  }, [leads]);

  const handoffQueue = conversations.filter((c: any) => c.status === "handoff" || c.agent_mode === "human");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Sales Agent AI</h1>
          <p className="text-sm text-muted-foreground">
            Trợ lý bán hàng tự động — quản lý lead, hội thoại và cấu hình.
          </p>
        </div>
      </div>

      <Tabs defaultValue="conversations">
        <TabsList>
          <TabsTrigger value="conversations">
            <MessageCircle className="h-4 w-4 mr-2" /> Hội thoại
            {handoffQueue.length > 0 && (
              <Badge variant="destructive" className="ml-2">{handoffQueue.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leads">
            <Users className="h-4 w-4 mr-2" /> Pipeline ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="config">
            <SettingsIcon className="h-4 w-4 mr-2" /> Cấu hình
          </TabsTrigger>
        </TabsList>

        {/* CONVERSATIONS */}
        <TabsContent value="conversations" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Danh sách hội thoại</CardTitle>
              <CardDescription>Ưu tiên các phiên cần nhân viên xử lý</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[60vh]">
                {convLoading && <p className="p-4 text-sm text-muted-foreground">Đang tải…</p>}
                {!convLoading && conversations.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground">Chưa có hội thoại nào.</p>
                )}
                {conversations.map((c: any) => {
                  const lead = c.sales_leads;
                  const isHandoff = c.status === "handoff" || c.agent_mode === "human";
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedConvId(c.id)}
                      className={`w-full text-left px-4 py-3 border-b hover:bg-muted/50 transition ${
                        selectedConvId === c.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {lead?.contact_name || "Khách ẩn danh"}
                        </span>
                        {isHandoff && <Badge variant="destructive" className="text-xs">Cần xử lý</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={STATUS_COLOR[lead?.status || "new"]} variant="secondary">
                          {STATUS_LABEL[lead?.status || "new"]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true, locale: vi })}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                {selectedConvId ? "Lịch sử hội thoại" : "Chọn một hội thoại"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedConvId && (
                <p className="text-sm text-muted-foreground">Nhấp vào hội thoại bên trái để xem chi tiết.</p>
              )}
              {selectedConvId && (
                <ScrollArea className="h-[60vh] pr-4" ref={scrollRef}>
                  <div className="space-y-3">
                    {messages.map((m: any) => (
                      <div
                        key={m.id}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                            m.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : m.role === "assistant"
                                ? "bg-muted"
                                : "bg-amber-500/10 text-amber-700 text-xs"
                          }`}
                        >
                          {m.content}
                          {m.tool_calls && (
                            <div className="mt-2 text-xs opacity-70">
                              🔧 {m.tool_calls.map((t: any) => t.name).join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <p className="text-sm text-muted-foreground">Chưa có tin nhắn.</p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEADS KANBAN */}
        <TabsContent value="leads">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {kanbanCols.map((col) => (
              <Card key={col}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    {STATUS_LABEL[col]}
                    <Badge variant="secondary">{grouped[col]?.length || 0}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {leadsLoading && <p className="text-xs text-muted-foreground">…</p>}
                  {grouped[col]?.map((l: any) => (
                    <div key={l.id} className="rounded-lg border p-3 text-sm space-y-1 hover:shadow-sm transition">
                      <div className="font-medium truncate">{l.contact_name || "Khách ẩn danh"}</div>
                      {l.contact_phone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {l.contact_phone}
                        </div>
                      )}
                      {l.contact_email && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {l.contact_email}
                        </div>
                      )}
                      {l.estimated_value > 0 && (
                        <div className="text-xs font-semibold text-primary">
                          {Number(l.estimated_value).toLocaleString("vi-VN")}đ
                        </div>
                      )}
                      <div className="flex gap-1 pt-1">
                        {kanbanCols
                          .filter((s) => s !== col)
                          .slice(0, 2)
                          .map((next) => (
                            <Button
                              key={next}
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs px-2"
                              onClick={() => updateLead.mutate({ id: l.id, status: next })}
                            >
                              → {STATUS_LABEL[next]}
                            </Button>
                          ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CONFIG */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình Sales Agent</CardTitle>
              <CardDescription>Tùy biến tính cách, ngưỡng tự động và từ khóa chuyển nhân viên.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên trợ lý</Label>
                  <Input
                    value={cfg.agent_name || ""}
                    onChange={(e) => setForm({ ...form, agent_name: e.target.value })}
                    placeholder="Trợ lý bán hàng"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lời chào</Label>
                  <Input
                    value={cfg.greeting || ""}
                    onChange={(e) => setForm({ ...form, greeting: e.target.value })}
                    placeholder="Xin chào! Tôi giúp gì cho bạn?"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Persona / Hướng dẫn vai trò</Label>
                <Textarea
                  rows={4}
                  value={cfg.persona || ""}
                  onChange={(e) => setForm({ ...form, persona: e.target.value })}
                  placeholder="Bạn là trợ lý bán hàng chuyên nghiệp…"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Tự động tạo báo giá</Label>
                  <p className="text-xs text-muted-foreground">AI có thể tạo báo giá nháp khi khách yêu cầu.</p>
                </div>
                <Switch
                  checked={!!cfg.auto_create_quotation}
                  onCheckedChange={(v) => setForm({ ...form, auto_create_quotation: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Tự động chốt đơn</Label>
                  <p className="text-xs text-muted-foreground">Cho phép AI tạo đơn chính thức trong ngưỡng cho phép.</p>
                </div>
                <Switch
                  checked={!!cfg.auto_create_order}
                  onCheckedChange={(v) => setForm({ ...form, auto_create_order: v })}
                />
              </div>

              <div className="space-y-2">
                <Label>Ngưỡng giá trị đơn tự động (VNĐ)</Label>
                <Input
                  type="number"
                  value={cfg.max_order_value || 0}
                  onChange={(e) => setForm({ ...form, max_order_value: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Đơn vượt ngưỡng sẽ tự động chuyển nhân viên duyệt.</p>
              </div>

              <div className="space-y-2">
                <Label>Từ khóa chuyển nhân viên (cách nhau bởi dấu phẩy)</Label>
                <Input
                  value={(cfg.handoff_keywords || []).join(", ")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      handoff_keywords: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="gặp người, khiếu nại, hoàn tiền"
                />
              </div>

              <Button
                onClick={() => upsertConfig.mutate(form)}
                disabled={upsertConfig.isPending || Object.keys(form).length === 0}
              >
                {upsertConfig.isPending ? "Đang lưu…" : "Lưu cấu hình"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
