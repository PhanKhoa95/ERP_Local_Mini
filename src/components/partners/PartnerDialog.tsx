import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { z } from "zod";
import { useCustomerGroups } from "@/hooks/useCustomerGroups";
import { useWarehouses } from "@/hooks/useWarehouses";
import type { Partner } from "@/hooks/usePartners";

const partnerSchema = z.object({
  code: z.string().min(1, "Mã đối tác không được để trống").max(50),
  name: z.string().min(1, "Tên đối tác không được để trống").max(200),
  partner_type: z.enum(["customer", "supplier", "both"]),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  tax_id: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  group_id: z.string().optional().nullable(),
  branch_id: z.string().optional(),
  warehouse_id: z.string().optional(),
  promo_segment: z.enum(["all", "loyalty", "wholesale"]).optional(),
});

interface PartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: Partner | null;
  defaultType?: "customer" | "supplier";
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function PartnerDialog({ open, onOpenChange, partner, defaultType = "customer", onSubmit, isLoading }: PartnerDialogProps) {
  const { customerGroups } = useCustomerGroups();
  const { warehouses } = useWarehouses();
  
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    partner_type: defaultType as "customer" | "supplier" | "both",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
    notes: "",
    group_id: null as string | null,
    branch_id: "",
    warehouse_id: "",
    promo_segment: "all" as "all" | "loyalty" | "wholesale",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (partner) {
      setFormData({
        code: partner.code,
        name: partner.name,
        partner_type: partner.partner_type as "customer" | "supplier" | "both",
        email: partner.email || "",
        phone: partner.phone || "",
        address: partner.address || "",
        tax_id: partner.tax_id || "",
        notes: partner.notes || "",
        group_id: partner.group_id || null,
        branch_id: partner.branch_id || "",
        warehouse_id: partner.warehouse_id || "",
        promo_segment: partner.promo_segment || "all",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        partner_type: defaultType,
        email: "",
        phone: "",
        address: "",
        tax_id: "",
        notes: "",
        group_id: null,
        branch_id: "",
        warehouse_id: "",
        promo_segment: "all",
      });
    }
    setErrors({});
  }, [partner, defaultType, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = partnerSchema.parse({
        ...formData,
        email: formData.email || undefined,
        group_id: formData.group_id || null,
      });
      onSubmit(partner ? { id: partner.id, ...validated } : validated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) fieldErrors[error.path[0] as string] = error.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  const showCustomerGroup = formData.partner_type === "customer" || formData.partner_type === "both";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-popover text-popover-foreground z-50">
        <DialogHeader>
          <DialogTitle>{partner ? "Cập nhật thông tin Đối tác" : "Thêm mới Đối tác kinh doanh"}</DialogTitle>
          <DialogDescription>
            Cấu hình phân loại chi nhánh, kho xuất hàng mặc định và tệp khuyến mãi để đồng bộ tự động.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 py-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Mã đối tác *</Label>
              <Input
                id="code"
                placeholder="Ví dụ: KH-001, NCC-TECH"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={!!partner}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_type">Loại đối tác</Label>
              <Select
                value={formData.partner_type}
                onValueChange={(value: "customer" | "supplier" | "both") => 
                  setFormData({ ...formData, partner_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Khách hàng</SelectItem>
                  <SelectItem value="supplier">Nhà cung cấp</SelectItem>
                  <SelectItem value="both">Cả hai (KH + NCC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Tên đối tác *</Label>
            <Input
              id="name"
              placeholder="Nhập họ tên hoặc tên doanh nghiệp..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Classification Settings Section */}
          <div className="border p-3 rounded-lg bg-muted/20 space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" /> Thiết lập phân loại đồng bộ
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Chi nhánh phụ trách</Label>
                <Select
                  value={formData.branch_id || "none"}
                  onValueChange={(val) => setFormData({ ...formData, branch_id: val === "none" ? "" : val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Toàn quốc (Mặc định)</SelectItem>
                    <SelectItem value="Chi nhánh miền Bắc">Chi nhánh miền Bắc</SelectItem>
                    <SelectItem value="Chi nhánh miền Nam">Chi nhánh miền Nam</SelectItem>
                    <SelectItem value="Chi nhánh miền Trung">Chi nhánh miền Trung</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kho xuất mặc định</Label>
                <Select
                  value={formData.warehouse_id || "none"}
                  onValueChange={(val) => setFormData({ ...formData, warehouse_id: val === "none" ? "" : val })}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn kho mặc định" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tự động chọn (POS)</SelectItem>
                    {warehouses.filter(w => w.is_active).map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showCustomerGroup && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tệp khuyến mãi áp dụng</Label>
                  <Select
                    value={formData.promo_segment}
                    onValueChange={(val: any) => setFormData({ ...formData, promo_segment: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Khách lẻ / Tất cả (retail)</SelectItem>
                      <SelectItem value="loyalty">Thành viên VIP (loyalty)</SelectItem>
                      <SelectItem value="wholesale">Khách mua sỉ (wholesale)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {customerGroups.length > 0 && (
                  <div className="space-y-2">
                    <Label>Nhóm khách hàng (Loyalty)</Label>
                    <Select
                      value={formData.group_id || "none"}
                      onValueChange={(value) => setFormData({ ...formData, group_id: value === "none" ? null : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn nhóm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không phân nhóm</SelectItem>
                        {customerGroups.filter(g => g.is_active).map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name} (-{group.discount_percent}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                placeholder="Ví dụ: 0901234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_id">Mã số thuế</Label>
            <Input
              id="tax_id"
              placeholder="Nhập mã số thuế doanh nghiệp..."
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Textarea
              id="address"
              placeholder="Địa chỉ giao dịch, nhận hàng..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú thêm</Label>
            <Textarea
              id="notes"
              placeholder="Thông tin nội bộ..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {partner ? "Cập nhật" : "Kích hoạt"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
