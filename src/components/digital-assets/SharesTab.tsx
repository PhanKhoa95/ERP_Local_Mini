import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProjectShares } from "@/hooks/useProjectShares";
import { useProjects } from "@/hooks/useProjects";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useStepUpAuth } from "@/hooks/useStepUpAuth";
import { StepUpAuthDialog } from "@/components/auth/StepUpAuthDialog";

const COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 76%, 36%)", "hsl(45, 93%, 47%)", "hsl(280, 70%, 50%)", "hsl(0, 72%, 51%)"];

export function SharesTab() {
  const { shares, isLoading, createShare, totalShares } = useProjectShares();
  const { projects } = useProjects();
  const stepUp = useStepUpAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ project_id: "", holder_user_id: "", share_count: "", share_type: "founder" });

  const handleSubmit = () => {
    if (!form.project_id || !form.holder_user_id || !form.share_count) return;
    createShare.mutate({
      project_id: form.project_id,
      holder_user_id: form.holder_user_id,
      share_count: Number(form.share_count),
      share_type: form.share_type,
    }, { onSuccess: () => { setOpen(false); setForm({ project_id: "", holder_user_id: "", share_count: "", share_type: "founder" }); } });
  };

  // Pie data by share_type
  const typeMap = shares.reduce((acc, s) => {
    acc[s.share_type] = (acc[s.share_type] || 0) + Number(s.share_count);
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Cap Table - Cổ phiếu dự án</h3>
          <p className="text-sm text-muted-foreground">Tổng: {totalShares.toLocaleString()} cổ phần</p>
        </div>
        <Button onClick={async () => {
          const result = await stepUp.requireStepUp("share_transfer");
          if (result.approved) setOpen(true);
        }}><Plus className="h-4 w-4 mr-2" />Phát hành</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Phát hành cổ phiếu</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Dự án</Label>
                <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn dự án" /></SelectTrigger>
                  <SelectContent>
                    {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>User ID người nhận</Label>
                <Input value={form.holder_user_id} onChange={e => setForm(f => ({ ...f, holder_user_id: e.target.value }))} placeholder="UUID" />
              </div>
              <div>
                <Label>Số lượng cổ phần</Label>
                <Input type="number" value={form.share_count} onChange={e => setForm(f => ({ ...f, share_count: e.target.value }))} />
              </div>
              <div>
                <Label>Loại</Label>
                <Select value={form.share_type} onValueChange={v => setForm(f => ({ ...f, share_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder">Founder</SelectItem>
                    <SelectItem value="esop">ESOP</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} disabled={createShare.isPending} className="w-full">
                {createShare.isPending ? "Đang xử lý..." : "Phát hành"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-sm">Danh sách cổ phần</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dự án</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shares.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Chưa có cổ phiếu nào</TableCell></TableRow>
                )}
                {shares.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.project_id?.slice(0, 8)}...</TableCell>
                    <TableCell><Badge variant="outline">{s.share_type}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{Number(s.share_count).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={s.is_vested ? "default" : "secondary"}>
                        {s.is_vested ? "Đã vest" : "Chưa vest"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(s.created_at), "dd/MM/yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Phân bổ</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>
      </div>
      <StepUpAuthDialog
        open={stepUp.isOpen}
        onOpenChange={() => {}}
        action={stepUp.currentAction}
        isVerifying={stepUp.isVerifying}
        onVerifyPassword={stepUp.verifyPassword}
        onComplete={stepUp.completeStepUp}
        onCancel={stepUp.cancelStepUp}
      />
    </div>
  );
}
