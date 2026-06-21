import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import type { Voucher } from "@/hooks/useVouchers";

interface VoucherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voucher?: Voucher | null;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function VoucherDialog({ open, onOpenChange, voucher, onSubmit, isLoading }: VoucherDialogProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 0,
    min_order_value: 0,
    max_discount: 0,
    usage_limit: 0,
    start_date: "",
    end_date: "",
    is_active: true,
  });

  useEffect(() => {
    if (voucher) {
      setFormData({
        code: voucher.code,
        name: voucher.name,
        description: voucher.description || "",
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value,
        min_order_value: voucher.min_order_value || 0,
        max_discount: voucher.max_discount || 0,
        usage_limit: voucher.usage_limit || 0,
        start_date: voucher.start_date ? voucher.start_date.split("T")[0] : "",
        end_date: voucher.end_date ? voucher.end_date.split("T")[0] : "",
        is_active: voucher.is_active,
      });
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        discount_type: "percentage",
        discount_value: 0,
        min_order_value: 0,
        max_discount: 0,
        usage_limit: 0,
        start_date: "",
        end_date: "",
        is_active: true,
      });
    }
  }, [voucher, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      code: formData.code.toUpperCase(),
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      usage_limit: formData.usage_limit || null,
      max_discount: formData.max_discount || null,
    };
    onSubmit(voucher ? { id: voucher.id, ...data } : data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{voucher ? "Sửa mã giảm giá" : "Thêm mã giảm giá"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mã voucher *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VD: SALE20"
                disabled={!!voucher}
              />
            </div>
            <div className="space-y-2">
              <Label>Tên *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Giảm 20%"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loại giảm giá</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(v) => setFormData({ ...formData, discount_type: v as "percentage" | "fixed" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                  <SelectItem value="fixed">Số tiền cố định (đ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Giá trị giảm *</Label>
              <Input
                type="number"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Đơn tối thiểu</Label>
              <Input
                type="number"
                value={formData.min_order_value}
                onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Giảm tối đa</Label>
              <Input
                type="number"
                value={formData.max_discount}
                onChange={(e) => setFormData({ ...formData, max_discount: Number(e.target.value) })}
                placeholder="0 = không giới hạn"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ngày bắt đầu</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ngày kết thúc</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Giới hạn lượt dùng</Label>
              <Input
                type="number"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                placeholder="0 = không giới hạn"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label>Kích hoạt</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {voucher ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
