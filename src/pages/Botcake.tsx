import { useState } from "react";
import { useBotcake, BotcakeFlow, BotcakeButton } from "@/hooks/useBotcake";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, MessageSquare, Zap, BarChart2, Users, Send, 
  Plus, Edit, Trash2, Smartphone, Play, Phone, ExternalLink, 
  ToggleLeft, Link, Settings, RefreshCw, AlertCircle
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const analyticsData = [
  { day: "Thứ 2", newSub: 120, sentMsg: 1800 },
  { day: "Thứ 3", newSub: 150, sentMsg: 2200 },
  { day: "Thứ 4", newSub: 210, sentMsg: 3100 },
  { day: "Thứ 5", newSub: 180, sentMsg: 2900 },
  { day: "Thứ 6", newSub: 240, sentMsg: 3400 },
  { day: "Thứ 7", newSub: 310, sentMsg: 4200 },
  { day: "Chủ nhật", newSub: 280, sentMsg: 3900 }
];

export default function Botcake() {
  const {
    flows,
    createFlow,
    updateFlow,
    deleteFlow,
    broadcasts,
    createBroadcast,
    sendBroadcast,
    sequences,
    createSequence,
    toggleSequence,
    refLinks,
    createRefLink
  } = useBotcake();

  // Active Flow Selection
  const [selectedFlow, setSelectedFlow] = useState<BotcakeFlow | null>(flows[0] || null);

  // Dialog states
  const [openNewFlow, setOpenNewFlow] = useState(false);
  const [openNewBroadcast, setOpenNewBroadcast] = useState(false);
  const [openNewSequence, setOpenNewSequence] = useState(false);
  const [openNewRef, setOpenNewRef] = useState(false);

  // Form states
  const [newFlowName, setNewFlowName] = useState("");
  const [newBcName, setNewBcName] = useState("");
  const [newBcContent, setNewBcContent] = useState("");
  const [newSeqName, setNewSeqName] = useState("");
  const [newSeqDelay, setNewSeqDelay] = useState(1);
  const [newSeqUnit, setNewSeqUnit] = useState<"hours" | "days">("hours");
  const [newSeqFlowId, setNewSeqFlowId] = useState("");
  const [newRefName, setNewRefName] = useState("");
  const [newRefCode, setNewRefCode] = useState("");
  const [newRefFlowId, setNewRefFlowId] = useState("");

  // Edit Flow details
  const [editedContent, setEditedContent] = useState("");
  const [editedKeywords, setEditedKeywords] = useState("");
  const [editedButtons, setEditedButtons] = useState<BotcakeButton[]>([]);

  // Simulation states
  const [simMessages, setSimMessages] = useState<Array<{ sender: "user" | "bot"; text: string; buttons?: BotcakeButton[] }>>([]);

  const handleSelectFlow = (flow: BotcakeFlow) => {
    setSelectedFlow(flow);
    setEditedContent(flow.message_content);
    setEditedKeywords(flow.trigger_keywords.join(", "));
    setEditedButtons(flow.buttons);
    setSimMessages([]);
  };

  const handleSaveFlow = async () => {
    if (!selectedFlow) return;
    const updated = {
      ...selectedFlow,
      message_content: editedContent,
      trigger_keywords: editedKeywords.split(",").map(k => k.trim()).filter(Boolean),
      buttons: editedButtons
    };
    await updateFlow.mutateAsync(updated);
    setSelectedFlow(updated);
  };

  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName) return;
    const newF = await createFlow.mutateAsync({
      name: newFlowName,
      trigger_keywords: [newFlowName.toLowerCase()],
      message_content: "Xin chào! Nhập nội dung phản hồi tại đây.",
      buttons: []
    });
    setNewFlowName("");
    setOpenNewFlow(false);
    setSelectedFlow(newF);
  };

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBcName || !newBcContent) return;
    await createBroadcast.mutateAsync({
      name: newBcName,
      message_content: newBcContent
    });
    setNewBcName("");
    setNewBcContent("");
    setOpenNewBroadcast(false);
  };

  const handleCreateSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeqName || !newSeqFlowId) return;
    await createSequence.mutateAsync({
      name: newSeqName,
      delay_value: Number(newSeqDelay),
      delay_unit: newSeqUnit,
      trigger_flow_id: newSeqFlowId
    });
    setNewSeqName("");
    setNewSeqDelay(1);
    setNewSeqFlowId("");
    setOpenNewSequence(false);
  };

  const handleCreateRefLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefName || !newRefCode || !newRefFlowId) return;
    await createRefLink.mutateAsync({
      name: newRefName,
      ref_code: newRefCode.trim().toLowerCase(),
      trigger_flow_id: newRefFlowId
    });
    setNewRefName("");
    setNewRefCode("");
    setNewRefFlowId("");
    setOpenNewRef(false);
  };

  // Simulated Messaging Run
  const handleTriggerSimulate = (keyword?: string) => {
    if (!selectedFlow) return;
    const kw = keyword || (selectedFlow.trigger_keywords[0] || "bắt đầu");
    
    // Add user bubble
    const userMsg = { sender: "user" as const, text: kw };
    
    // Add bot bubble with buttons
    const botMsg = { 
      sender: "bot" as const, 
      text: selectedFlow.message_content,
      buttons: selectedFlow.buttons 
    };

    setSimMessages([userMsg, botMsg]);
  };

  const handleSimButtonClick = (btn: BotcakeButton) => {
    if (btn.type === "url") {
      alert(`Mở trình duyệt chuyển tiếp tới: ${btn.value}`);
    } else if (btn.type === "call") {
      alert(`Bắt đầu thực hiện cuộc gọi Hotline: ${btn.value}`);
    } else if (btn.type === "flow") {
      // Find the referenced flow and show its message in simulation
      const flow = flows.find(f => f.id === btn.value);
      if (flow) {
        setSimMessages(prev => [
          ...prev,
          { sender: "user", text: `[Bấm nút: ${btn.label}]` },
          { sender: "bot", text: flow.message_content, buttons: flow.buttons }
        ]);
      } else {
        alert(`Không tìm thấy kịch bản được liên kết: ${btn.value}`);
      }
    }
  };

  const handleAddButton = () => {
    const newBtn: BotcakeButton = {
      id: `btn-${Date.now()}`,
      label: "Nút bấm mới",
      type: "url",
      value: "https://pancake.vn"
    };
    setEditedButtons([...editedButtons, newBtn]);
  };

  const handleRemoveButton = (btnId: string) => {
    setEditedButtons(editedButtons.filter(b => b.id !== btnId));
  };

  const handleUpdateButton = (btnId: string, fields: Partial<BotcakeButton>) => {
    setEditedButtons(editedButtons.map(b => b.id === btnId ? { ...b, ...fields } : b));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Title */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-6 w-6 text-indigo-500" /> Botcake Chatbot Đa kênh (Facebook/Instagram/TikTok)
          </h1>
          <p className="text-xs text-muted-foreground">Tự động hóa kịch bản nhắn tin chăm sóc khách hàng và tiếp thị đa nền tảng</p>
        </div>
        <div className="flex gap-2 bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-full border border-green-200 text-green-700 font-bold text-[10px] items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping mr-1" />
          Xưởng in Sticker TPHCM - Connected
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-5 w-full md:w-[650px] mb-4 bg-muted/50 p-1 rounded-xl text-xs">
          <TabsTrigger value="overview" className="gap-1"><BarChart2 className="h-3.5 w-3.5" /> Tổng quan</TabsTrigger>
          <TabsTrigger value="flows" className="gap-1"><MessageSquare className="h-3.5 w-3.5" /> Kịch bản</TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-1"><Send className="h-3.5 w-3.5" /> Gửi tin loạt</TabsTrigger>
          <TabsTrigger value="sequence" className="gap-1"><Zap className="h-3.5 w-3.5" /> Chuỗi gửi</TabsTrigger>
          <TabsTrigger value="reflinks" className="gap-1"><Link className="h-3.5 w-3.5" /> Ref Links</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border border-border/80 shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Tổng Subscribers</div>
                  <div className="text-lg font-bold text-foreground">3,480</div>
                  <p className="text-[9px] text-green-600 font-bold flex items-center gap-0.5">+12.4% so với tuần trước</p>
                </div>
                <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-500">
                  <Users className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Subscribers Hoạt động (24h)</div>
                  <div className="text-lg font-bold text-foreground">1,290</div>
                  <p className="text-[9px] text-indigo-600 font-bold flex items-center gap-0.5">Tỷ lệ tương tác: 37.1%</p>
                </div>
                <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-500">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Tin nhắn đã gửi (24h)</div>
                  <div className="text-lg font-bold text-foreground">24,500</div>
                  <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">Giao dịch thành công: 99.8%</p>
                </div>
                <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/40 rounded-xl flex items-center justify-center text-amber-500">
                  <Zap className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Chart */}
            <Card className="col-span-2 border border-border/80 shadow-md">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1">
                  <BarChart2 className="h-4 w-4 text-indigo-500" /> Tăng trưởng Khách hàng & Tần suất tin nhắn hàng tuần
                </CardTitle>
                <CardDescription className="text-[10px]">Thống kê lượng người đăng ký mới (Subscribers) và số tin nhắn tự động được phản hồi</CardDescription>
              </CardHeader>
              <CardContent className="p-2 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData}>
                    <defs>
                      <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/40" />
                    <XAxis dataKey="day" className="text-[10px] fill-muted-foreground" />
                    <YAxis className="text-[10px] fill-muted-foreground" />
                    <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "12px" }} />
                    <Area type="monotone" dataKey="newSub" name="Đăng ký mới" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSub)" />
                    <Area type="monotone" dataKey="sentMsg" name="Tin nhắn gửi đi" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMsg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quick settings card */}
            <Card className="border border-border/80 shadow-md">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Settings className="h-4 w-4 text-emerald-500" /> Cài đặt chung Botcake
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="space-y-1">
                  <Label className="font-semibold text-muted-foreground">Kênh hoạt động</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-blue-600 text-white border-none font-bold uppercase text-[8px]">Facebook</Badge>
                    <Badge className="bg-pink-600 text-white border-none font-bold uppercase text-[8px]">Instagram</Badge>
                    <Badge className="bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-none font-bold uppercase text-[8px] opacity-50">Zalo OA</Badge>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-foreground">
                    <span>Tự động khớp Liên hệ (Identity Resolution)</span>
                    <Badge className="bg-green-50 text-green-700 border-none font-bold">Bật</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Botcake tự động gộp khách hàng chat trùng SĐT vào CRM để đồng bộ.</p>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-foreground">
                    <span>Đồng bộ thẻ gắn (Tags Sync)</span>
                    <Badge className="bg-indigo-50 text-indigo-750 border-none font-bold">Bật</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Đồng bộ các tag như [VIP], [KH_SỈ] giữa Botcake và CRM để tiện lọc chiến dịch.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Flows & Keywords */}
        <TabsContent value="flows" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Flow selector & detail settings */}
            <div className="col-span-2 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-xs font-bold text-foreground">Quản lý kịch bản tin nhắn</h2>
                <Button size="sm" onClick={() => setOpenNewFlow(true)} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 shadow-sm">
                  <Plus className="h-3.5 w-3.5" /> Tạo kịch bản mới
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3 border rounded-xl overflow-hidden min-h-[450px]">
                {/* List Flows */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border-r p-3 space-y-2">
                  <div className="text-[9px] font-bold text-foreground uppercase tracking-widest mb-1">DANH SÁCH:</div>
                  {flows.map(f => (
                    <div
                      key={f.id}
                      onClick={() => handleSelectFlow(f)}
                      className={`p-2.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all border ${selectedFlow?.id === f.id ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20" : "bg-background hover:bg-secondary/20 text-muted-foreground"}`}
                    >
                      <div className="truncate">{f.name}</div>
                      {f.trigger_keywords.length > 0 && (
                        <div className="text-[8px] font-mono text-slate-400 mt-0.5 truncate">KW: {f.trigger_keywords.join(", ")}</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Edit Form */}
                {selectedFlow ? (
                  <div className="col-span-2 p-4 space-y-4 text-xs bg-background">
                    <div className="space-y-1">
                      <Label className="font-bold text-foreground">Tên kịch bản: <span className="text-muted-foreground font-semibold">{selectedFlow.name}</span></Label>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="triggerKeywords" className="font-semibold">Từ khóa kích hoạt (cách nhau bởi dấu phẩy):</Label>
                      <Input
                        id="triggerKeywords"
                        className="h-8 text-xs"
                        value={editedKeywords}
                        onChange={(e) => setEditedKeywords(e.target.value)}
                        placeholder="Ví dụ: hello, batdau, start"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="flowContent" className="font-semibold">Nội dung tin nhắn phản hồi (Văn bản):</Label>
                      <Textarea
                        id="flowContent"
                        className="min-h-[100px] text-xs"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        placeholder="Chào bạn..."
                      />
                    </div>

                    {/* Edit Buttons */}
                    <div className="space-y-3 border-t pt-3">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-foreground">Nút bấm đính kèm (Tối đa 3 nút):</Label>
                        {editedButtons.length < 3 && (
                          <Button size="sm" variant="outline" onClick={handleAddButton} className="h-6 text-[9px] font-semibold border-indigo-200 text-indigo-650 hover:bg-indigo-50 gap-0.5">
                            <Plus className="h-3 w-3" /> Thêm nút
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        {editedButtons.map((btn, bIdx) => (
                          <div key={btn.id} className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/40 space-y-2 relative">
                            <button
                              type="button"
                              onClick={() => handleRemoveButton(btn.id)}
                              className="absolute top-2 right-2 text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-0.5">
                                <Label className="text-[10px] font-semibold">Tên nhãn nút</Label>
                                <Input
                                  className="h-7 text-[10px]"
                                  value={btn.label}
                                  onChange={(e) => handleUpdateButton(btn.id, { label: e.target.value })}
                                />
                              </div>
                              <div className="space-y-0.5">
                                <Label className="text-[10px] font-semibold">Hành động nút</Label>
                                <Select
                                  value={btn.type}
                                  onValueChange={(val: any) => handleUpdateButton(btn.id, { type: val, value: "" })}
                                >
                                  <SelectTrigger className="h-7 text-[10px] bg-background">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-popover text-foreground text-[10px]">
                                    <SelectItem value="url">Mở liên kết URL</SelectItem>
                                    <SelectItem value="call">Gọi số Hotline</SelectItem>
                                    <SelectItem value="flow">Kích hoạt Kịch bản</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <Label className="text-[10px] font-semibold">Giá trị thực thi</Label>
                              {btn.type === "flow" ? (
                                <Select
                                  value={btn.value}
                                  onValueChange={(val) => handleUpdateButton(btn.id, { value: val })}
                                >
                                  <SelectTrigger className="h-7 text-[10px] bg-background">
                                    <SelectValue placeholder="Chọn kịch bản..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-popover text-foreground text-[10px]">
                                    {flows.filter(f => f.id !== selectedFlow.id).map(f => (
                                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  className="h-7 text-[10px]"
                                  value={btn.value}
                                  onChange={(e) => handleUpdateButton(btn.id, { value: e.target.value })}
                                  placeholder={btn.type === "call" ? "Ví dụ: 19001234" : "Ví dụ: https://pancake.vn"}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end border-t pt-3">
                      <Button size="sm" variant="outline" onClick={() => handleTriggerSimulate()} className="h-8 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center gap-1 shadow-sm">
                        <Play className="h-3.5 w-3.5 fill-rose-600" /> Chạy thử giả lập
                      </Button>
                      <Button size="sm" onClick={handleSaveFlow} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white flex items-center gap-1 shadow-sm">
                        Lưu kịch bản
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="col-span-2 flex items-center justify-center text-muted-foreground italic text-xs">
                    Vui lòng chọn hoặc tạo mới một kịch bản ở danh sách bên trái.
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Simulator mockup */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-foreground flex items-center gap-1">
                <Smartphone className="h-4.5 w-4.5 text-indigo-500" /> Giả lập hiển thị tin nhắn (Simulator)
              </h2>

              <Card className="w-full bg-slate-950 border-8 border-slate-900 rounded-[32px] overflow-hidden text-slate-100 shadow-2xl relative">
                {/* Header phone bar */}
                <div className="bg-slate-900 p-3 pb-2 border-b border-slate-800 text-center relative flex items-center justify-center">
                  <div className="w-16 h-4 bg-black rounded-full absolute top-1" />
                  <div className="text-[10px] font-bold text-slate-200 mt-2">Botcake Simulator</div>
                </div>

                <CardContent className="p-3 h-[380px] overflow-y-auto flex flex-col justify-between space-y-4">
                  {/* Chat bubbles area */}
                  <div className="space-y-3 flex-grow overflow-y-auto">
                    {simMessages.map((msg, mIdx) => (
                      <div key={mIdx} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                        <div className={`p-2.5 rounded-2xl text-[10px] font-semibold max-w-[85%] ${msg.sender === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-100 rounded-tl-none"}`}>
                          {msg.text.split('\n').map((line, lIdx) => <p key={lIdx}>{line}</p>)}
                        </div>

                        {/* Render inline buttons for bot messages */}
                        {msg.sender === "bot" && msg.buttons && msg.buttons.length > 0 && (
                          <div className="mt-1.5 space-y-1 w-full max-w-[85%]">
                            {msg.buttons.map((btn) => (
                              <Button
                                key={btn.id}
                                size="sm"
                                variant="outline"
                                onClick={() => handleSimButtonClick(btn)}
                                className="w-full h-7 text-[9px] font-bold border-indigo-500/30 bg-slate-900 hover:bg-indigo-950/20 text-indigo-400 hover:text-indigo-300 py-1"
                              >
                                {btn.type === "url" && <ExternalLink className="h-2.5 w-2.5 mr-1" />}
                                {btn.type === "call" && <Phone className="h-2.5 w-2.5 mr-1" />}
                                {btn.type === "flow" && <RefreshCw className="h-2.5 w-2.5 mr-1" />}
                                {btn.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {simMessages.length === 0 && (
                      <div className="text-center py-20 text-[10px] text-slate-500 italic">
                        Bấm nút "Chạy thử giả lập" bên cạnh để bắt đầu thử kịch bản.
                      </div>
                    )}
                  </div>

                  {/* Input suggestion */}
                  <div className="border-t border-slate-800 pt-2 flex gap-1.5">
                    <Input
                      readOnly
                      placeholder="Bấm nút kịch bản để tương tác..."
                      className="h-7 text-[9px] bg-slate-900 border-slate-800 text-slate-300"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Broadcast (Gửi tin hàng loạt) */}
        <TabsContent value="broadcast" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-xs font-bold text-foreground">Chiến dịch gửi tin hàng loạt (Broadcast)</h2>
            <Button size="sm" onClick={() => setOpenNewBroadcast(true)} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 shadow-sm">
              <Plus className="h-3.5 w-3.5" /> Tạo chiến dịch mới
            </Button>
          </div>

          <Card className="border border-border/80 shadow-md">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground text-left">
                    <th className="p-3 font-semibold">Tên chiến dịch</th>
                    <th className="p-3 font-semibold">Nội dung tin nhắn</th>
                    <th className="p-3 font-semibold">Trạng thái</th>
                    <th className="p-3 font-semibold">Số tin gửi</th>
                    <th className="p-3 font-semibold">Tỷ lệ nhận thành công</th>
                    <th className="p-3 font-semibold text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {broadcasts.map((bc) => (
                    <tr key={bc.id} className="border-b hover:bg-secondary/15 transition-colors">
                      <td className="p-3 font-bold text-foreground">{bc.name}</td>
                      <td className="p-3 max-w-[250px] truncate text-muted-foreground italic">"{bc.message_content}"</td>
                      <td className="p-3">
                        {bc.status === "sent" ? (
                          <Badge className="bg-green-50 text-green-700 border-none font-bold rounded-full">Đã gửi thành công</Badge>
                        ) : bc.status === "scheduled" ? (
                          <Badge className="bg-blue-50 text-blue-700 border-none font-bold rounded-full">Đã hẹn lịch</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700 border-none font-bold rounded-full">Bản nháp</Badge>
                        )}
                      </td>
                      <td className="p-3 font-bold">{bc.sent_count > 0 ? bc.sent_count.toLocaleString("vi-VN") : "-"}</td>
                      <td className="p-3 font-semibold text-emerald-600">{bc.delivery_rate > 0 ? `${bc.delivery_rate}%` : "-"}</td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1.5">
                          {bc.status !== "sent" && (
                            <Button
                              size="sm"
                              onClick={() => sendBroadcast.mutateAsync(bc.id)}
                              className="h-7 text-[10px] font-bold bg-indigo-650 hover:bg-indigo-750 text-white flex items-center gap-1"
                            >
                              <Send className="h-3 w-3" /> Gửi tin ngay
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {broadcasts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                        Chưa có chiến dịch gửi tin nào được ghi nhận.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Sequence (Chuỗi gửi tin tự động) */}
        <TabsContent value="sequence" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-xs font-bold text-foreground">Chuỗi tin nhắn chăm sóc tự động (Sequence)</h2>
            <Button size="sm" onClick={() => setOpenNewSequence(true)} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 shadow-sm">
              <Plus className="h-3.5 w-3.5" /> Tạo chuỗi chăm sóc mới
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {sequences.map((seq) => {
              const linkedFlow = flows.find(f => f.id === seq.trigger_flow_id);
              return (
                <Card key={seq.id} className="border border-border/80 shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h3 className="font-bold text-xs text-foreground">{seq.name}</h3>
                        <p className="text-[10px] text-muted-foreground">Khởi tạo: {new Date(seq.created_at).toLocaleDateString("vi-VN")}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleSequence.mutateAsync(seq.id)}
                        className={`h-7 text-[10px] font-bold flex items-center gap-1 border-none ${seq.is_active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        <ToggleLeft className={`h-4 w-4 ${seq.is_active ? "rotate-180 text-emerald-600" : ""}`} />
                        {seq.is_active ? "Đang hoạt động" : "Đã tạm dừng"}
                      </Button>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border space-y-2 text-xs">
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                        <span>Thời gian trễ:</span>
                        <span className="text-indigo-600">Gửi sau {seq.delay_value} {seq.delay_unit === "hours" ? "giờ" : "ngày"}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                        <span>Kịch bản kích hoạt:</span>
                        <span className="text-foreground">{linkedFlow ? linkedFlow.name : "Kịch bản đã xóa"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {sequences.length === 0 && (
              <div className="col-span-2 border border-dashed border-border/80 py-16 text-center text-xs text-muted-foreground italic rounded-xl">
                Chưa có chuỗi chăm sóc tự động nào.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Ref Links (Mã tăng trưởng) */}
        <TabsContent value="reflinks" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-xs font-bold text-foreground">Đường dẫn tăng trưởng khách hàng (Ref Links)</h2>
            <Button size="sm" onClick={() => setOpenNewRef(true)} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 shadow-sm">
              <Plus className="h-3.5 w-3.5" /> Tạo mã Ref mới
            </Button>
          </div>

          <Card className="border border-border/80 shadow-md">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground text-left">
                    <th className="p-3 font-semibold">Tên liên kết</th>
                    <th className="p-3 font-semibold">Mã code ref</th>
                    <th className="p-3 font-semibold">Đường dẫn Messenger (Ref URL)</th>
                    <th className="p-3 font-semibold">Kịch bản kích hoạt</th>
                    <th className="p-3 font-semibold">Số lượt click</th>
                    <th className="p-3 font-semibold text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {refLinks.map((ref) => {
                    const flow = flows.find(f => f.id === ref.trigger_flow_id);
                    return (
                      <tr key={ref.id} className="border-b hover:bg-secondary/15 transition-colors">
                        <td className="p-3 font-bold text-foreground">{ref.name}</td>
                        <td className="p-3 font-mono text-indigo-600 font-bold">{ref.ref_code}</td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground max-w-[200px] truncate select-all">
                          https://m.me/stickershop?ref={ref.ref_code}
                        </td>
                        <td className="p-3 font-semibold">{flow ? flow.name : "Kịch bản đã xóa"}</td>
                        <td className="p-3 font-bold text-indigo-650">{ref.click_count.toLocaleString("vi-VN")} click</td>
                        <td className="p-3">
                          <Badge className="bg-green-50 text-green-700 border-none font-bold rounded-full">Đang mở</Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {refLinks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                        Chưa cấu hình mã Ref Link tăng trưởng nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Create Flow */}
      <Dialog open={openNewFlow} onOpenChange={setOpenNewFlow}>
        <DialogContent className="sm:max-w-[400px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Plus className="h-4.5 w-4.5 text-indigo-500" /> Tạo Kịch bản chatbot mới
            </DialogTitle>
            <DialogDescription className="text-xs">Nhập tên kịch bản mới. Bạn có thể thiết lập các nút bấm và từ khóa kích hoạt sau.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateFlow} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="flowName" className="font-semibold">Tên kịch bản *</Label>
              <Input
                id="flowName"
                className="h-8"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                placeholder="Ví dụ: Báo giá sỉ thiết kế"
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpenNewFlow(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">Tạo ngay</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Create Broadcast */}
      <Dialog open={openNewBroadcast} onOpenChange={setOpenNewBroadcast}>
        <DialogContent className="sm:max-w-[420px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Send className="h-4.5 w-4.5 text-indigo-500" /> Tạo Chiến dịch gửi tin loạt mới
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateBroadcast} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="bcName" className="font-semibold">Tên chiến dịch *</Label>
              <Input
                id="bcName"
                className="h-8"
                value={newBcName}
                onChange={(e) => setNewBcName(e.target.value)}
                placeholder="Ví dụ: Quảng bá chương trình Noel 2026"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="bcContent" className="font-semibold">Nội dung tin nhắn tiếp thị gửi hàng loạt *</Label>
              <Textarea
                id="bcContent"
                className="min-h-[120px]"
                value={newBcContent}
                onChange={(e) => setNewBcContent(e.target.value)}
                placeholder="Nhập nội dung quảng bá..."
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpenNewBroadcast(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">Tạo chiến dịch</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Create Sequence */}
      <Dialog open={openNewSequence} onOpenChange={setOpenNewSequence}>
        <DialogContent className="sm:max-w-[420px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Zap className="h-4.5 w-4.5 text-indigo-500" /> Thêm Chuỗi chăm sóc tự động mới
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSequence} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="seqName" className="font-semibold">Tên chuỗi chăm sóc *</Label>
              <Input
                id="seqName"
                className="h-8"
                value={newSeqName}
                onChange={(e) => setNewSeqName(e.target.value)}
                placeholder="Ví dụ: Gửi khảo sát sau 24h"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="seqDelay" className="font-semibold">Thời gian chờ trễ *</Label>
                <Input
                  id="seqDelay"
                  type="number"
                  min="1"
                  className="h-8"
                  value={newSeqDelay}
                  onChange={(e) => setNewSeqDelay(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Đơn vị thời gian</Label>
                <Select
                  value={newSeqUnit}
                  onValueChange={(val: any) => setNewSeqUnit(val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-foreground">
                    <SelectItem value="hours">Giờ (Hours)</SelectItem>
                    <SelectItem value="days">Ngày (Days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold">Kịch bản kích hoạt *</Label>
              <Select
                value={newSeqFlowId}
                onValueChange={(val) => setNewSeqFlowId(val)}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Chọn kịch bản..." />
                </SelectTrigger>
                <SelectContent className="bg-popover text-foreground">
                  {flows.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpenNewSequence(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">Tạo chuỗi</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Create Ref Link */}
      <Dialog open={openNewRef} onOpenChange={setOpenNewRef}>
        <DialogContent className="sm:max-w-[420px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Link className="h-4.5 w-4.5 text-indigo-500" /> Tạo Mã Ref Link tăng trưởng mới
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateRefLink} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="refName" className="font-semibold">Tên liên kết ref *</Label>
              <Input
                id="refName"
                className="h-8"
                value={newRefName}
                onChange={(e) => setNewRefName(e.target.value)}
                placeholder="Ví dụ: Link đặt Sticker trên Bio Tiktok"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="refCode" className="font-semibold">Mã code ref (chỉ chữ thường & gạch dưới) *</Label>
              <Input
                id="refCode"
                className="h-8 font-mono"
                value={newRefCode}
                onChange={(e) => setNewRefCode(e.target.value)}
                placeholder="Ví dụ: tiktok_coupon_10"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="font-semibold">Kịch bản khi mở link *</Label>
              <Select
                value={newRefFlowId}
                onValueChange={(val) => setNewRefFlowId(val)}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Chọn kịch bản..." />
                </SelectTrigger>
                <SelectContent className="bg-popover text-foreground">
                  {flows.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpenNewRef(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">Tạo mã Ref</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
