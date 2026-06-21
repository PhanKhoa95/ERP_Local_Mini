import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployeeTransfer } from "@/hooks/useEmployeeTransfer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { ArrowUpRight, Repeat } from "lucide-react";

interface PromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  currentTitle?: string;
  currentPositionId?: string | null;
  currentOrgUnitId?: string | null;
}

export function PromotionDialog({
  open, onOpenChange, employeeId, employeeName,
  currentTitle, currentPositionId, currentOrgUnitId
}: PromotionDialogProps) {
  const { companyId } = useCompanyContext();
  const { createTransfer } = useEmployeeTransfer();
  const [transferType, setTransferType] = useState<string>("promotion");
  const [toTitle, setToTitle] = useState("");
  const [toPositionId, setToPositionId] = useState("");
  const [toOrgUnitId, setToOrgUnitId] = useState("");
  const [reason, setReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: positions = [] } = useQuery({
    queryKey: ["perf-positions", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("perf_positions").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId && open,
  });

  const { data: orgUnits = [] } = useQuery({
    queryKey: ["perf-org-units", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("perf_org_units").select("*").eq("company_id", companyId!);
      return data || [];
    },
    enabled: !!companyId && open,
  });

  const handleSubmit = async () => {
    // Create transfer record
    const transferResult = await createTransfer.mutateAsync({
      employee_id: employeeId,
      transfer_type: transferType,
      from_position_id: currentPositionId || null,
      to_position_id: toPositionId || null,
      from_org_unit_id: currentOrgUnitId || null,
      to_org_unit_id: toOrgUnitId || null,
      from_title: currentTitle || "",
      to_title: toTitle,
      effective_date: effectiveDate,
      reason,
    });

    // Also create an approval_request so it goes through the approval flow
    if (companyId) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("approval_requests").insert({
        company_id: companyId,
        requested_by: user?.id || "",
        request_type: transferType === "promotion" ? "promotion" : "transfer",
        title: `${transferType === "promotion" ? "Thăng chức" : "Điều chuyển"}: ${employeeName} → ${toTitle}`,
        description: reason || null,
        reference_type: "employee_transfer",
        reference_id: transferResult.id,
        status: "pending",
      });
    }

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setToTitle(""); setToPositionId(""); setToOrgUnitId(""); setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {transferType === "promotion" ? <ArrowUpRight className="h-5 w-5 text-green-500" /> : <Repeat className="h-5 w-5 text-blue-500" />}
            {transferType === "promotion" ? "Đề xuất Thăng chức" : "Điều chuyển Nhân sự"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nhân viên</Label>
            <Input value={employeeName} disabled />
          </div>

          <div>
            <Label>Loại</Label>
            <Select value={transferType} onValueChange={setTransferType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="promotion">Thăng chức</SelectItem>
                <SelectItem value="transfer">Điều chuyển</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Chức danh mới</Label>
            <Input value={toTitle} onChange={(e) => setToTitle(e.target.value)} placeholder="VD: Trưởng nhóm" />
          </div>

          {positions.length > 0 && (
            <div>
              <Label>Vị trí mới</Label>
              <Select value={toPositionId} onValueChange={setToPositionId}>
                <SelectTrigger><SelectValue placeholder="Chọn vị trí" /></SelectTrigger>
                <SelectContent>
                  {positions.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {transferType === "transfer" && orgUnits.length > 0 && (
            <div>
              <Label>Phòng ban mới</Label>
              <Select value={toOrgUnitId} onValueChange={setToOrgUnitId}>
                <SelectTrigger><SelectValue placeholder="Chọn phòng ban" /></SelectTrigger>
                <SelectContent>
                  {orgUnits.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Ngày hiệu lực</Label>
            <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
          </div>

          <div>
            <Label>Lý do</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do thăng chức / điều chuyển..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={createTransfer.isPending || !toTitle}>
            {createTransfer.isPending ? "Đang gửi..." : "Gửi đề xuất"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
