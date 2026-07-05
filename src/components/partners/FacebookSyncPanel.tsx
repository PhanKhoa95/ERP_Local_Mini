import { useState } from "react";
import { Facebook, RefreshCw, Plus, Users, ShieldAlert, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface MarketingSegment {
  id: string;
  name: string;
  condition: string;
  fbAudienceId: string;
  matchCount: string;
  status: "synced" | "syncing" | "idle" | "error";
  lastSynced: string;
}

export function FacebookSyncPanel() {
  const { toast } = useToast();
  const [segments, setSegments] = useState<MarketingSegment[]>([
    {
      id: "seg-1",
      name: "Tệp Khách VIP (LTV > 5 Triệu)",
      condition: "Tổng chi tiêu >= 5,000,000đ",
      fbAudienceId: "2385901248011",
      matchCount: "12 / 15 SĐT (80%)",
      status: "synced",
      lastSynced: "03/07/2026 10:45",
    },
    {
      id: "seg-2",
      name: "Khách hàng mới chưa phát sinh đơn",
      condition: "Số lượng đơn hàng = 0",
      fbAudienceId: "2385901249022",
      matchCount: "28 / 30 SĐT (93.3%)",
      status: "idle",
      lastSynced: "Chưa đồng bộ",
    },
    {
      id: "seg-3",
      name: "Khách hàng mua hàng thường xuyên",
      condition: "Số lượng đơn hàng >= 5 đơn",
      fbAudienceId: "2385901249933",
      matchCount: "6 / 8 SĐT (75%)",
      status: "error",
      lastSynced: "02/07/2026 15:20 (Lỗi Token)",
    }
  ]);

  const [createOpen, setCreateOpen] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState("");
  const [minLtv, setMinLtv] = useState("1000000");
  const [minOrders, setMinOrders] = useState("1");
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleCreateSegment = () => {
    if (!newSegmentName.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi tạo tệp",
        description: "Vui lòng nhập tên tệp khách hàng."
      });
      return;
    }

    const newSeg: MarketingSegment = {
      id: `seg-${Date.now()}`,
      name: newSegmentName.trim(),
      condition: `Chi tiêu >= ${Number(minLtv).toLocaleString()}đ & Số đơn >= ${minOrders}`,
      fbAudienceId: `23859012${Math.floor(100000 + Math.random() * 900000)}`,
      matchCount: "Mới tạo (0 SĐT)",
      status: "idle",
      lastSynced: "Chưa đồng bộ"
    };

    setSegments([newSeg, ...segments]);
    setNewSegmentName("");
    setCreateOpen(false);
    toast({
      title: "Đã tạo Tệp Marketing",
      description: `Đã tạo tệp "${newSeg.name}". Bạn có thể đồng bộ sang Facebook Ads ngay bây giờ.`
    });
  };

  const handleSyncNow = (id: string) => {
    setSyncingId(id);
    setSegments(prev => prev.map(s => s.id === id ? { ...s, status: "syncing" } : s));

    setTimeout(() => {
      setSyncingId(null);
      setSegments(prev => prev.map(s => {
        if (s.id === id) {
          const matched = Math.floor(10 + Math.random() * 20);
          const total = matched + Math.floor(Math.random() * 5);
          const pct = ((matched / total) * 100).toFixed(1);
          return {
            ...s,
            status: "synced",
            matchCount: `${matched} / ${total} SĐT (${pct}%)`,
            lastSynced: new Date().toLocaleString("vi-VN", {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric'})
          };
        }
        return s;
      }));

      toast({
        title: "Đồng bộ thành công",
        description: "Đã đẩy tệp khách hàng sang Facebook Custom Audience (Meta Ads)."
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="border border-blue-100 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/10">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <Facebook className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Đồng bộ Facebook Ads Custom Audience (Meta Marketing SDK)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                Tự động đẩy danh sách số điện thoại/Email khách hàng thu thập tại quầy POS và đa kênh sang tệp đối tượng tùy chỉnh của Facebook Ads Manager để tối ưu hóa quảng cáo bám đuổi (Retargeting).
              </p>
            </div>
          </div>
          <Button 
            type="button" 
            onClick={() => setCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Tạo tệp Marketing
          </Button>
        </CardContent>
      </Card>

      {/* Segments grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {segments.map((seg) => (
          <Card key={seg.id} className="border border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-extrabold text-sm text-foreground line-clamp-1">{seg.name}</h4>
                <Badge 
                  variant="outline"
                  className={
                    seg.status === "synced" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                    seg.status === "syncing" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                    seg.status === "error" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                    "bg-slate-500/10 text-slate-600 border-slate-500/20"
                  }
                >
                  {seg.status === "synced" ? "Đã đồng bộ" :
                   seg.status === "syncing" ? "Đang đồng bộ" :
                   seg.status === "error" ? "Lỗi kết nối" : "Chưa đồng bộ"}
                </Badge>
              </div>
              <CardDescription className="text-[11px] font-medium text-slate-400 mt-1">
                Điều kiện: {seg.condition}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3.5 flex-1 flex flex-col justify-between">
              <div className="bg-muted/30 p-2.5 rounded-lg border text-xs space-y-1.5 font-sans">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground font-semibold">FB Audience ID:</span>
                  <span className="font-mono font-bold text-foreground">{seg.fbAudienceId}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground font-semibold">Tỷ lệ khớp (Match):</span>
                  <span className="font-bold text-foreground">{seg.matchCount}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground font-semibold">Đồng bộ cuối:</span>
                  <span className="font-bold text-foreground">{seg.lastSynced}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSyncNow(seg.id)}
                  disabled={syncingId !== null}
                  className="h-8 text-xs font-semibold flex-1 gap-1.5 cursor-pointer"
                >
                  {seg.status === "syncing" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      Đang đẩy...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      Đồng bộ sang FB
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md w-full bg-white dark:bg-slate-900 p-5 rounded-xl shadow-lg border">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
              <Plus className="w-5 h-5 text-blue-600" />
              Tạo tệp khách hàng Marketing mới
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Tên tệp marketing</Label>
              <Input
                placeholder="Ví dụ: Khách hàng mua giá sỉ LTV > 10 triệu"
                value={newSegmentName}
                onChange={e => setNewSegmentName(e.target.value)}
                className="h-9 text-xs bg-muted/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Tổng chi tiêu tối thiểu</Label>
                <Select value={minLtv} onValueChange={setMinLtv}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-[160]">
                    <SelectItem value="0">Tất cả chi tiêu</SelectItem>
                    <SelectItem value="1000000">Từ 1,000,000đ</SelectItem>
                    <SelectItem value="5000000">Từ 5,000,000đ</SelectItem>
                    <SelectItem value="10000000">Từ 10,000,000đ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Số đơn hàng tối thiểu</Label>
                <Select value={minOrders} onValueChange={setMinOrders}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-[160]">
                    <SelectItem value="0">Tất cả số đơn</SelectItem>
                    <SelectItem value="1">Từ 1 đơn hàng</SelectItem>
                    <SelectItem value="5">Từ 5 đơn hàng</SelectItem>
                    <SelectItem value="10">Từ 10 đơn hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-3 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="h-9 text-xs"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleCreateSegment}
              className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
            >
              Tạo tệp & Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
