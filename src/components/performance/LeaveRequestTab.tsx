import { useState } from "react";
import { useLeaveRequests } from "@/hooks/useLeaveRequests";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Plus, TreePalm, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format, differenceInBusinessDays, parseISO } from "date-fns";

const LEAVE_TYPES = [
  { value: "annual", label: "Nghỉ phép năm" },
  { value: "sick", label: "Nghỉ ốm" },
  { value: "personal", label: "Nghỉ việc riêng" },
  { value: "maternity", label: "Nghỉ thai sản" },
  { value: "other", label: "Khác" },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  submitted: { label: "Chờ duyệt", variant: "secondary" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Từ chối", variant: "destructive" },
};

export function LeaveRequestTab() {
  const { myLeaveRequests, isLoading, approvedDays, remainingDays, annualAllowance, submitLeave } = useLeaveRequests();
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leave_type: "annual", start_date: "", end_date: "", reason: "",
  });

  const days = form.start_date && form.end_date
    ? Math.max(1, differenceInBusinessDays(parseISO(form.end_date), parseISO(form.start_date)) + 1)
    : 0;

  const handleSubmit = async () => {
    if (!form.start_date || !form.end_date || !form.reason.trim()) return;
    setSubmitting(true);
    try {
      await submitLeave({ ...form, days });
      setShowCreate(false);
      setForm({ leave_type: "annual", start_date: "", end_date: "", reason: "" });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{[...Array(2)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="h-20" /></Card>)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Nghỉ phép</h2>
          <p className="text-muted-foreground text-sm">Quản lý yêu cầu nghỉ phép của bạn</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Xin nghỉ phép</Button>
      </div>

      {/* Balance */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <TreePalm className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold text-green-600">{remainingDays}</div>
            <p className="text-xs text-muted-foreground">Ngày phép còn lại</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CalendarDays className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{approvedDays}</div>
            <p className="text-xs text-muted-foreground">Đã sử dụng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <div className="text-2xl font-bold">{annualAllowance}</div>
            <p className="text-xs text-muted-foreground">Tổng phép năm</p>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử nghỉ phép</CardTitle>
          <CardDescription>Các yêu cầu nghỉ phép đã gửi</CardDescription>
        </CardHeader>
        <CardContent>
          {myLeaveRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Chưa có yêu cầu nghỉ phép nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myLeaveRequests.map(req => {
                const data = req.description ? JSON.parse(req.description) : {};
                const st = statusMap[req.status] || statusMap.submitted;
                return (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{req.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {data.start_date && format(parseISO(data.start_date), "dd/MM/yyyy")}
                        {data.end_date && ` → ${format(parseISO(data.end_date), "dd/MM/yyyy")}`}
                        {data.reason && ` • ${data.reason}`}
                      </p>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Xin nghỉ phép</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Loại phép</Label>
              <Select value={form.leave_type} onValueChange={v => setForm({ ...form, leave_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAVE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Từ ngày</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>Đến ngày</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            {days > 0 && <p className="text-sm text-muted-foreground">Số ngày nghỉ: <span className="font-medium text-foreground">{days} ngày</span></p>}
            <div><Label>Lý do *</Label><Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Nêu lý do xin nghỉ phép..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.start_date || !form.end_date || !form.reason.trim()}>Gửi yêu cầu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
