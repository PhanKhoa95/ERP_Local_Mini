import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useBookings, getIndustryResources } from "@/hooks/useBookings";
import { Loader2 } from "lucide-react";

const INDUSTRIES = [
  { value: "real_estate", label: "Bất động sản" },
  { value: "manufacturing", label: "Sản xuất" },
  { value: "services", label: "Dịch vụ" },
  { value: "retail", label: "Bán lẻ" },
  { value: "tech", label: "Công nghệ" },
  { value: "healthcare", label: "Y tế" },
  { value: "construction", label: "Xây dựng" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDialog({ open, onOpenChange }: Props) {
  const { createBooking } = useBookings();
  const [form, setForm] = useState({
    industry: "services", resource_type: "room", resource_name: "",
    customer_name: "", customer_phone: "", customer_email: "",
    start_time: "", end_time: "", notes: "",
    voucher_on_complete: false, voucher_discount: 0, token_reward_on_complete: 0,
  });

  const resources = getIndustryResources(form.industry);

  const handleSubmit = () => {
    createBooking.mutate({
      ...form,
      booking_type: form.industry === "healthcare" ? "medical" : form.industry === "construction" ? "construction" : "consultation",
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setForm({ industry: "services", resource_type: "room", resource_name: "", customer_name: "", customer_phone: "", customer_email: "", start_time: "", end_time: "", notes: "", voucher_on_complete: false, voucher_discount: 0, token_reward_on_complete: 0 });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Đặt lịch mới</DialogTitle>
          <DialogDescription>Hệ thống tự kiểm tra trùng lịch trước khi đặt</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ngành</Label>
              <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v, resource_type: getIndustryResources(v).types[0] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Loại tài nguyên</Label>
              <Select value={form.resource_type} onValueChange={v => setForm(f => ({ ...f, resource_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {resources.types.map(t => <SelectItem key={t} value={t}>{resources.labels[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Tên tài nguyên</Label>
            <Input value={form.resource_name} onChange={e => setForm(f => ({ ...f, resource_name: e.target.value }))} placeholder="VD: Phòng 101, Bác sĩ Nguyễn..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Khách hàng</Label>
              <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="Tên khách hàng" />
            </div>
            <div>
              <Label>SĐT</Label>
              <Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Bắt đầu</Label>
              <Input type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div>
              <Label>Kết thúc</Label>
              <Input type="datetime-local" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-lg border">
            <Switch checked={form.voucher_on_complete} onCheckedChange={v => setForm(f => ({ ...f, voucher_on_complete: v }))} />
            <Label className="flex-1">Tặng voucher khi hoàn thành</Label>
            {form.voucher_on_complete && (
              <Input type="number" className="w-20" placeholder="%" value={form.voucher_discount || ""} onChange={e => setForm(f => ({ ...f, voucher_discount: Number(e.target.value) }))} />
            )}
          </div>

          <div className="flex items-center gap-4 p-3 rounded-lg border">
            <Label className="flex-1">Token thưởng khi hoàn thành</Label>
            <Input type="number" className="w-24" placeholder="Số token" value={form.token_reward_on_complete || ""} onChange={e => setForm(f => ({ ...f, token_reward_on_complete: Number(e.target.value) }))} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={!form.customer_name || !form.resource_name || !form.start_time || !form.end_time || createBooking.isPending}>
            {createBooking.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Đặt lịch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
