import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, ListFilter, Trash } from "lucide-react";

interface CustomFieldsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customFields: any[];
  createCustomField: any;
}

export function CustomFieldsDialog({ open, onOpenChange, customFields, createCustomField }: CustomFieldsDialogProps) {
  const [fieldName, setFieldName] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<"text" | "number" | "date">("text");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName || !fieldLabel) return;
    
    // Normalize field name to snake_case
    const normalizedName = fieldName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");

    await createCustomField.mutateAsync({
      entity_type: "lead",
      field_name: normalizedName,
      field_label: fieldLabel.trim(),
      field_type: fieldType
    });

    setFieldName("");
    setFieldLabel("");
    setFieldType("text");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-background text-foreground text-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
            <ListFilter className="h-4.5 w-4.5 text-indigo-500" /> Cấu hình các Trường tùy chỉnh động (Leads)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tự định nghĩa thêm các cột thông tin đặc thù của doanh nghiệp để lưu trữ cho đối tượng Leads.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Add Form */}
          <form onSubmit={handleSubmit} className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/40 space-y-3">
            <div className="text-[10px] font-bold text-foreground">THÊM TRƯỜNG MỚI:</div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="custFieldName" className="font-semibold">Mã trường (slug) *</Label>
                <Input
                  id="custFieldName"
                  className="h-8 text-xs"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="e.g., size_ao"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="custFieldLabel" className="font-semibold">Nhãn hiển thị *</Label>
                <Input
                  id="custFieldLabel"
                  className="h-8 text-xs"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  placeholder="e.g., Size Áo"
                  required
                />
              </div>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div className="space-y-1 flex-1">
                <Label className="font-semibold">Kiểu dữ liệu</Label>
                <Select
                  value={fieldType}
                  onValueChange={(val: any) => setFieldType(val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Chọn kiểu..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-foreground">
                    <SelectItem value="text">Chữ (Text)</SelectItem>
                    <SelectItem value="number">Số (Number)</SelectItem>
                    <SelectItem value="date">Ngày (Date)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold h-8">
                Tạo trường
              </Button>
            </div>
          </form>

          {/* List of existing custom fields */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-foreground uppercase tracking-tight">Các trường đang hoạt động:</div>
            <div className="border rounded-xl divide-y bg-card">
              {customFields.map((f) => (
                <div key={f.id} className="p-2.5 flex items-center justify-between text-[11px] hover:bg-secondary/5">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">{f.field_label}</div>
                    <div className="text-[9px] text-muted-foreground font-mono">
                      Mã: {f.field_name} | Kiểu: {f.field_type.toUpperCase()}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[8px] font-bold uppercase rounded-full">
                    Custom
                  </Badge>
                </div>
              ))}
              {customFields.length === 0 && (
                <div className="p-6 text-center text-muted-foreground italic text-[11px]">
                  Chưa định nghĩa trường tùy chỉnh nào.
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng cấu hình
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
