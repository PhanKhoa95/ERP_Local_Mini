import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Bot, ShieldCheck, Zap, KeyRound, Cpu } from "lucide-react";
import { toast } from "sonner";

export function AISettingsTab() {
  const [apiKey, setApiKey] = useState("gsk_gemini_prod_key_••••••••");
  const [model, setModel] = useState("gemini-1.5-pro");
  const [temperature, setTemperature] = useState("0.2");
  
  // Toggles for AI Features
  const [autoAccounting, setAutoAccounting] = useState(true);
  const [salesResponder, setSalesResponder] = useState(true);
  const [workflowGenerator, setWorkflowGenerator] = useState(true);
  const [voiceReportParser, setVoiceReportParser] = useState(true);

  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      toast.success("Cấu hình Trợ lý AI đã được cập nhật thành công!");
      setSaving(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Core AI API Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Cấu hình API Key & Kết nối
            </CardTitle>
            <CardDescription>
              Thiết lập kết nối với mô hình ngôn ngữ lớn (LLM) để vận hành các trợ lý ảo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Mô hình AI ưu tiên</Label>
              <select
                className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Khuyên dùng - Nhanh & Chính xác)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Tối ưu tốc độ)</option>
                <option value="gpt-4o">OpenAI GPT-4o (Định khoản nghiệp vụ phức tạp)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Soạn thảo chính sách chuyên nghiệp)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>API Key (Gemini / OpenAI / Anthropic)</Label>
              <div className="relative">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Nhập khóa bí mật API của bạn..."
                  className="pr-10"
                />
                <Cpu className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nhiệt độ sáng tạo (Temperature)</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Badge variant="secondary" className="mb-2 h-7 gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Đã kiểm tra an toàn
                </Badge>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full mt-2">
              {saving ? "Đang lưu..." : "Lưu kết nối AI"}
            </Button>
          </CardContent>
        </Card>

        {/* Feature toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Tính năng AI kích hoạt
            </CardTitle>
            <CardDescription>Bật hoặc tắt các trợ lý thông minh theo nhu cầu doanh nghiệp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10 transition-colors">
              <div className="space-y-0.5">
                <div className="font-semibold text-sm flex items-center gap-1">
                  🤖 AI Auto-Accounting
                </div>
                <p className="text-xs text-muted-foreground">Tự động định khoản & đối soát giao dịch ngân hàng khớp hóa đơn</p>
              </div>
              <Switch checked={autoAccounting} onCheckedChange={setAutoAccounting} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10 transition-colors">
              <div className="space-y-0.5">
                <div className="font-semibold text-sm flex items-center gap-1">
                  💬 Sales Auto-Responder
                </div>
                <p className="text-xs text-muted-foreground">Tự động trả lời, phân loại lead và tối ưu hội thoại đa kênh</p>
              </div>
              <Switch checked={salesResponder} onCheckedChange={setSalesResponder} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10 transition-colors">
              <div className="space-y-0.5">
                <div className="font-semibold text-sm flex items-center gap-1">
                  ⚡ AI Workflow Automation
                </div>
                <p className="text-xs text-muted-foreground">Phân tích hội thoại tự động sinh biểu đồ quy trình kéo thả</p>
              </div>
              <Switch checked={workflowGenerator} onCheckedChange={setWorkflowGenerator} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10 transition-colors">
              <div className="space-y-0.5">
                <div className="font-semibold text-sm flex items-center gap-1">
                  🎙️ Voice & Chat Daily Report
                </div>
                <p className="text-xs text-muted-foreground">Chuyển giọng nói / hội thoại thành draft báo cáo công việc</p>
              </div>
              <Switch checked={voiceReportParser} onCheckedChange={setVoiceReportParser} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
