import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Settings,
  Send,
  User,
  Phone,
  Link2,
  Bot,
  Zap,
  CheckCircle,
  Radio,
  Plus,
  Users,
  Play,
  Clock,
  Sparkles,
  ClipboardList,
  AlertTriangle,
  QrCode
} from "lucide-react";

interface ZaloAccount {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  status: "active" | "expired";
}

interface ZaloGroup {
  id: string;
  name: string;
  members: number;
  lockInfo: boolean;
  cleanLinks: boolean;
  approveMembers: boolean;
}

interface AutoReplyRule {
  id: string;
  keyword: string;
  matchType: "exact" | "contains" | "regex";
  replyText: string;
}

export function ZaloPersonalTab() {
  const { toast } = useToast();
  
  // Zalo Accounts State
  const [accounts, setAccounts] = useState<ZaloAccount[]>([
    { id: "acc-1", name: "Levera Admin (Chính)", phone: "0963847593", avatar: "L", status: "active" },
    { id: "acc-2", name: "Bot CTV Zalo (Clone)", phone: "0849283749", avatar: "B", status: "active" }
  ]);

  // QR Login Simulator States
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrProgress, setQrProgress] = useState(0);
  const [newAccPhone, setNewAccPhone] = useState("");
  const [newAccName, setNewAccName] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // Zalo Groups State
  const [groups, setGroups] = useState<ZaloGroup[]>([
    { id: "gr-1", name: "Đại Lý & CTV Toàn Quốc", members: 256, lockInfo: true, cleanLinks: true, approveMembers: true },
    { id: "gr-2", name: "Khách VIP Miền Bắc", members: 120, lockInfo: false, cleanLinks: true, approveMembers: false },
    { id: "gr-3", name: "Gia Đình Levera", members: 48, lockInfo: false, cleanLinks: false, approveMembers: false }
  ]);

  // Keyword Auto-reply Rules
  const [rules, setRules] = useState<AutoReplyRule[]>([
    { id: "rule-1", keyword: "VC20", matchType: "contains", replyText: "Chào bạn, sản phẩm Túi Trắng VC20 hiện còn hàng, giá 225.000đ. Bạn gửi SĐT để shop lên đơn nhé!" },
    { id: "rule-2", keyword: "ship", matchType: "contains", replyText: "Levera Shop đồng giá ship toàn quốc là 25.000đ. Đơn hàng từ 500k sẽ được freeship hoàn toàn ạ." }
  ]);
  const [newRuleKeyword, setNewRuleKeyword] = useState("");
  const [newRuleReply, setNewRuleReply] = useState("");
  const [newRuleType, setNewRuleType] = useState<"exact" | "contains" | "regex">("contains");

  // Bulk Messaging Campaign States
  const [campaignText, setCampaignText] = useState("Chào {bạn|anh|chị}, Levera vừa ra mắt bộ sưu tập túi mới, giảm giá 15% duy nhất hôm nay ạ!");
  const [campaignDelay, setCampaignDelay] = useState(5);
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState(0);

  // Terminal Console Logs
  const [logs, setLogs] = useState<string[]>([]);

  // Push message helper
  const addLog = (text: string) => {
    const timestamp = new Date().toLocaleTimeString("vi-VN");
    setLogs(prev => [`[${timestamp}] ${text}`, ...prev.slice(0, 49)]);
  };

  // QR Scanner scan simulator progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showQRModal && isScanning && qrProgress < 100) {
      interval = setInterval(() => {
        setQrProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            setTimeout(() => {
              const newAcc: ZaloAccount = {
                id: `acc-${Date.now()}`,
                name: newAccName || "Zalo Marketing Bot",
                phone: newAccPhone || "0988776655",
                avatar: (newAccName || "Z").charAt(0).toUpperCase(),
                status: "active"
              };
              setAccounts(prevAccs => [...prevAccs, newAcc]);
              addLog(`[Tài khoản] Liên kết thành công Zalo cá nhân: ${newAcc.name} (${newAcc.phone})`);
              setShowQRModal(false);
              setQrProgress(0);
              setIsScanning(false);
              setNewAccName("");
              setNewAccPhone("");
              toast({
                title: "Thêm tài khoản thành công! 🎉",
                description: `Zalo cá nhân ${newAcc.name} đã được đồng bộ.`
              });
            }, 500);
            return 100;
          }
          return prev + 20;
        });
      }, 400);
    }
    return () => clearInterval(interval);
  }, [showQRModal, isScanning, qrProgress, newAccName, newAccPhone]);

  // Bulk campaign messaging simulation
  const startCampaign = () => {
    if (!campaignText.trim()) return;
    setIsCampaignRunning(true);
    setCampaignProgress(0);
    addLog(`[Chiến dịch] Bắt đầu gửi tin nhắn hàng loạt đến ${groups.length} nhóm chat Zalo...`);

    let currentGroupIndex = 0;
    const interval = setInterval(() => {
      if (currentGroupIndex >= groups.length) {
        clearInterval(interval);
        setIsCampaignRunning(false);
        setCampaignProgress(100);
        addLog(`[Chiến dịch] Hoàn tất gửi tin nhắn hàng loạt thành công!`);
        toast({
          title: "Chiến dịch hoàn tất! 📢",
          description: `Đã gửi tin nhắn đến tất cả ${groups.length} nhóm chat.`
        });
        return;
      }

      const gr = groups[currentGroupIndex];
      // Resolve Spintax: Chào {bạn|anh|chị}
      let resolvedText = campaignText;
      const spintaxRegex = /\{([^}]+)\}/g;
      let match;
      while ((match = spintaxRegex.exec(campaignText)) !== null) {
        const options = match[1].split("|");
        const chosen = options[Math.floor(Math.random() * options.length)];
        resolvedText = resolvedText.replace(match[0], chosen);
      }

      addLog(`[Chiến dịch] [Zalo Bot] Gửi đến nhóm "${gr.name}": "${resolvedText}" (Giãn cách: ${campaignDelay}s)`);
      setCampaignProgress(Math.round(((currentGroupIndex + 1) / groups.length) * 100));
      currentGroupIndex++;
    }, campaignDelay * 1000);
  };

  // Add new Auto reply keyword rule
  const handleAddRule = () => {
    if (!newRuleKeyword.trim() || !newRuleReply.trim()) return;
    const newRule: AutoReplyRule = {
      id: `rule-${Date.now()}`,
      keyword: newRuleKeyword,
      matchType: newRuleType,
      replyText: newRuleReply
    };
    setRules([...rules, newRule]);
    addLog(`[Cấu hình] Thêm từ khóa trả lời tự động: "${newRule.keyword}"`);
    setNewRuleKeyword("");
    setNewRuleReply("");
    toast({ title: "Đã thêm từ khóa mới!" });
  };

  const handleDeleteRule = (id: string) => {
    const target = rules.find(r => r.id === id);
    setRules(rules.filter(r => r.id !== id));
    if (target) {
      addLog(`[Cấu hình] Xóa từ khóa trả lời tự động: "${target.keyword}"`);
    }
  };

  return (
    <div className="space-y-6 text-xs text-foreground">
      
      {/* Top row: Multi-Account Manager & Group settings list */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Accounts List (Col span 5) */}
        <Card className="xl:col-span-5 border border-border shadow-none">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-500" />
                Quản lý tài khoản Zalo cá nhân
              </CardTitle>
              <CardDescription className="text-[10px] mt-0.5">Liên kết tài khoản bot gửi tin và quản trị</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowQRModal(true)} className="h-7 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Thêm tài khoản
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5">
            {accounts.map(acc => (
              <div key={acc.id} className="p-3 border rounded-lg flex items-center justify-between bg-secondary/15">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                    {acc.avatar}
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground text-xs">{acc.name}</h5>
                    <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">{acc.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-[9px] px-1.5 py-0 h-4 border-none", acc.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive")}>
                    {acc.status === "active" ? "ĐANG ONLINE" : "MẤT KẾT NỐI"}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground font-semibold" onClick={() => {
                    setAccounts(accounts.filter(a => a.id !== acc.id));
                    addLog(`[Tài khoản] Đã ngắt kết nối Zalo: ${acc.name}`);
                  }}>
                    Ngắt
                  </Button>
                </div>
              </div>
            ))}

            <div className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/10 text-amber-800 dark:text-amber-300 text-[10px] flex gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="leading-normal">
                <strong>Khuyến nghị an toàn:</strong> Không sử dụng số Zalo chính của bạn để gửi hàng loạt. Hãy sử dụng tài khoản clone phụ để tương tác với nhóm. Thiết lập khoảng cách giãn cách giãn cách tối thiểu 5s để chống khóa tài khoản Zalo.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Zalo Group Settings Moderation (Col span 7) */}
        <Card className="xl:col-span-7 border border-border shadow-none">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-indigo-500" />
              Thiết lập kiểm duyệt nhóm Zalo cá nhân
            </CardTitle>
            <CardDescription className="text-[10px] mt-0.5">Tự động chống spam tin nhắn và bảo vệ thông tin nhóm</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/20 text-[10px] font-semibold text-muted-foreground">
                    <th className="p-3">Tên nhóm Zalo</th>
                    <th className="p-3 text-center">Thành viên</th>
                    <th className="p-3 text-center">Khóa thông tin nhóm</th>
                    <th className="p-3 text-center">Tự xóa Link URL</th>
                    <th className="p-3 text-center">Duyệt người mới</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(gr => (
                    <tr key={gr.id} className="border-b last:border-0 hover:bg-secondary/5">
                      <td className="p-3 font-bold text-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        {gr.name}
                      </td>
                      <td className="p-3 text-center font-mono text-muted-foreground">{gr.members}</td>
                      <td className="p-3 text-center">
                        <Switch
                          checked={gr.lockInfo}
                          onCheckedChange={checked => {
                            setGroups(groups.map(g => g.id === gr.id ? { ...g, lockInfo: checked } : g));
                            addLog(`[Kiểm duyệt] Nhóm "${gr.name}": ${checked ? "Bật" : "Tắt"} khóa đổi Avatar/Tên nhóm`);
                          }}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Switch
                          checked={gr.cleanLinks}
                          onCheckedChange={checked => {
                            setGroups(groups.map(g => g.id === gr.id ? { ...g, cleanLinks: checked } : g));
                            addLog(`[Kiểm duyệt] Nhóm "${gr.name}": ${checked ? "Bật" : "Tắt"} chế độ tự động xóa tin nhắn chứa Link`);
                          }}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Switch
                          checked={gr.approveMembers}
                          onCheckedChange={checked => {
                            setGroups(groups.map(g => g.id === gr.id ? { ...g, approveMembers: checked } : g));
                            addLog(`[Kiểm duyệt] Nhóm "${gr.name}": ${checked ? "Bật" : "Tắt"} phê duyệt thành viên mới`);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle row: Campaign Bulk Messaging & Keyword Auto replies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Campaign Sender */}
        <Card className="border border-border shadow-none">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Play className="h-4 w-4 text-emerald-500" />
              Chiến dịch gửi tin hàng loạt (Zalo Campaign)
            </CardTitle>
            <CardDescription className="text-[10px] mt-0.5">Spam tin nhắn tiếp thị hàng loạt đến các nhóm được chỉ định</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-muted-foreground">Nội dung tin nhắn (Hỗ trợ cấu trúc SpinTax)</Label>
                <span className="text-[9px] text-muted-foreground font-mono">Ví dụ: Chào &#123;bạn|anh|chị&#125;</span>
              </div>
              <textarea
                value={campaignText}
                onChange={e => setCampaignText(e.target.value)}
                disabled={isCampaignRunning}
                className="w-full h-24 p-2.5 border rounded-lg bg-secondary/10 focus:outline-none text-foreground font-sans leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="font-semibold text-muted-foreground">Giãn cách gửi (Giây): {campaignDelay}s</Label>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={campaignDelay}
                  onChange={e => setCampaignDelay(Number(e.target.value))}
                  disabled={isCampaignRunning}
                  className="w-full cursor-pointer h-1.5 bg-secondary rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold text-muted-foreground">Mục tiêu nhóm gửi</Label>
                <Badge variant="outline" className="text-[9px] px-2 h-7 bg-muted/30">
                  Tất cả ({groups.length} nhóm chat)
                </Badge>
              </div>
            </div>

            {isCampaignRunning && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                  <span>Tiến độ chiến dịch:</span>
                  <span>{campaignProgress}%</span>
                </div>
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${campaignProgress}%` }} />
                </div>
              </div>
            )}

            <Button
              onClick={startCampaign}
              disabled={isCampaignRunning || !campaignText.trim()}
              className="w-full h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1"
            >
              <Send className="h-3.5 w-3.5" />
              {isCampaignRunning ? "Đang gửi hàng loạt..." : "Bắt đầu Chiến Dịch"}
            </Button>
          </CardContent>
        </Card>

        {/* Keyword Auto Replies */}
        <Card className="border border-border shadow-none">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="h-4 w-4 text-purple-500" />
              Từ khóa tự động trả lời (Auto-Responder)
            </CardTitle>
            <CardDescription className="text-[10px] mt-0.5">Bot tự trả lời ngay khi có từ khóa trùng khớp trong hội thoại</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            
            {/* List of rules */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {rules.map(rule => (
                <div key={rule.id} className="p-2.5 border rounded-lg bg-secondary/10 flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-primary bg-primary/10 px-1 py-0.5 rounded text-[10px]">{rule.keyword}</span>
                      <Badge variant="outline" className="text-[8px] uppercase px-1 py-0">
                        {rule.matchType === "contains" ? "Chứa từ" : rule.matchType === "exact" ? "Khớp 100%" : "Regex"}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{rule.replyText}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDeleteRule(rule.id)}>
                    X
                  </Button>
                </div>
              ))}
            </div>

            {/* Add Rule Form */}
            <div className="p-3 border rounded-lg bg-secondary/5 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Từ khóa kích hoạt</Label>
                  <Input
                    placeholder="Ví dụ: báo giá"
                    value={newRuleKeyword}
                    onChange={e => setNewRuleKeyword(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Loại khớp</Label>
                  <select
                    value={newRuleType}
                    onChange={e => setNewRuleType(e.target.value as any)}
                    className="w-full h-8 bg-background border rounded-md px-2 text-[10px] focus:outline-none"
                  >
                    <option value="contains">Chứa từ</option>
                    <option value="exact">Khớp 100%</option>
                    <option value="regex">Regex</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground">Nội dung Bot phản hồi</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nội dung gửi lại khách..."
                    value={newRuleReply}
                    onChange={e => setNewRuleReply(e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <Button size="sm" onClick={handleAddRule} className="h-8 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shrink-0">
                    Thêm
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bot Activity Console terminal */}
      <Card className="border border-border shadow-none">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-slate-500 animate-pulse" />
            Bảng điều khiển & log hoạt động của Bot (Bot Console Logs)
          </CardTitle>
          <CardDescription className="text-[10px] mt-0.5">Cập nhật hoạt động quét nhóm chat, xóa link spam, tự trả lời theo giây</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <div className="h-44 p-3.5 border rounded bg-slate-950 dark:bg-slate-900 font-mono text-[10p      {/* QR Code login simulator dialog */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm border border-border shadow-xl bg-background overflow-hidden">
            <CardHeader className="p-4 border-b text-center bg-blue-50 dark:bg-blue-950/20">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 text-blue-700 dark:text-blue-400">
                <QrCode className="h-5 w-5" />
                Quét mã QR liên kết Zalo
              </CardTitle>
              <CardDescription className="text-[10px] mt-0.5">Sử dụng điện thoại để quét mã đăng nhập Zalo Web</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
              <div className="space-y-3.5 w-full text-left">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Tên đại diện Bot</Label>
                  <Input
                    placeholder="Zalo Marketing Bot"
                    value={newAccName}
                    onChange={e => setNewAccName(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground">Số điện thoại</Label>
                  <Input
                    placeholder="0988776655"
                    value={newAccPhone}
                    onChange={e => setNewAccPhone(e.target.value)}
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>
              </div>

              {/* QR Simulator box */}
              <div className="relative border p-3.5 rounded-lg bg-white mt-2 flex flex-col items-center">
                <div className="w-40 h-40 bg-slate-100 flex items-center justify-center border-dashed border-2 rounded">
                  <QrCode className="w-24 h-24 text-slate-800" />
                </div>
                {isScanning && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center text-white p-3 text-[10px] font-semibold">
                    <span className="text-sm font-bold text-blue-400 mb-1">{qrProgress}%</span>
                    <p>Đang mô phỏng kết nối điện thoại...</p>
                    <div className="w-24 bg-slate-700 h-1 rounded-full mt-2 overflow-hidden">
                      <div className="bg-blue-400 h-full transition-all duration-300" style={{ width: `${qrProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {!isScanning ? (
                <Button
                  onClick={() => {
                    if (!newAccPhone.trim()) {
                      toast({
                        variant: "destructive",
                        title: "Thiếu Số điện thoại",
                        description: "Vui lòng nhập Số điện thoại để định danh tài khoản Zalo."
                      });
                      return;
                    }
                    setIsScanning(true);
                  }}
                  className="w-full h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white mt-2"
                >
                  Bắt đầu liên kết (Quét QR)
                </Button>
              ) : (
                <Button
                  disabled
                  className="w-full h-8 text-xs font-semibold bg-slate-600 text-white mt-2"
                >
                  Đang quét mã QR...
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowQRModal(false);
                  setQrProgress(0);
                  setIsScanning(false);
                }}
                className="w-full h-8 text-xs font-semibold mt-2"
              >
                Hủy bỏ
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}    </div>
      )}
    </div>
  );
}...</p>
                  <div className="w-24 bg-slate-700 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-400 h-full transition-all duration-300" style={{ width: `${qrProgress}%` }} />
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowQRModal(false);
                  setQrProgress(0);
                }}
                className="w-full h-8 text-xs font-semibold mt-2"
              >
                Hủy bỏ
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
