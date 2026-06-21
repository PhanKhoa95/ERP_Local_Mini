import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EmployeeContract } from "@/hooks/useEmployeeContracts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: EmployeeContract | null;
  employeeId: string;
  companyId: string;
  onSave: (data: any) => void;
  isSaving?: boolean;
}

export function ContractFormDialog({ open, onOpenChange, contract, employeeId, companyId, onSave, isSaving }: Props) {
  const [form, setForm] = useState({
    contract_type: "fixed_term",
    contract_number: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    salary_amount: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    if (contract) {
      setForm({
        contract_type: contract.contract_type,
        contract_number: contract.contract_number || "",
        start_date: contract.start_date,
        end_date: contract.end_date || "",
        salary_amount: contract.salary_amount?.toString() || "",
        status: contract.status,
        notes: contract.notes || "",
      });
    } else {
      setForm({
        contract_type: "fixed_term",
        contract_number: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        salary_amount: "",
        status: "active",
        notes: "",
      });
    }
  }, [contract, open]);

  const handleSubmit = () => {
    const payload = {
      employee_id: employeeId,
      company_id: companyId,
      contract_type: form.contract_type,
      contract_number: form.contract_number || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      salary_amount: form.salary_amount ? parseFloat(form.salary_amount) : null,
      salary_currency: "VND",
      status: form.status,
      notes: form.notes || null,
      ...(contract ? { id: contract.id } : {}),
    };
    onSave(payload);
  };

  const contractTypes: Record<string, string> = {
    probation: "Thử việc",
    fixed_term: "Có thời hạn",
    indefinite: "Không thời hạn",
  };

  const statusLabels: Record<string, string> = {
    active: "Hiệu lực",
    expired: "Hết hạn",
    terminated: "Đã chấm dứt",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{contract ? "Sửa hợp đồng" : "Tạo hợp đồng mới"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Loại hợp đồng</Label>
              <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(contractTypes).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Số hợp đồng</Label>
              <Input value={form.contract_number} onChange={(e) => setForm({ ...form, contract_number: e.target.value })} placeholder="HD-001" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ngày bắt đầu</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Ngày kết thúc</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Lương (VND)</Label>
              <Input type="number" value={form.salary_amount} onChange={(e) => setForm({ ...form, salary_amount: e.target.value })} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={!form.start_date || isSaving}>
            {contract ? "Cập nhật" : "Tạo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
