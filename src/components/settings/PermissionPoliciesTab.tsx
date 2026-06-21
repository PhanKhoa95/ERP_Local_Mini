import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useConflictDetection } from "@/hooks/useConflictDetection";
import { useToast } from "@/hooks/use-toast";
import { Plus, ShieldCheck, AlertTriangle, Trash2 } from "lucide-react";

export function PermissionPoliciesTab() {
  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { conflicts, conflictCount } = useConflictDetection();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    policy_type: "sensitive_action",
    allowed_actions: "",
    requires_vneid: false,
    requires_step_up: true,
  });

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["permission-policies", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("permission_policies" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  const createPolicy = useMutation({
    mutationFn: async (policy: any) => {
      const { error } = await supabase.from("permission_policies" as any).insert({
        company_id: companyId,
        name: policy.name,
        description: policy.description,
        policy_type: policy.policy_type,
        allowed_actions: policy.allowed_actions.split(",").map((a: string) => a.trim()).filter(Boolean),
        requires_vneid: policy.requires_vneid,
        requires_step_up: policy.requires_step_up,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permission-policies"] });
      toast({ title: "Đã tạo chính sách" });
      setDialogOpen(false);
      setForm({ name: "", description: "", policy_type: "sensitive_action", allowed_actions: "", requires_vneid: false, requires_step_up: true });
    },
  });

  const deletePolicy = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("permission_policies" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permission-policies"] });
      toast({ title: "Đã xóa chính sách" });
    },
  });

  const policyTypeLabels: Record<string, string> = {
    sensitive_action: "Thao tác nhạy cảm",
    project_role: "Quyền dự án",
    offline_limit: "Giới hạn offline",
    agent_scope: "Phạm vi AI Agent",
  };

  return (
    <div className="space-y-6">
      {/* Conflict alerts */}
      {conflictCount > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Cảnh báo xung đột quyền ({conflictCount})
            </CardTitle>
            <CardDescription>Phát hiện vi phạm nguyên tắc Separation of Duties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflicts.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-start gap-2 p-2 rounded bg-destructive/5 text-sm">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{c.details}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policies table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Chính sách phân quyền
            </CardTitle>
            <CardDescription>Quản lý quyền thao tác nhạy cảm, yêu cầu VNeID & Step-up auth</CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Thêm
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>VNeID</TableHead>
                <TableHead>Step-up</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có chính sách nào</TableCell>
                </TableRow>
              )}
              {policies.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="outline">{policyTypeLabels[p.policy_type] || p.policy_type}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{(p.allowed_actions || []).join(", ")}</TableCell>
                  <TableCell>{p.requires_vneid ? <Badge className="bg-primary text-primary-foreground">Bắt buộc</Badge> : "—"}</TableCell>
                  <TableCell>{p.requires_step_up ? <Badge variant="secondary">Có</Badge> : "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deletePolicy.mutate(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm chính sách phân quyền</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Tên chính sách</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Bảo vệ token" /></div>
            <div><Label>Mô tả</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <Label>Loại chính sách</Label>
              <Select value={form.policy_type} onValueChange={(v) => setForm({ ...form, policy_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sensitive_action">Thao tác nhạy cảm</SelectItem>
                  <SelectItem value="project_role">Quyền dự án</SelectItem>
                  <SelectItem value="offline_limit">Giới hạn offline</SelectItem>
                  <SelectItem value="agent_scope">Phạm vi AI Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Hành động áp dụng (phân cách dấu phẩy)</Label><Input value={form.allowed_actions} onChange={(e) => setForm({ ...form, allowed_actions: e.target.value })} placeholder="token_issue, share_transfer, config_change" /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.requires_vneid} onCheckedChange={(v) => setForm({ ...form, requires_vneid: v })} />
              <Label>Yêu cầu xác thực VNeID</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.requires_step_up} onCheckedChange={(v) => setForm({ ...form, requires_step_up: v })} />
              <Label>Yêu cầu Step-up Authentication</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={() => createPolicy.mutate(form)} disabled={createPolicy.isPending || !form.name}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
