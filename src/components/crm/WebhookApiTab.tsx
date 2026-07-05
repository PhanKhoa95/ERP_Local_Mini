import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Link2, Play, Key, Trash2, Code, Server, Send } from "lucide-react";

interface WebhookApiTabProps {
  apiKeys: any[];
  createApiKey: any;
  deleteApiKey: any;
  simulateWebhookIngest: any;
}

export function WebhookApiTab({ apiKeys, createApiKey, deleteApiKey, simulateWebhookIngest }: WebhookApiTabProps) {
  const [open, setOpen] = useState(false);
  const [keyName, setKeyName] = useState("");

  // Simulator states
  const [selectedKey, setSelectedKey] = useState("");
  const [simFormData, setSimFormData] = useState({
    name: "Lâm Minh Anh",
    phone: "0909999888",
    email: "anhlm@gmail.com",
    notes: "Đăng ký nhận báo giá in 2000 bao bì giấy Kraft B2B"
  });

  const [simResult, setSimResult] = useState<{
    status: "idle" | "success" | "error";
    payloadSent: any;
    responseReceived: any;
  }>({ status: "idle", payloadSent: null, responseReceived: null });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;
    await createApiKey.mutateAsync(keyName);
    setKeyName("");
    setOpen(false);
  };

  const handleSimulate = async () => {
    if (!selectedKey) {
      alert("Vui lòng chọn 1 mã API Key ở danh sách trước!");
      return;
    }
    const payload = {
      apiKey: selectedKey,
      name: simFormData.name,
      phone: simFormData.phone,
      email: simFormData.email,
      notes: simFormData.notes
    };

    try {
      const res = await simulateWebhookIngest.mutateAsync(payload);
      setSimResult({
        status: "success",
        payloadSent: payload,
        responseReceived: {
          success: true,
          message: "Lead created successfully via Webhook ingestion",
          data: res
        }
      });
    } catch (err: any) {
      setSimResult({
        status: "error",
        payloadSent: payload,
        responseReceived: {
          success: false,
          error: err.message || "Failed to process webhook"
        }
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left panel: API Keys Management */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-tight flex items-center gap-1.5">
              <Key className="h-4 w-4 text-indigo-500" /> Tích hợp API Keys
            </h2>
            <p className="text-[10px] text-muted-foreground">Tạo các mã khóa bảo mật kết nối với Ladipage/Webcake</p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)} className="h-7 text-[10px] font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1">
            <Plus className="h-3 w-3" /> Sinh API Key
          </Button>
        </div>

        <div className="space-y-3">
          {apiKeys.map((key) => (
            <Card key={key.id} className="border border-border/80 shadow-sm relative">
              <CardContent className="p-3.5 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-[11px] text-foreground">{key.key_name}</div>
                    <span className="text-[8px] text-muted-foreground font-mono">
                      Khởi tạo: {new Date(key.created_at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteApiKey.mutateAsync(key.id)}
                    className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 select-all border flex items-center justify-between">
                  <span>{key.api_key}</span>
                  <Badge variant="outline" className="text-[8px] uppercase font-bold py-0 bg-background text-[9px]">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {apiKeys.length === 0 && (
            <div className="border border-dashed border-border/80 py-10 text-center text-xs text-muted-foreground italic rounded-xl">
              Chưa cấu hình API Key nào cho shop.
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Webhook Simulator */}
      <div className="lg:col-span-7 space-y-4 border-l pl-0 lg:pl-6 border-dashed">
        <div className="space-y-0.5">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-tight flex items-center gap-1.5">
            <Server className="h-4 w-4 text-emerald-500" /> Bộ giả lập bắn Webhook LadiPage (Mock Simulator)
          </h2>
          <p className="text-[10px] text-muted-foreground">Mô phỏng hành động khách gửi form từ landing page về CRM trong thời gian thực</p>
        </div>

        <Card className="border border-border/80 shadow-md">
          <CardContent className="p-4 space-y-4">
            
            {/* Choose Key */}
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-foreground">Chọn API Key của bạn để ký xác thực *</Label>
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Chọn API Key..." />
                </SelectTrigger>
                <SelectContent className="bg-popover text-foreground">
                  {apiKeys.map((k) => (
                    <SelectItem key={k.id} value={k.api_key}>{k.key_name} ({k.api_key.slice(0, 15)}...)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Simulated endpoint URL */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-2.5 space-y-1">
              <div className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Code className="h-3 w-3" /> ENDPOINT TARGET URL
              </div>
              <div className="font-mono text-[9.5px] text-foreground select-all break-all">
                {`http://192.168.1.237:8017/api/v1/crm/webhooks?api_key=`}{selectedKey || "YOUR_API_KEY"}
              </div>
            </div>

            {/* Input Form Fields */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="simName" className="font-semibold">Họ tên khách hàng</Label>
                <Input
                  id="simName"
                  className="h-8"
                  value={simFormData.name}
                  onChange={(e) => setSimFormData({ ...simFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="simPhone" className="font-semibold">Số điện thoại</Label>
                <Input
                  id="simPhone"
                  className="h-8"
                  value={simFormData.phone}
                  onChange={(e) => setSimFormData({ ...simFormData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="simEmail" className="font-semibold">Email</Label>
                <Input
                  id="simEmail"
                  className="h-8"
                  value={simFormData.email}
                  onChange={(e) => setSimFormData({ ...simFormData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="simNotes" className="font-semibold">Nội dung ghi chú của form</Label>
                <Input
                  id="simNotes"
                  className="h-8"
                  value={simFormData.notes}
                  onChange={(e) => setSimFormData({ ...simFormData, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              size="sm"
              onClick={handleSimulate}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Send className="h-3.5 w-3.5" /> Gửi mô phỏng Webhook (Send Form Data)
            </Button>

            {/* Simulator Response Log JSON */}
            {simResult.status !== "idle" && (
              <div className="space-y-2 border-t pt-3">
                <div className="text-[10px] font-bold text-foreground">KẾT QUẢ ĐỒNG BỘ REALTIME:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[9px] font-mono">
                  
                  {/* JSON Sent */}
                  <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-2.5 space-y-1">
                    <span className="text-[8px] font-extrabold text-blue-500 uppercase">JSON Request (POST)</span>
                    <pre className="max-h-[100px] overflow-auto text-[8.5px] leading-tight">
                      {JSON.stringify(simResult.payloadSent, null, 2)}
                    </pre>
                  </div>

                  {/* JSON Response */}
                  <div className={`border rounded-lg p-2.5 space-y-1 ${simResult.status === "success" ? "bg-green-50/50 dark:bg-green-950/20 border-green-200" : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200"}`}>
                    <span className={`text-[8px] font-extrabold uppercase ${simResult.status === "success" ? "text-green-600" : "text-rose-600"}`}>
                      Response (Status: {simResult.status === "success" ? "200 OK" : "400 Bad Request"})
                    </span>
                    <pre className="max-h-[100px] overflow-auto text-[8.5px] leading-tight">
                      {JSON.stringify(simResult.responseReceived, null, 2)}
                    </pre>
                  </div>

                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      {/* Add API Key Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[350px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Key className="h-4.5 w-4.5 text-indigo-500" /> Sinh API Key kết nối mới
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập tên nhãn kết nối để dễ quản lý. Sau khi tạo bạn có thể copy API Key này vào LadiPage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="keyLabel" className="font-semibold">Tên nhãn kết nối *</Label>
              <Input
                id="keyLabel"
                className="h-8"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Ví dụ: LadiPage Bán hàng Tết 2026"
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">
                Tạo mới
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
