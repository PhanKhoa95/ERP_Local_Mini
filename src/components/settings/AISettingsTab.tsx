import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShieldCheck, KeyRound, Cpu, Settings2, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAIRotator } from "@/hooks/useAIRotator";

export function AISettingsTab() {
  const {
    providers,
    activeProviderId,
    setActiveProviderId,
    updateProviderKeys,
    updateProviderModel,
    updateProviderBaseUrl,
    toggleProvider
  } = useAIRotator();

  const [selectedEditProvider, setSelectedEditProvider] = useState<string>("gemini");
  const [temperature, setTemperature] = useState("0.2");
  
  // Toggles for AI Features
  const [autoAccounting, setAutoAccounting] = useState(true);
  const [salesResponder, setSalesResponder] = useState(true);
  const [workflowGenerator, setWorkflowGenerator] = useState(true);
  const [voiceReportParser, setVoiceReportParser] = useState(true);

  const [saving, setSaving] = useState(false);

  // States for API Key Testing
  const [testingIndex, setTestingIndex] = useState<number | null>(null);
  const [keyStatuses, setKeyStatuses] = useState<("success" | "error" | null)[]>([null, null, null, null, null]);

  const activeEditProvider = providers.find(p => p.id === selectedEditProvider) || providers[0];

  // Reset test statuses when switching edit providers
  useState(() => {
    setKeyStatuses([null, null, null, null, null]);
  });

  const handleKeyChange = (index: number, val: string) => {
    const updatedKeys = [...activeEditProvider.keys];
    updatedKeys[index] = val;
    updateProviderKeys(activeEditProvider.id, updatedKeys);
    
    setKeyStatuses(prev => {
      const copy = [...prev];
      copy[index] = null;
      return copy;
    });
  };

  const handleTestKey = async (index: number, apiKey: string) => {
    if (!apiKey.trim()) {
      toast.error("Vui lòng nhập API Key trước khi kiểm tra!");
      return;
    }

    setTestingIndex(index);
    const endpoint = `${activeEditProvider.baseUrl}/chat/completions`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: activeEditProvider.selectedModel,
          messages: [{ role: "user", content: "say OK" }],
          max_tokens: 5,
          temperature: 0
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        toast.success(`API Key #${index + 1} hoạt động tốt! Kết nối thành công.`);
        setKeyStatuses(prev => {
          const copy = [...prev];
          copy[index] = "success";
          return copy;
        });
      } else {
        const errText = await res.text();
        let parsedErr = "";
        try {
          const json = JSON.parse(errText);
          parsedErr = json.error?.message || json.error || errText;
        } catch {
          parsedErr = errText || res.statusText;
        }
        toast.error(`Key #${index + 1} lỗi (Lỗi ${res.status}): ${parsedErr}`);
        setKeyStatuses(prev => {
          const copy = [...prev];
          copy[index] = "error";
          return copy;
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Test API key error:", err);
      toast.error(`Key #${index + 1} không thể kết nối: Vui lòng kiểm tra lại mạng hoặc Base URL.`);
      setKeyStatuses(prev => {
        const copy = [...prev];
        copy[index] = "error";
        return copy;
      });
    } finally {
      setTestingIndex(null);
    }
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      toast.success("Cấu hình Trợ lý AI và Xoay tua API đã được cập nhật thành công!");
      setSaving(false);
    }, 800000 / 800000 * 500); // Quick response
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: LIST OF AI PROVIDERS */}
        <Card className="lg:col-span-1 border-primary/10">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Nhà cung cấp LLM
            </CardTitle>
            <CardDescription>
              Kích hoạt và chọn nhà cung cấp AI chạy luân phiên
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {providers.map(p => {
              const activeCount = p.keys.filter(k => k.trim().length > 0).length;
              const isActive = p.id === activeProviderId;
              
              return (
                <div 
                  key={p.id}
                  onClick={() => setSelectedEditProvider(p.id)}
                  className={`p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col gap-2 relative overflow-hidden ${
                    p.id === selectedEditProvider 
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm" 
                      : "hover:bg-muted/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      {p.name}
                      {isActive && (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-[9px] px-1 h-4 border-none">
                          CHÍNH
                        </Badge>
                      )}
                    </span>
                    <Switch 
                      checked={p.enabled} 
                      onCheckedChange={(val) => toggleProvider(p.id, val)}
                      onClick={(e) => e.stopPropagation()} // Prevent selecting provider card
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                    <span>Model: <strong className="text-foreground font-mono">{p.selectedModel.split("/").pop()}</strong></span>
                    <span className={`font-semibold ${activeCount > 0 ? "text-primary" : "text-amber-500"}`}>
                      {activeCount} / 5 Keys cấu hình
                    </span>
                  </div>

                  {isActive && (
                    <div className="absolute right-0 bottom-0 top-0 w-1 bg-emerald-500" />
                  )}
                </div>
              );
            })}

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg text-xs space-y-1 text-blue-700 dark:text-blue-300">
              <div className="font-bold flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5 animate-spin-slow text-blue-500" /> Tự động xoay tua API
              </div>
              <p className="text-[11px] leading-relaxed">
                Khi API Key đang chạy gặp lỗi mạng, hết hạn ngạch (Quota 402) hoặc giới hạn tần suất (Rate limit 429), ERP sẽ tự xoay tua giữa 5 Key cấu hình. Nếu cạn kiệt, hệ thống tự động nhảy sang nhà cung cấp dự phòng kế tiếp.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* MIDDLE COLUMN: ACTIVE PROVIDER KEY ROTATION CONFIG */}
        <Card className="lg:col-span-2 border-primary/20 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-primary">
                  <KeyRound className="h-5 w-5" />
                  Cấu hình Key &amp; Định tuyến: {activeEditProvider.name}
                </CardTitle>
                <CardDescription>
                  Quản lý danh sách 5 API Keys tự xoay tua cho nhà cung cấp này
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className={activeEditProvider.enabled ? "border-emerald-500 text-emerald-500 bg-emerald-500/5" : "border-muted text-muted-foreground"}>
                  {activeEditProvider.enabled ? "Đang bật dự phòng" : "Đang tắt"}
                </Badge>
                {activeProviderId !== activeEditProvider.id && activeEditProvider.enabled && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs px-2"
                    onClick={() => setActiveProviderId(activeEditProvider.id)}
                  >
                    Đặt làm Chính
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            
            {/* Model & Endpoint Settings */}
            <div className="grid md:grid-cols-2 gap-4 pb-3 border-b">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">Mô hình hoạt động (Model)</Label>
                <select
                  className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  value={activeEditProvider.selectedModel}
                  onChange={(e) => updateProviderModel(activeEditProvider.id, e.target.value)}
                >
                  {activeEditProvider.models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">Endpoint / Base URL</Label>
                <Input
                  type="text"
                  value={activeEditProvider.baseUrl}
                  onChange={(e) => updateProviderBaseUrl(activeEditProvider.id, e.target.value)}
                  className="font-mono text-xs"
                  placeholder="https://openrouter.ai/api/v1"
                />
              </div>
            </div>

            {/* List of 5 API Keys */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground block mb-1">
                Danh sách 5 API Key tự xoay tua (Tuần tự từ 1-5):
              </Label>
              
              {activeEditProvider.keys.map((keyVal, idx) => {
                const isKeyActive = activeEditProvider.activeKeyIndex === idx && activeProviderId === activeEditProvider.id;
                
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold flex items-center gap-1.5">
                        API Key #{idx + 1}
                        {isKeyActive && (
                          <Badge className="bg-emerald-500 text-white text-[9px] px-1 h-4 font-mono">
                            ĐANG CHẠY CHÍNH
                          </Badge>
                        )}
                        {!isKeyActive && keyVal.trim() && (
                          <>
                            {keyStatuses[idx] === "success" && (
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] px-1 h-4 font-mono border-none">
                                HOẠT ĐỘNG TỐT
                              </Badge>
                            )}
                            {keyStatuses[idx] === "error" && (
                              <Badge className="bg-destructive text-white text-[9px] px-1 h-4 font-mono border-none">
                                LỖI KẾT NỐI
                              </Badge>
                            )}
                            {keyStatuses[idx] === null && (
                              <Badge variant="outline" className="text-[9px] px-1 h-4 font-mono text-muted-foreground">
                                SẴN SÀNG XOAY TUA
                              </Badge>
                            )}
                          </>
                        )}
                      </span>
                      {keyVal.trim() && (
                        <span className="text-[10px] text-muted-foreground">
                          Độ dài: {keyVal.length} ký tự
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="password"
                          value={keyVal}
                          onChange={(e) => handleKeyChange(idx, e.target.value)}
                          placeholder={`Nhập API Key dự phòng #${idx + 1} của ${activeEditProvider.name}...`}
                          className={`pr-10 font-mono text-xs ${
                            isKeyActive 
                              ? "border-emerald-500 bg-emerald-500/5 focus-visible:ring-emerald-500" 
                              : keyStatuses[idx] === "success"
                              ? "border-emerald-500/50 bg-emerald-500/5"
                              : keyStatuses[idx] === "error"
                              ? "border-destructive/50 bg-destructive/5"
                              : ""
                          }`}
                        />
                        <KeyRound className={`absolute right-3 top-3 h-4 w-4 ${isKeyActive ? "text-emerald-500" : "text-muted-foreground"}`} />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        className="shrink-0 h-9 px-3 text-xs"
                        onClick={() => handleTestKey(idx, keyVal)}
                        disabled={testingIndex === idx || !keyVal.trim()}
                      >
                        {testingIndex === idx ? "Đang thử..." : "Kiểm tra"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
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
                  Hệ thống Xoay Tua Bảo Mật
                </Badge>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full mt-2">
              {saving ? "Đang lưu..." : "Lưu kết nối AI & Cấu hình Xoay tua"}
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Feature Toggles Row */}
      <div className="grid gap-6 md:grid-cols-2 mt-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Tính năng AI kích hoạt
            </CardTitle>
            <CardDescription>Bật hoặc tắt các trợ lý thông minh theo nhu cầu doanh nghiệp</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3.5 border rounded-lg hover:bg-muted/10 transition-colors bg-background">
              <div className="space-y-0.5">
                <div className="font-semibold text-sm flex items-center gap-1">
                  🤖 AI Auto-Accounting
                </div>
                <p className="text-xs text-muted-foreground">Tự động định khoản & đối soát giao dịch ngân hàng khớp hóa đơn</p>
              </div>
              <Switch checked={autoAccounting} onCheckedChange={setAutoAccounting} />
            </div>

            <div className="flex items-center justify-between p-3.5 border rounded-lg hover:bg-muted/10 transition-colors bg-background">
              <div className="space-y-0.5">
                <div className="font-semibold text-sm flex items-center gap-1">
                  💬 Sales Auto-Responder
                </div>
                <p className="text-xs text-muted-foreground">Tự động trả lời, phân loại lead và tối ưu hội thoại đa kênh</p>
              </div>
              <Switch checked={salesResponder} onCheckedChange={setSalesResponder} />
            </div>

            <div className="flex items-center justify-between p-3.5 border rounded-lg hover:bg-muted/10 transition-colors bg-background">
              <div className="space-y-0.5">
                <div className="font-semibold text-sm flex items-center gap-1">
                  ⚡ AI Workflow Automation
                </div>
                <p className="text-xs text-muted-foreground">Phân tích hội thoại tự động sinh biểu đồ quy trình kéo thả</p>
              </div>
              <Switch checked={workflowGenerator} onCheckedChange={setWorkflowGenerator} />
            </div>

            <div className="flex items-center justify-between p-3.5 border rounded-lg hover:bg-muted/10 transition-colors bg-background">
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
