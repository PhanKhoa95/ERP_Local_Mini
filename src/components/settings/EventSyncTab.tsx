import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Save, Facebook, Link2, Play, CheckCircle2, ShieldAlert } from "lucide-react";

interface CapiEvent {
  id: string;
  name: "Purchase" | "InitiateCheckout" | "AddToCart";
  triggerStatus: string;
  defaultValue: string;
  isActive: boolean;
}

export function EventSyncTab() {
  const { toast } = useToast();

  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const [events, setEvents] = useState<CapiEvent[]>([
    { id: "ev-1", name: "Purchase", triggerStatus: "Gửi hàng đi", defaultValue: "200.000", isActive: true },
    { id: "ev-2", name: "InitiateCheckout", triggerStatus: "Xác nhận đơn hàng", defaultValue: "0", isActive: true }
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CapiEvent | null>(null);

  // Event form states
  const [formName, setFormName] = useState<CapiEvent["name"]>("Purchase");
  const [formTrigger, setFormTrigger] = useState("Mới");
  const [formDefaultVal, setFormDefaultVal] = useState("0");

  const handleConnect = () => {
    if (!pixelId.trim() || !accessToken.trim()) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng nhập đầy đủ Pixel ID và Access Token" });
      return;
    }
    setIsConnected(true);
    toast({ title: "Kết nối thành công", description: "Facebook Conversions API (CAPI) đã được thiết lập." });
  };

  const handleTestEvent = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      toast({
        title: "Test thành công",
        description: "Đã gửi sự kiện Purchase giả lập lên Trình quản lý sự kiện Facebook."
      });
    }, 1200);
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormName("Purchase");
    setFormTrigger("Mới");
    setFormDefaultVal("0");
    setDialogOpen(true);
  };

  const handleOpenEdit = (ev: CapiEvent) => {
    setEditingEvent(ev);
    setFormName(ev.name);
    setFormTrigger(ev.triggerStatus);
    setFormDefaultVal(ev.defaultValue);
    setDialogOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    toast({ title: "Đã xoá sự kiện", description: "Đã gỡ cấu hình đồng bộ sự kiện này." });
  };

  const handleSaveEvent = () => {
    if (editingEvent) {
      setEvents(events.map(e => e.id === editingEvent.id ? { ...e, name: formName, triggerStatus: formTrigger, defaultValue: formDefaultVal } : e));
      toast({ title: "Cập nhật thành công", description: "Đã lưu thay đổi sự kiện đồng bộ." });
    } else {
      const newEv: CapiEvent = {
        id: "ev-" + Date.now(),
        name: formName,
        triggerStatus: formTrigger,
        defaultValue: formDefaultVal,
        isActive: true
      };
      setEvents([...events, newEv]);
      toast({ title: "Thêm thành công", description: "Sự kiện đồng bộ mới đã được cấu hình." });
    }
    setDialogOpen(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Cấu hình Pixel & API (Trái) */}
      <Card className="xl:col-span-5 border border-border">
        <CardHeader className="border-b pb-3 mb-4 flex flex-row items-center gap-2 space-y-0">
          <Facebook className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <CardTitle className="text-sm font-semibold">Cấu hình Conversions API (CAPI)</CardTitle>
            <CardDescription className="text-xs">Đồng bộ lượt mua và giá trị đơn hàng thực tế lên Trình quản lý quảng cáo Facebook.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-id" className="text-xs">Facebook Pixel ID / ID tập dữ liệu *</Label>
            <Input
              id="p-id"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              placeholder="VD: 123456789012345"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="capi-token" className="text-xs">Mã truy cập Conversions API (Access Token) *</Label>
            <Input
              id="capi-token"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="EAAG..."
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"} className={`text-[10px] ${isConnected ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}>
                {isConnected ? "Đã kết nối" : "Chưa kết nối"}
              </Badge>
              {isConnected && (
                <Button
                  onClick={handleTestEvent}
                  disabled={isTesting}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] gap-1 cursor-pointer"
                >
                  <Play className="h-3 w-3 text-success" />
                  {isTesting ? "Đang gửi..." : "Gửi sự kiện test"}
                </Button>
              )}
            </div>
            <Button onClick={handleConnect} size="sm" className="h-8 gap-1.5 cursor-pointer">
              <Link2 className="h-3.5 w-3.5" />
              Lưu kết nối
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cấu hình sự kiện (Phải) */}
      <Card className="xl:col-span-7 border border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b mb-4">
          <div>
            <CardTitle className="text-sm font-semibold">Quy tắc bắn sự kiện mua hàng</CardTitle>
            <CardDescription className="text-xs">Thiết lập trạng thái kích hoạt bắn sự kiện tương ứng của Facebook Pixel.</CardDescription>
          </div>
          <Button onClick={handleOpenCreate} size="sm" className="h-8 gap-1.5 cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            Thêm sự kiện
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Đồng bộ</TableHead>
                  <TableHead className="text-xs">Tên sự kiện Facebook</TableHead>
                  <TableHead className="text-xs">Kích hoạt khi đơn đạt trạng thái</TableHead>
                  <TableHead className="text-xs">Giá trị mặc định (Đơn 0đ)</TableHead>
                  <TableHead className="text-xs text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((ev) => (
                  <TableRow key={ev.id} className="hover:bg-muted/30">
                    <TableCell className="py-2.5">
                      <Switch
                        checked={ev.isActive}
                        onCheckedChange={(checked) => setEvents(events.map(x => x.id === ev.id ? { ...x, isActive: checked } : x))}
                        className="scale-75 origin-left"
                      />
                    </TableCell>
                    <TableCell className="py-2.5 font-semibold text-xs text-blue-600">{ev.name}</TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="secondary" className="text-[9px]">
                        {ev.triggerStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-xs font-semibold">{ev.defaultValue}đ</TableCell>
                    <TableCell className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => handleOpenEdit(ev)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/5 cursor-pointer" onClick={() => handleDeleteEvent(ev.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog create/edit event config */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editingEvent ? "Cập nhật sự kiện đồng bộ" : "Thêm mới sự kiện đồng bộ"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập tên sự kiện Facebook và điều kiện kích hoạt bắn sự kiện từ trạng thái đơn hàng POS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Sự kiện Facebook</Label>
              <Select value={formName} onValueChange={(val: any) => setFormName(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectTrigger className="hidden" />
                <SelectContent className="bg-popover text-foreground z-50">
                  <SelectItem value="Purchase" className="text-xs">Purchase (Mua hàng)</SelectItem>
                  <SelectItem value="InitiateCheckout" className="text-xs">InitiateCheckout (Khởi tạo thanh toán)</SelectItem>
                  <SelectItem value="AddToCart" className="text-xs">AddToCart (Thêm vào giỏ hàng)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Đơn hàng chuyển sang trạng thái:</Label>
              <Select value={formTrigger} onValueChange={setFormTrigger}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectTrigger className="hidden" />
                <SelectContent className="bg-popover text-foreground z-50">
                  <SelectItem value="Mới" className="text-xs">Mới</SelectItem>
                  <SelectItem value="Xác nhận đơn hàng" className="text-xs">Xác nhận đơn hàng</SelectItem>
                  <SelectItem value="Đang đóng hàng" className="text-xs">Đang đóng hàng</SelectItem>
                  <SelectItem value="Gửi hàng đi" className="text-xs">Gửi hàng đi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="default-v" className="text-xs">Giá trị mặc định đồng bộ (khi đơn hàng thực tế có giá trị 0đ)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="default-v"
                  value={formDefaultVal}
                  onChange={(e) => setFormDefaultVal(e.target.value)}
                  className="h-9 text-xs w-28 text-center"
                />
                <span className="text-xs text-muted-foreground">đ</span>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="h-8 text-xs cursor-pointer">
              Hủy
            </Button>
            <Button size="sm" onClick={handleSaveEvent} className="h-8 text-xs cursor-pointer bg-blue-600 hover:bg-blue-700">
              <Save className="h-3.5 w-3.5 mr-1" />
              Lưu sự kiện
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
