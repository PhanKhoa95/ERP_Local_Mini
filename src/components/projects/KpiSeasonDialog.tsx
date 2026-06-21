import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useKpiSeasons, KpiSeason } from "@/hooks/useKpiSeasons";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  season?: KpiSeason | null;
}

export function KpiSeasonDialog({ open, onOpenChange, season }: Props) {
  const { createSeason, updateSeason } = useKpiSeasons();
  const [form, setForm] = useState({
    name: "",
    type: "quarter",
    start_date: "",
    end_date: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (season) {
      setForm({
        name: season.name,
        type: season.type,
        start_date: season.start_date,
        end_date: season.end_date,
        description: season.description || "",
        is_active: season.is_active,
      });
    } else {
      setForm({ name: "", type: "quarter", start_date: "", end_date: "", description: "", is_active: true });
    }
  }, [season, open]);

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date,
      description: form.description || null,
      is_active: form.is_active,
    };

    if (season) {
      updateSeason.mutate({ id: season.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      createSeason.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{season ? "Sửa kỳ KPI" : "Tạo kỳ KPI mới"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tên kỳ *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Q1 2026" />
          </div>
          <div className="space-y-2">
            <Label>Loại kỳ</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Tháng</SelectItem>
                <SelectItem value="quarter">Quý</SelectItem>
                <SelectItem value="half_year">Nửa năm</SelectItem>
                <SelectItem value="year">Năm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ngày bắt đầu *</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Ngày kết thúc *</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            <Label>Đang hoạt động</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={!form.name || !form.start_date || !form.end_date || createSeason.isPending || updateSeason.isPending}>
            {season ? "Cập nhật" : "Tạo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
