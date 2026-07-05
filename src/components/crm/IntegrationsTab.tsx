import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Key, Link2, Plus, Trash2, Send, Server, Play, Building, Sparkles, AlertCircle, Smartphone, Facebook, Sliders, ToggleLeft } from "lucide-react";

interface IntegrationsTabProps {
  apiKeys: any[];
  createApiKey: any;
  deleteApiKey: any;
  simulateWebhookIngest: any;
  
  // POS & Chat settings
  posChatSettings: any;
  updatePosChatSettings: any;

  // Lead Forms
  leadForms: any[];
  createLeadForm: any;
  updateLeadFormMappings: any;

  // Automation Rules
  automationRules: any[];
  createAutomationRule: any;
  toggleAutomationRule: any;

  // Lead create trigger (for simulator)
  createLead: any;
}

export function IntegrationsTab({
  apiKeys,
  createApiKey,
  deleteApiKey,
  simulateWebhookIngest,
  posChatSettings,
  updatePosChatSettings,
  leadForms,
  createLeadForm,
  updateLeadFormMappings,
  automationRules,
  createAutomationRule,
  toggleAutomationRule,
  createLead
}: IntegrationsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"api_webhooks" | "pos_chat" | "lead_forms" | "automation">("api_webhooks");

  // State management
  const [keyName, setKeyName] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  
  // Simulator Forms
  const [simName, setSimName] = useState("");
  const [simPhone, setSimPhone] = useState("");
  const [simEmail, setSimEmail] = useState("");
  const [simNotes, setSimNotes] = useState("");
  const [webhookLog, setWebhookLog] = useState<string[]>([]);

  // Dialogs
  const [openNewKey, setOpenNewKey] = useState(false);
  const [openNewForm, setOpenNewForm] = useState(false);
  const [openMapping, setOpenMapping] = useState(false);
  const [openNewRule, setOpenNewRule] = useState(false);

  // Mappings Temp State
  const [selectedFormForMap, setSelectedFormForMap] = useState<any | null>(null);
  const [mapNameField, setMapNameField] = useState("full_name");
  const [mapPhoneField, setMapPhoneField] = useState("phone_number");
  const [mapEmailField, setMapEmailField] = useState("email");
  const [mapNotesField, setMapNotesField] = useState("notes");

  // Mock Form Form State
  const [newFormName, setNewFormName] = useState("");
  const [newFormPlatform, setNewFormPlatform] = useState<"facebook" | "tiktok">("facebook");

  // Mobile Mock Phone State (For Lead Ads Simulator)
  const [selectedSimFormId, setSelectedSimFormId] = useState("");
  const [simFormInputs, setSimFormInputs] = useState<Record<string, string>>({});
  const [adFormSubmitted, setAdFormSubmitted] = useState(false);

  // New Rule State
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleTaskTitle, setNewRuleTaskTitle] = useState("");
  const [newRuleTaskDue, setNewRuleTaskDue] = useState("24");

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;
    await createApiKey.mutateAsync(keyName);
    setKeyName("");
    setOpenNewKey(false);
  };

  const handleSimulateWebhook = async () => {
    if (!selectedKey || !simName || !simPhone) {
      toastLog("Lỗi: Vui lòng điền đủ Họ tên, SĐT và chọn API Key!");
      return;
    }
    toastLog(`>> Khởi tạo request POST /api/v1/leads/ingest...`);
    try {
      const res = await simulateWebhookIngest.mutateAsync({
        apiKey: selectedKey,
        name: simName,
        phone: simPhone,
        email: simEmail,
        notes: simNotes
      });
      toastLog(`<< Phản hồi 200 OK từ server! Đã tạo Lead ID: ${res.id}`);
      setSimName("");
      setSimPhone("");
      setSimEmail("");
      setSimNotes("");
    } catch (err: any) {
      toastLog(`<< LỖI 400 Bad Request: ${err.message}`);
    }
  };

  const toastLog = (msg: string) => {
    setWebhookLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Lead Forms Actions
  const handleCreateFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormName) return;
    await createLeadForm.mutateAsync({
      form_name: newFormName,
      platform: newFormPlatform,
      is_active: true,
      field_mappings: newFormPlatform === "facebook" 
        ? { "full_name": "name", "phone_number": "phone", "email": "email", "notes": "notes" }
        : { "name": "name", "phone": "phone", "need": "notes" }
    });
    setNewFormName("");
    setOpenNewForm(false);
  };

  const handleOpenMappingDialog = (form: any) => {
    setSelectedFormForMap(form);
    const m = form.field_mappings || {};
    // Extract key mapping name
    const nameKey = Object.keys(m).find(k => m[k] === "name") || "full_name";
    const phoneKey = Object.keys(m).find(k => m[k] === "phone") || "phone_number";
    const emailKey = Object.keys(m).find(k => m[k] === "email") || "email";
    const notesKey = Object.keys(m).find(k => m[k] === "notes") || "notes";
    setMapNameField(nameKey);
    setMapPhoneField(phoneKey);
    setMapEmailField(emailKey);
    setMapNotesField(notesKey);
    setOpenMapping(true);
  };

  const handleSaveMappings = async () => {
    if (!selectedFormForMap) return;
    const mappings: Record<string, string> = {
      [mapNameField]: "name",
      [mapPhoneField]: "phone",
      [mapEmailField]: "email",
      [mapNotesField]: "notes"
    };
    await updateLeadFormMappings.mutateAsync({ id: selectedFormForMap.id, mappings });
    setOpenMapping(false);
  };

  // Run mobile simulation
  const handleMobileSubmit = async () => {
    const matchedForm = leadForms.find(f => f.id === selectedSimFormId);
    if (!matchedForm) return;

    // Apply mapping to construct Lead payload
    const payload: Record<string, any> = { source: matchedForm.platform };
    const mappings = matchedForm.field_mappings;
    
    Object.entries(mappings).forEach(([externalKey, leadField]) => {
      payload[leadField as string] = simFormInputs[externalKey] || null;
    });

    if (!payload.name || !payload.phone) {
      alert("Vui lòng nhập Họ tên và Số điện thoại trên mẫu Instant Form!");
      return;
    }

    await createLead.mutateAsync({
      name: payload.name,
      phone: payload.phone,
      email: payload.email || null,
      notes: payload.notes || `Nhận tự động từ Ads Lead Form: ${matchedForm.form_name}`,
      source: matchedForm.platform,
      status: "new"
    });

    setAdFormSubmitted(true);
    setTimeout(() => {
      setAdFormSubmitted(false);
      setSimFormInputs({});
    }, 3000);
  };

  // Rule creation
  const handleCreateRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName || !newRuleTaskTitle) return;
    await createAutomationRule.mutateAsync({
      rule_name: newRuleName,
      trigger_event: "on_create",
      conditions: {},
      actions: {
        type: "create_task",
        title: newRuleTaskTitle,
        due_in_hours: Number(newRuleTaskDue) || 24
      },
      is_active: true
    });
    setNewRuleName("");
    setNewRuleTaskTitle("");
    setOpenNewRule(false);
  };

  return (
    <div className="space-y-4">
      {/* Sub tabs list */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border flex-wrap gap-1">
        <button
          onClick={() => setActiveSubTab("api_webhooks")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTab === "api_webhooks" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Server className="h-3.5 w-3.5" /> API Keys & Webhooks
        </button>
        <button
          onClick={() => setActiveSubTab("pos_chat")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTab === "pos_chat" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Building className="h-3.5 w-3.5" /> Đồng bộ POS & Chat
        </button>
        <button
          onClick={() => setActiveSubTab("lead_forms")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTab === "lead_forms" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Smartphone className="h-3.5 w-3.5" /> Biểu mẫu Lead Ads
        </button>
        <button
          onClick={() => setActiveSubTab("automation")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTab === "automation" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Sparkles className="h-3.5 w-3.5" /> Quy trình Tự động hóa
        </button>
      </div>

      {/* Subtab 1: API Keys & Webhooks */}
      {activeSubTab === "api_webhooks" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* List keys */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border border-border/80 shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Key className="h-4.5 w-4.5 text-indigo-500" /> Danh sách khóa API Keys
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sử dụng các khóa API này để tích hợp gửi Lead tự động từ bên thứ 3 (như Ladipage, Webcake).
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setOpenNewKey(true)} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white shadow-sm">
                  <Plus className="h-3.5 w-3.5" /> Tạo Key
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/20 text-muted-foreground text-left">
                      <th className="p-3 font-semibold">Tên nhãn</th>
                      <th className="p-3 font-semibold">Khóa API (Token)</th>
                      <th className="p-3 font-semibold">Ngày tạo</th>
                      <th className="p-3 font-semibold text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((k) => (
                      <tr key={k.id} className="border-b hover:bg-secondary/5">
                        <td className="p-3 font-bold text-foreground">{k.key_name}</td>
                        <td className="p-3 font-mono text-[10px] text-muted-foreground select-all bg-secondary/20 rounded px-1">{k.api_key}</td>
                        <td className="p-3 text-[10px] text-muted-foreground">{new Date(k.created_at).toLocaleDateString("vi-VN")}</td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteApiKey.mutate(k.id)}
                            className="h-6 w-6 p-0 hover:bg-rose-50 hover:text-rose-600 rounded text-muted-foreground"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {apiKeys.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                          Chưa có khóa API nào. Vui lòng bấm tạo mới!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="border border-border/80 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Link2 className="h-4.5 w-4.5 text-emerald-500" /> Tài liệu tích hợp HTTP Webhook API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 leading-relaxed text-xs">
                <p>Hệ thống hỗ trợ cơ chế nhận Lead tự động (Webhook) bằng phương thức gửi HTTP POST tiêu chuẩn:</p>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[10px] space-y-1.5">
                  <div><span className="text-pink-400">POST</span> /api/v1/leads/ingest</div>
                  <div>Headers: <span className="text-emerald-400">"Authorization": "Bearer &lt;YOUR_API_KEY&gt;"</span></div>
                  <div>Payload JSON:</div>
                  <pre className="text-amber-300">
{`{
  "name": "Nguyễn Thị Thảo",
  "phone": "0987654321",
  "email": "thao@gmail.com",
  "notes": "Quan tâm gói sỉ 100 cái"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Webhook Simulator */}
          <div className="lg:col-span-5">
            <Card className="border border-border/80 shadow-md h-full flex flex-col">
              <CardHeader className="pb-3 bg-indigo-50/20 dark:bg-indigo-950/10 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Play className="h-4.5 w-4.5 text-indigo-500" /> Bộ giả lập bắn Webhook LadiPage (Mock Simulator)
                </CardTitle>
                <CardDescription className="text-xs">
                  Điền form dưới đây để gửi thử dữ liệu lên server webhook và chứng kiến dữ liệu tự động đồng bộ sang tab Leads.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="font-semibold text-[10px]">Chọn API Key để ký xác thực *</Label>
                    <Select value={selectedKey} onValueChange={setSelectedKey}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Chọn API Key..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-foreground">
                        {apiKeys.map((k) => (
                          <SelectItem key={k.id} value={k.api_key}>{k.key_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="font-semibold text-[10px]">Họ tên khách hàng *</Label>
                      <Input className="h-8 text-xs" value={simName} onChange={(e) => setSimName(e.target.value)} placeholder="Nguyễn Khách" />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-semibold text-[10px]">Số điện thoại *</Label>
                      <Input className="h-8 text-xs" value={simPhone} onChange={(e) => setSimPhone(e.target.value)} placeholder="0901234567" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-[10px]">Email khách hàng</Label>
                    <Input className="h-8 text-xs" value={simEmail} onChange={(e) => setSimEmail(e.target.value)} placeholder="khach@example.com" />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-[10px]">Ghi chú/Nhu cầu</Label>
                    <Input className="h-8 text-xs" value={simNotes} onChange={(e) => setSimNotes(e.target.value)} placeholder="Nhu cầu khách hàng..." />
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <Button onClick={handleSimulateWebhook} className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-bold h-8 text-xs gap-1.5 shadow-sm">
                    <Send className="h-3.5 w-3.5" /> Gửi mô phỏng Webhook
                  </Button>

                  <div className="border rounded-xl p-2.5 bg-slate-950 text-slate-200 font-mono text-[9px] h-[120px] overflow-y-auto space-y-1">
                    <div className="text-[10px] font-bold border-b pb-1 mb-1 text-slate-400">SERVER CONSOLE LOGS:</div>
                    {webhookLog.map((log, idx) => (
                      <div key={idx} className="leading-tight">{log}</div>
                    ))}
                    {webhookLog.length === 0 && <div className="text-slate-500 italic">Console trống. Hãy bắn thử webhook...</div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Subtab 2: POS & Chat Sync Settings */}
      {activeSubTab === "pos_chat" && (
        <Card className="border border-border/80 shadow-md">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Building className="h-4.5 w-4.5 text-indigo-500" /> Đồng bộ hóa Pancake POS & Chat
            </CardTitle>
            <CardDescription className="text-xs">
              Thiết lập quy tắc đồng bộ dữ liệu tự động từ phần mềm quản lý Pancake POS và các hội thoại chat.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            {/* POS Integration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/40">
                <div className="space-y-0.5">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    Đồng bộ dữ liệu giao dịch từ Pancake POS
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Đồng bộ số đơn hàng, doanh thu chi tiêu của khách hàng từ POS về CRM.
                  </div>
                </div>
                <Switch
                  checked={posChatSettings.is_pos_sync_enabled}
                  onCheckedChange={(val) => updatePosChatSettings.mutateAsync({ is_pos_sync_enabled: val })}
                />
              </div>

              {posChatSettings.is_pos_sync_enabled && (
                <div className="p-3 border border-amber-200 bg-amber-50/50 rounded-xl text-[10px] text-amber-700 font-semibold flex gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  <div>
                    Lưu ý quan trọng: Phân hệ Bán hàng (Sales) nội bộ của CRM sẽ tạm thời bị vô hiệu hóa khi bật đồng bộ POS. Toàn bộ thông số giao dịch tài chính của khách hàng sẽ được tính toán trực tiếp từ nguồn POS của bạn.
                  </div>
                </div>
              )}
            </div>

            {/* Chat Integration */}
            <div className="space-y-4 border-t pt-5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-foreground">Đồng bộ hội thoại Pancake Chat</div>
                  <div className="text-[10px] text-muted-foreground">Tự động tạo Leads và liên hệ trực tiếp từ tin nhắn của Fanpage/Zalo.</div>
                </div>
                <Switch
                  checked={posChatSettings.is_chat_sync_enabled}
                  onCheckedChange={(val) => updatePosChatSettings.mutateAsync({ is_chat_sync_enabled: val })}
                />
              </div>

              {posChatSettings.is_chat_sync_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-xl bg-card">
                  <div className="space-y-1">
                    <Label className="font-semibold text-[10px]">Tự động tạo Lead tiềm năng khi:</Label>
                    <Select
                      value={posChatSettings.auto_create_lead_on}
                      onValueChange={(val: any) => updatePosChatSettings.mutateAsync({ auto_create_lead_on: val })}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-foreground">
                        <SelectItem value="first_msg">Khách nhắn tin lần đầu</SelectItem>
                        <SelectItem value="has_phone">Khách cung cấp Số điện thoại</SelectItem>
                        <SelectItem value="both">Khách nhắn tin hoặc gửi SĐT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-[10px]">Quy tắc cập nhật Số điện thoại:</Label>
                    <Select
                      value={posChatSettings.phone_update_rule}
                      onValueChange={(val: any) => updatePosChatSettings.mutateAsync({ phone_update_rule: val })}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-foreground">
                        <SelectItem value="keep_first">Lấy số đầu tiên khách cung cấp</SelectItem>
                        <SelectItem value="keep_latest">Cập nhật số mới nhất khách để lại</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t md:col-span-2 mt-2">
                    <div className="space-y-0.5">
                      <div className="font-bold text-[11px]">Đồng bộ Thẻ hội thoại (Pancake Tags)</div>
                      <div className="text-[9px] text-muted-foreground">Tự động đẩy các nhãn gắn trên Pancake Chat sang nhãn quản lý CRM.</div>
                    </div>
                    <Switch
                      checked={posChatSettings.sync_tags_enabled}
                      onCheckedChange={(val) => updatePosChatSettings.mutateAsync({ sync_tags_enabled: val })}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-t md:col-span-2">
                    <div className="space-y-0.5">
                      <div className="font-bold text-[11px]">Đồng bộ Nhân viên xử lý (Assigned Agent Sync)</div>
                      <div className="text-[9px] text-muted-foreground">Thay đổi người phụ trách 2 chiều tự động giữa Pancake Chat và CRM.</div>
                    </div>
                    <Switch
                      checked={posChatSettings.sync_agents_enabled}
                      onCheckedChange={(val) => updatePosChatSettings.mutateAsync({ sync_agents_enabled: val })}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subtab 3: Biểu mẫu Lead Ads (Facebook & TikTok) */}
      {activeSubTab === "lead_forms" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Forms Management */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border border-border/80 shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Smartphone className="h-4.5 w-4.5 text-indigo-500" /> Tích hợp Lead Ads Forms
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Kết nối và cấu hình biểu mẫu thu thập thông tin khách hàng từ chiến dịch quảng cáo.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setOpenNewForm(true)} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white shadow-sm">
                  <Plus className="h-3.5 w-3.5" /> Đồng bộ Form mới
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/20 text-muted-foreground text-left">
                      <th className="p-3 font-semibold">Tên biểu mẫu</th>
                      <th className="p-3 font-semibold">Nền tảng quảng cáo</th>
                      <th className="p-3 font-semibold">Cấu hình Ánh xạ</th>
                      <th className="p-3 font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadForms.map((form) => (
                      <tr key={form.id} className="border-b hover:bg-secondary/5">
                        <td className="p-3 font-bold text-foreground">{form.form_name}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[9px] font-bold border-none px-2 py-0.5 rounded-full ${form.platform === 'facebook' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-800'}`}>
                            {form.platform.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenMappingDialog(form)}
                            className="h-7 text-[10px] font-semibold border-indigo-200 text-indigo-650 bg-indigo-50/30 hover:bg-indigo-50"
                          >
                            <Sliders className="h-3 w-3 mr-1" /> Ghép trường
                          </Button>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[9px] font-bold border-none px-2 py-0.5 rounded-full ${form.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {form.is_active ? "KÍCH HOẠT" : "ĐÃ TẮT"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {leadForms.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                          Chưa đồng bộ biểu mẫu quảng cáo nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Mobile Phone Simulator for Lead Ads */}
          <div className="lg:col-span-5">
            <Card className="border border-border/80 shadow-md">
              <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-900/10 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Smartphone className="h-4.5 w-4.5 text-indigo-500" /> Mobile Mock Phone Lead Simulator
                </CardTitle>
                <CardDescription className="text-xs">
                  Mô phỏng trải nghiệm người dùng điền biểu mẫu trực tiếp trên bài đăng quảng cáo điện thoại.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center">
                {/* Select Form to simulate */}
                <div className="w-full space-y-1 mb-5">
                  <Label className="font-semibold text-[10px]">Chọn biểu mẫu chạy quảng cáo giả lập:</Label>
                  <Select value={selectedSimFormId} onValueChange={(val) => { setSelectedSimFormId(val); setSimFormInputs({}); }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Chọn biểu mẫu..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-foreground">
                      {leadForms.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.form_name} ({f.platform.toUpperCase()})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Simulated Phone Container */}
                {selectedSimFormId ? (
                  <div className="w-[280px] h-[500px] border-8 border-slate-900 rounded-[36px] bg-slate-950 relative shadow-2xl flex flex-col overflow-hidden">
                    {/* Speaker and Camera notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-10 flex items-center justify-center">
                      <div className="w-12 h-1 bg-slate-800 rounded-full mb-1"></div>
                    </div>

                    {/* App Content */}
                    <div className="flex-1 flex flex-col p-4 pt-8 bg-slate-900 text-slate-100 text-left justify-between overflow-y-auto">
                      <div className="space-y-4">
                        {/* Meta header style */}
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                          <Facebook className="h-5 w-5 text-blue-500 shrink-0" />
                          <div className="leading-tight">
                            <div className="text-[10px] font-bold">Facebook Ads Sponsored</div>
                            <div className="text-[8px] text-slate-400">Instant Form Lead Generation</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-bold text-white">Đăng ký nhận báo giá sỉ & ưu đãi Tết 2026</div>
                          <p className="text-[9px] text-slate-300">Vui lòng điền thông tin để nhân viên tư vấn gọi điện hỗ trợ bạn sớm nhất.</p>
                        </div>

                        {/* Generate Inputs based on mapped form fields */}
                        <div className="space-y-2.5">
                          {Object.keys(leadForms.find(f => f.id === selectedSimFormId)?.field_mappings || {}).map((extKey) => {
                            const leadField = leadForms.find(f => f.id === selectedSimFormId)?.field_mappings[extKey];
                            return (
                              <div key={extKey} className="space-y-1">
                                <Label className="text-[8px] uppercase text-slate-400 font-bold">
                                  {extKey} ({leadField}) *
                                </Label>
                                <Input
                                  className="h-7 text-[10px] bg-slate-800 border-slate-700 text-white rounded px-2"
                                  value={simFormInputs[extKey] || ""}
                                  onChange={(e) => setSimFormInputs({ ...simFormInputs, [extKey]: e.target.value })}
                                  placeholder={`Nhập ${extKey}...`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-4">
                        {adFormSubmitted ? (
                          <div className="p-2 border border-emerald-600 bg-emerald-950/40 rounded-xl text-[9px] text-emerald-400 text-center font-bold">
                            ✓ Gửi thông tin thành công! Lead đã đổ về CRM.
                          </div>
                        ) : (
                          <Button onClick={handleMobileSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 text-[10px]">
                            Gửi đăng ký (Submit Ads Form)
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-[280px] h-[500px] border-8 border-dashed border-muted rounded-[36px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground italic text-xs">
                    Vui lòng chọn một biểu mẫu quảng cáo ở trên để hiển thị điện thoại giả lập.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Subtab 4: Quy trình tự động hóa (Automation Rules) */}
      {activeSubTab === "automation" && (
        <Card className="border border-border/80 shadow-md">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-indigo-500" /> Quy trình Tự động hóa CRM (Automation Rules)
              </CardTitle>
              <CardDescription className="text-xs">
                Kích hoạt tự động các hành động (tạo nhiệm vụ, gán nhân viên) khi có bản ghi mới đổ về CRM.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setOpenNewRule(true)} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white shadow-sm">
              <Plus className="h-3.5 w-3.5" /> Tạo Rule mới
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground text-left">
                  <th className="p-3 font-semibold">Tên quy tắc</th>
                  <th className="p-3 font-semibold">Sự kiện kích hoạt</th>
                  <th className="p-3 font-semibold">Hành động tự động</th>
                  <th className="p-3 font-semibold">Độ trễ</th>
                  <th className="p-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {automationRules.map((rule) => (
                  <tr key={rule.id} className="border-b hover:bg-secondary/5">
                    <td className="p-3 font-bold text-foreground">{rule.rule_name}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[9px] font-bold border-none px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {rule.trigger_event === 'on_create' ? 'KHI LEAD ĐƯỢC TẠO' : 'KHI CẬP NHẬT LEAD'}
                      </Badge>
                    </td>
                    <td className="p-3 space-y-1">
                      <div className="font-bold text-[11px] text-foreground">
                        {rule.actions.type === 'create_task' ? 'Tự động tạo Checklist Nhiệm vụ' : 'Phân công nhân viên'}
                      </div>
                      <div className="text-[10px] text-muted-foreground italic">
                        "{rule.actions.title || 'Gán chăm sóc'}"
                      </div>
                    </td>
                    <td className="p-3 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {rule.actions.due_in_hours || 24} giờ kể từ sự kiện
                    </td>
                    <td className="p-3">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(val) => toggleAutomationRule.mutateAsync({ id: rule.id, is_active: val })}
                      />
                    </td>
                  </tr>
                ))}
                {automationRules.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                      Chưa định nghĩa quy tắc tự động hóa nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Open New Key */}
      <Dialog open={openNewKey} onOpenChange={setOpenNewKey}>
        <DialogContent className="sm:max-w-[360px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Key className="h-4.5 w-4.5 text-indigo-500" /> Khởi tạo API Key mới
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateKey} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="keyNameInput" className="font-semibold">Đặt tên nhãn API Key *</Label>
              <Input
                id="keyNameInput"
                className="h-8"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Ví dụ: Marketing Ladipage Key"
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpenNewKey(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold">
                Khởi tạo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Create Mock Form */}
      <Dialog open={openNewForm} onOpenChange={setOpenNewForm}>
        <DialogContent className="sm:max-w-[360px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Plus className="h-4.5 w-4.5 text-indigo-500" /> Đồng bộ biểu mẫu Ads Form
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateFormSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="newFormNameInput" className="font-semibold">Tên biểu mẫu quảng cáo *</Label>
              <Input
                id="newFormNameInput"
                className="h-8"
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
                placeholder="Ví dụ: Form Sticker Tết 2026 - FB Ads"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="font-semibold">Nền tảng nguồn</Label>
              <Select value={newFormPlatform} onValueChange={(val: any) => setNewFormPlatform(val)}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover text-foreground">
                  <SelectItem value="facebook">Facebook Ads (Instant Form)</SelectItem>
                  <SelectItem value="tiktok">TikTok Lead Gen Ads (Form)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpenNewForm(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold">
                Tạo Form
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Mappings Configuration */}
      <Dialog open={openMapping} onOpenChange={setOpenMapping}>
        <DialogContent className="sm:max-w-[420px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Sliders className="h-4.5 w-4.5 text-indigo-500" /> Ánh xạ trường (Field Mappings)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ghép nối các tên trường dữ liệu từ biểu mẫu quảng cáo bên ngoài tương ứng với các cột trường trong CRM của bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3 items-center border-b pb-2 text-[10px] font-bold text-muted-foreground">
              <span>Trường của Form Ads</span>
              <span>Trường tương ứng CRM</span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 items-center">
                <Input className="h-8 text-xs font-mono" value={mapNameField} onChange={(e) => setMapNameField(e.target.value)} />
                <Badge variant="outline" className="text-left py-1 text-xs justify-start bg-indigo-50 text-indigo-600 font-bold border-none">Họ tên (Name)</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <Input className="h-8 text-xs font-mono" value={mapPhoneField} onChange={(e) => setMapPhoneField(e.target.value)} />
                <Badge variant="outline" className="text-left py-1 text-xs justify-start bg-indigo-50 text-indigo-600 font-bold border-none">Số điện thoại (Phone)</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <Input className="h-8 text-xs font-mono" value={mapEmailField} onChange={(e) => setMapEmailField(e.target.value)} />
                <Badge variant="outline" className="text-left py-1 text-xs justify-start bg-indigo-50 text-indigo-600 font-bold border-none">Email (Email)</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <Input className="h-8 text-xs font-mono" value={mapNotesField} onChange={(e) => setMapNotesField(e.target.value)} />
                <Badge variant="outline" className="text-left py-1 text-xs justify-start bg-indigo-50 text-indigo-600 font-bold border-none">Mô tả/Ghi chú (Notes)</Badge>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setOpenMapping(false)}>Thoát</Button>
            <Button type="button" size="sm" onClick={handleSaveMappings} className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold">
              Lưu ánh xạ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Create Automation Rule */}
      <Dialog open={openNewRule} onOpenChange={setOpenNewRule}>
        <DialogContent className="sm:max-w-[400px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-indigo-500" /> Tạo quy tắc tự động hóa mới
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateRuleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="ruleNameInput" className="font-semibold">Tên quy tắc (Rule Name) *</Label>
              <Input
                id="ruleNameInput"
                className="h-8"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="Ví dụ: Tự động gán CSKH..."
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="font-semibold">Sự kiện kích hoạt (Trigger Event)</Label>
              <Select defaultValue="on_create">
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Chọn sự kiện..." />
                </SelectTrigger>
                <SelectContent className="bg-popover text-foreground">
                  <SelectItem value="on_create">Khi Lead mới được tạo (On Lead Created)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 border p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40">
              <div className="text-[10px] font-bold text-foreground uppercase">Hành động tự động thực thi (Action):</div>
              
              <div className="space-y-3 mt-2">
                <div className="space-y-1">
                  <Label className="font-semibold text-[10px]">Loại hành động</Label>
                  <Select defaultValue="create_task">
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-foreground">
                      <SelectItem value="create_task">Tự động tạo Checklist Nhiệm vụ (Create Task)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ruleTaskTitle" className="font-semibold text-[10px]">Tiêu đề Checklist Nhiệm vụ *</Label>
                  <Input
                    id="ruleTaskTitle"
                    className="h-8 bg-background"
                    value={newRuleTaskTitle}
                    onChange={(e) => setNewRuleTaskTitle(e.target.value)}
                    placeholder="Ví dụ: Gọi điện xác minh nhu cầu trong 24h"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold text-[10px]">Thời hạn xử lý (Giờ)</Label>
                  <Select value={newRuleTaskDue} onValueChange={setNewRuleTaskDue}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-foreground">
                      <SelectItem value="2">2 giờ</SelectItem>
                      <SelectItem value="8">8 giờ</SelectItem>
                      <SelectItem value="24">24 giờ (1 ngày)</SelectItem>
                      <SelectItem value="48">48 giờ (2 ngày)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpenNewRule(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold">
                Kích hoạt Rule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
