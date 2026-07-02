import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Loader2, CheckCircle2, XCircle, Truck } from "lucide-react";
import { useShippingCarriers } from "@/hooks/useShippingCarriers";
import { Switch } from "@/components/ui/switch";

const CARRIER_OPTIONS = [
  { code: "ghn", name: "Giao Hàng Nhanh (GHN)", color: "#F97316" },
  { code: "ghtk", name: "Giao Hàng Tiết Kiệm", color: "#22C55E" },
  { code: "vtp", name: "Viettel Post", color: "#EF4444" },
  { code: "jnt", name: "J&T Express", color: "#DC2626" },
  { code: "spx", name: "Shopee Express (SPX)", color: "#F97316" },
];

export function ShippingCarriersTab() {
  const { carriers, createCarrier, updateCarrier, deleteCarrier, testConnection } = useShippingCarriers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ code: "", name: "", api_token: "", shop_id: "" });

  const openDialog = (carrier?: any) => {
    if (carrier) {
      setEditing(carrier);
      setForm({ code: carrier.code, name: carrier.name, api_token: carrier.api_token || "", shop_id: carrier.shop_id || "" });
    } else {
      setEditing(null);
      setForm({ code: "", name: "", api_token: "", shop_id: "" });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateCarrier.mutateAsync({ id: editing.id, name: form.name, api_token: form.api_token, shop_id: form.shop_id });
    } else {
      await createCarrier.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const handleCodeChange = (code: string) => {
    const opt = CARRIER_OPTIONS.find(c => c.code === code);
    setForm({ ...form, code, name: opt?.name || code });
  };

  return (
    <>
      {/* Pancake Shipping Advanced Config */}
      <Card className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 mb-6">
        <CardHeader className="p-0 border-b pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Cấu hình vận chuyển Pancake
          </CardTitle>
          <CardDescription className="text-xs">Thiết lập tham số đồng bộ và quy tắc gửi đơn sang hãng vận chuyển</CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-4 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cấu hình Trạng thái */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground uppercase">Trạng thái vận chuyển</h4>
              <div className="flex items-center justify-between p-2 rounded-lg bg-card border shadow-xs">
                <Label htmlFor="sync-cancel" className="text-xs text-muted-foreground flex flex-col gap-0.5 cursor-pointer">
                  <span>Không đồng bộ trạng thái huỷ đơn từ DVVC</span>
                  <span className="text-[10px] text-muted-foreground/80">Khi hãng vận chuyển huỷ, giữ nguyên trạng thái đơn</span>
                </Label>
                <Switch id="sync-cancel" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-card border shadow-xs">
                <Label htmlFor="manual-return" className="text-xs text-muted-foreground flex flex-col gap-0.5 cursor-pointer">
                  <span>Trả hàng thủ công</span>
                  <span className="text-[10px] text-muted-foreground/80">Cho phép kiểm soát hoàn trả thủ công</span>
                </Label>
                <Switch id="manual-return" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-card border shadow-xs">
                <Label htmlFor="auto-schedule" className="text-xs text-muted-foreground flex flex-col gap-0.5 cursor-pointer">
                  <span>Tự động cập nhật đơn hẹn ngày gửi về Chờ xác nhận</span>
                  <span className="text-[10px] text-muted-foreground/80">Hẹn lịch tự động cập nhật về trạng thái chờ</span>
                </Label>
                <Switch id="auto-schedule" defaultChecked />
              </div>
            </div>

            {/* Dịch vụ vận chuyển */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground uppercase">Dịch vụ & Kích thước</h4>
              <div className="flex items-center justify-between p-2 rounded-lg bg-card border shadow-xs">
                <Label htmlFor="return-fee" className="text-xs text-muted-foreground flex flex-col gap-0.5 cursor-pointer">
                  <span>Thu phí vận chuyển với đơn hoàn</span>
                  <span className="text-[10px] text-muted-foreground/80">Tự động cộng phí ship hoàn vào chi phí đơn hàng</span>
                </Label>
                <Switch id="return-fee" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-card border shadow-xs">
                <Label htmlFor="cheapest-carrier" className="text-xs text-muted-foreground flex flex-col gap-0.5 cursor-pointer">
                  <span>Tự động chọn dịch vụ với giá rẻ nhất</span>
                  <span className="text-[10px] text-muted-foreground/80">So sánh giá và tự động chỉ định hãng rẻ nhất</span>
                </Label>
                <Switch id="cheapest-carrier" />
              </div>
              
              {/* Kích thước */}
              <div className="p-2 rounded-lg bg-card border shadow-xs space-y-2">
                <Label className="text-xs text-muted-foreground">Kích thước gói hàng mặc định (cm)</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" placeholder="Dài" defaultValue={10} className="h-8 text-xs text-center" />
                  <span className="text-muted-foreground text-xs">x</span>
                  <Input type="number" placeholder="Rộng" defaultValue={10} className="h-8 text-xs text-center" />
                  <span className="text-muted-foreground text-xs">x</span>
                  <Input type="number" placeholder="Cao" defaultValue={10} className="h-8 text-xs text-center" />
                </div>
              </div>
            </div>
          </div>

          {/* Đơn vị vận chuyển */}
          <div className="p-3 rounded-lg bg-card border border-primary/20 shadow-xs space-y-3">
            <h4 className="text-xs font-semibold text-primary uppercase">Đơn vị vận chuyển</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="save-carrier" className="text-xs text-muted-foreground flex flex-col gap-0.5 cursor-pointer">
                <span>Lưu lại đơn vị vận chuyển</span>
                <span className="text-[10px] text-muted-foreground/80">Tự động chọn lại hãng vận chuyển cho các đơn hàng tiếp theo</span>
              </Label>
              <Switch id="save-carrier" defaultChecked />
            </div>
            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <span className="text-muted-foreground">Đơn vị vận chuyển bổ sung</span>
              <Button variant="outline" size="sm" className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/5 cursor-pointer">
                Chỉnh sửa danh sách
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Đơn vị vận chuyển</CardTitle>
            <CardDescription>Kết nối API các hãng giao hàng Việt Nam</CardDescription>
          </div>
          <Button onClick={() => openDialog()} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Thêm hãng vận chuyển
          </Button>
        </CardHeader>
        <CardContent>
          {carriers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có hãng vận chuyển nào</p>
              <p className="text-sm">Thêm hãng vận chuyển để bắt đầu tạo vận đơn tự động</p>
            </div>
          ) : (
            <div className="space-y-3">
              {carriers.map((carrier) => {
                const opt = CARRIER_OPTIONS.find(c => c.code === carrier.code);
                return (
                  <div key={carrier.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-4">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: opt?.color || "#6B7280" }}
                      >
                        {carrier.code.toUpperCase().slice(0, 3)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{carrier.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {carrier.api_token ? "API Token: ••••••" + carrier.api_token.slice(-4) : "Chưa cấu hình token"}
                          {carrier.shop_id && ` • Shop: ${carrier.shop_id}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={carrier.is_active ? "default" : "secondary"}>
                        {carrier.is_active ? "Hoạt động" : "Tắt"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection.mutate(carrier.id)}
                        disabled={testConnection.isPending}
                      >
                        {testConnection.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Test"}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDialog(carrier)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteCarrier.mutate(carrier.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa hãng vận chuyển" : "Thêm hãng vận chuyển"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editing && (
              <div className="space-y-2">
                <Label>Chọn hãng vận chuyển</Label>
                <Select value={form.code} onValueChange={handleCodeChange}>
                  <SelectTrigger><SelectValue placeholder="Chọn hãng" /></SelectTrigger>
                  <SelectContent>
                    {CARRIER_OPTIONS.map(opt => (
                      <SelectItem key={opt.code} value={opt.code}>{opt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>API Token</Label>
              <Input
                type="password"
                value={form.api_token}
                onChange={e => setForm({ ...form, api_token: e.target.value })}
                placeholder="Nhập API Token từ hãng vận chuyển"
              />
              <p className="text-xs text-muted-foreground">
                {form.code === "ghn" && "Lấy token tại: https://khachhang.ghn.vn → API Token"}
                {form.code === "ghtk" && "Lấy token tại: https://khachhang.giaohangtietkiem.vn → API Token"}
                {form.code === "vtp" && "Lấy token tại: https://partner.viettelpost.vn"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Shop ID</Label>
              <Input
                value={form.shop_id}
                onChange={e => setForm({ ...form, shop_id: e.target.value })}
                placeholder="ID cửa hàng trên hãng vận chuyển"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={!form.code || createCarrier.isPending || updateCarrier.isPending}>
                {(createCarrier.isPending || updateCarrier.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Cập nhật" : "Thêm mới"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
