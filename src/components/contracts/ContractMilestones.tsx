import { useState } from "react";
import { useContractMilestones } from "@/hooks/useContracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Plus, Coins, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Props {
  contractId: string;
}

export function ContractMilestones({ contractId }: Props) {
  const { milestones, isLoading, addMilestone, completeMilestone } = useContractMilestones(contractId);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ milestone_name: "", due_date: "", amount: 0, token_issue_amount: 0 });

  const handleAdd = () => {
    addMilestone.mutate({
      contract_id: contractId,
      ...form,
      milestone_order: milestones.length + 1,
    }, { onSuccess: () => { setAdding(false); setForm({ milestone_name: "", due_date: "", amount: 0, token_issue_amount: 0 }); } });
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Mốc tiến độ / Thanh toán</h4>
        <Button size="sm" variant="outline" onClick={() => setAdding(!adding)} className="gap-1">
          <Plus className="h-3 w-3" /> Thêm
        </Button>
      </div>

      {adding && (
        <div className="grid grid-cols-4 gap-2 p-3 border rounded-lg bg-muted/30">
          <Input placeholder="Tên mốc" value={form.milestone_name} onChange={e => setForm(f => ({ ...f, milestone_name: e.target.value }))} />
          <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          <Input type="number" placeholder="Số tiền" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} />
          <div className="flex gap-1">
            <Input type="number" placeholder="Token" value={form.token_issue_amount || ""} onChange={e => setForm(f => ({ ...f, token_issue_amount: Number(e.target.value) }))} />
            <Button size="sm" onClick={handleAdd} disabled={!form.milestone_name}>OK</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {milestones.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-3 border rounded-lg">
            <span className="text-sm font-medium text-muted-foreground w-6">#{m.milestone_order}</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{m.milestone_name}</p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                {m.due_date && <span>Hạn: {format(new Date(m.due_date), "dd/MM/yyyy")}</span>}
                {m.amount > 0 && <span>• {m.amount.toLocaleString("vi-VN")}đ</span>}
                {m.token_issue_amount > 0 && <span className="flex items-center gap-0.5"><Coins className="h-3 w-3" />{m.token_issue_amount} Token</span>}
              </div>
            </div>
            <Badge className={statusColor[m.status] || ""}>{m.status === "completed" ? "Hoàn thành" : m.status === "overdue" ? "Quá hạn" : "Chờ"}</Badge>
            {m.status === "pending" && (
              <Button size="sm" variant="ghost" onClick={() => completeMilestone.mutate({ milestone_id: m.id, contract_id: contractId })} disabled={completeMilestone.isPending}>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </Button>
            )}
          </div>
        ))}
        {milestones.length === 0 && !adding && <p className="text-sm text-muted-foreground text-center py-4">Chưa có milestone nào</p>}
      </div>
    </div>
  );
}
