import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useCustomerGroups } from "@/hooks/useCustomerGroups";
import type { Tables } from "@/integrations/supabase/types";

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
});

type Partner = Tables<"partners">;

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
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    partner_type: defaultType as "customer" | "supplier" | "both",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
    notes: "",
    group_id: "" as string | null,
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{partner ? "Sửa đối tác" : "Thêm đối tác mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Mã đối tác *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={!!partner}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner_type">Loại</Label>
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
                  <SelectItem value="both">Cả hai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Tên đối tác *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {showCustomerGroup && customerGroups.length > 0 && (
            <div className="space-y-2">
              <Label>Nhóm khách hàng</Label>
              <Select
                value={formData.group_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, group_id: value === "none" ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhóm khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có nhóm</SelectItem>
                  {customerGroups.filter(g => g.is_active).map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: group.color }}
                        />
                        {group.name} ({group.discount_percent}% giảm giá)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
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
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
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
              {partner ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
