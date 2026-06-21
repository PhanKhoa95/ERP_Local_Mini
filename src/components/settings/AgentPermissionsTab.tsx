import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Bot, Trash2, Shield } from "lucide-react";

export function AgentPermissionsTab() {
  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    agent_name: "",
    allowed_tables: "",
    allowed_actions: "",
    max_amount_limit: "0",
    requires_human_approval: true,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["agent-permissions", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("agent_permissions" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  const createAgent = useMutation({
    mutationFn: async (agent: any) => {
      const { error } = await supabase.from("agent_permissions" as any).insert({
        company_id: companyId,
        agent_name: agent.agent_name,
        allowed_tables: agent.allowed_tables.split(",").map((t: string) => t.trim()).filter(Boolean),
        allowed_actions: agent.allowed_actions.split(",").map((a: string) => a.trim()).filter(Boolean),
        max_amount_limit: Number(agent.max_amount_limit) || 0,
        requires_human_approval: agent.requires_human_approval,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-permissions"] });
      toast({ title: "Đã tạo cấu hình AI Agent" });
      setDialogOpen(false);
    },
  });

  const deleteAgent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agent_permissions" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-permissions"] });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Phân quyền AI Agent
            </CardTitle>
            <CardDescription>Cấu hình phạm vi truy cập và giới hạn cho AI Agent trong Workflow</CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Thêm Agent
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Agent</TableHead>
                <TableHead>Bảng cho phép</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Giới hạn tiền</TableHead>
                <TableHead>Duyệt thủ công</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có cấu hình AI Agent</TableCell>
                </TableRow>
              )}
              {agents.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />{a.agent_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(a.allowed_tables || []).map((t: string) => (
                        <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{(a.allowed_actions || []).join(", ")}</TableCell>
                  <TableCell className="font-mono">{Number(a.max_amount_limit).toLocaleString("vi-VN")}đ</TableCell>
                  <TableCell>{a.requires_human_approval ? <Shield className="h-4 w-4 text-primary" /> : "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteAgent.mutate(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm cấu hình AI Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Tên Agent</Label><Input value={form.agent_name} onChange={(e) => setForm({ ...form, agent_name: e.target.value })} placeholder="VD: booking_manager, finance_agent" /></div>
            <div><Label>Bảng được phép truy cập</Label><Input value={form.allowed_tables} onChange={(e) => setForm({ ...form, allowed_tables: e.target.value })} placeholder="products, orders, bookings" /></div>
            <div><Label>Hành động cho phép</Label><Input value={form.allowed_actions} onChange={(e) => setForm({ ...form, allowed_actions: e.target.value })} placeholder="select, insert, update" /></div>
            <div><Label>Giới hạn số tiền tối đa (VNĐ)</Label><Input type="number" value={form.max_amount_limit} onChange={(e) => setForm({ ...form, max_amount_limit: e.target.value })} /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.requires_human_approval} onCheckedChange={(v) => setForm({ ...form, requires_human_approval: v })} />
              <Label>Yêu cầu phê duyệt thủ công cho thao tác ghi</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={() => createAgent.mutate(form)} disabled={createAgent.isPending || !form.agent_name}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
