import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Truck, X } from "lucide-react";
import { useShippingZones, type ShippingZone } from "@/hooks/useShippingZones";

const VIETNAM_PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định",
  "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk",
  "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội",
  "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hồ Chí Minh", "Hưng Yên", "Khánh Hòa",
  "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định",
  "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi",
  "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa",
  "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

export function ShippingZonesTab() {
  const { shippingZones, isLoading, createZone, updateZone, deleteZone } = useShippingZones();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    provinces: [] as string[],
    base_fee: 0,
    free_shipping_threshold: 0,
    is_active: true,
  });

  const openDialog = (zone?: ShippingZone) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({
        name: zone.name,
        provinces: zone.provinces,
        base_fee: zone.base_fee,
        free_shipping_threshold: zone.free_shipping_threshold || 0,
        is_active: zone.is_active,
      });
    } else {
      setEditingZone(null);
      setFormData({
        name: "",
        provinces: [],
        base_fee: 0,
        free_shipping_threshold: 0,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      free_shipping_threshold: formData.free_shipping_threshold || null,
    };
    if (editingZone) {
      await updateZone.mutateAsync({ id: editingZone.id, ...data });
    } else {
      await createZone.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa vùng vận chuyển này?")) {
      await deleteZone.mutateAsync(id);
    }
  };

  const toggleProvince = (province: string) => {
    setFormData({
      ...formData,
      provinces: formData.provinces.includes(province)
        ? formData.provinces.filter((p) => p !== province)
        : [...formData.provinces, province],
    });
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat("vi-VN").format(v) + "đ";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Vùng vận chuyển</CardTitle>
            <CardDescription>Cấu hình phí ship theo khu vực</CardDescription>
          </div>
          <Button onClick={() => openDialog()} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Thêm vùng
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shippingZones.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có vùng vận chuyển nào</p>
              </div>
            ) : (
              shippingZones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-secondary/30 gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{zone.name}</span>
                        <Badge variant={zone.is_active ? "default" : "secondary"}>
                          {zone.is_active ? "Hoạt động" : "Tắt"}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">
                        Phí ship: {formatCurrency(zone.base_fee)}
                        {zone.free_shipping_threshold && (
                          <span className="text-success ml-2">
                            | Free ship từ {formatCurrency(zone.free_shipping_threshold)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {zone.provinces.length} tỉnh/thành
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(zone)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(zone.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingZone ? "Sửa vùng vận chuyển" : "Thêm vùng vận chuyển"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tên vùng *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Miền Bắc"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phí ship (đ) *</Label>
                <Input
                  type="number"
                  value={formData.base_fee}
                  onChange={(e) => setFormData({ ...formData, base_fee: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Free ship từ (đ)</Label>
                <Input
                  type="number"
                  value={formData.free_shipping_threshold}
                  onChange={(e) => setFormData({ ...formData, free_shipping_threshold: Number(e.target.value) })}
                  placeholder="0 = không áp dụng"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label>Kích hoạt</Label>
            </div>

            <div className="space-y-2">
              <Label>Tỉnh/Thành phố ({formData.provinces.length} đã chọn)</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
                {formData.provinces.map((p) => (
                  <Badge key={p} variant="secondary" className="cursor-pointer" onClick={() => toggleProvince(p)}>
                    {p} <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto bg-secondary/20">
                {VIETNAM_PROVINCES.filter((p) => !formData.provinces.includes(p)).map((p) => (
                  <Badge
                    key={p}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => toggleProvince(p)}
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createZone.isPending || updateZone.isPending}>
                {(createZone.isPending || updateZone.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingZone ? "Cập nhật" : "Thêm mới"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
