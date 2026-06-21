import { useState } from "react";
import { usePayroll } from "@/hooks/usePayroll";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DollarSign, Plus, FileDown, CheckCircle, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exportRowsToExcel } from "@/lib/excel";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Nháp", color: "bg-muted text-muted-foreground" },
  calculated: { label: "Đã tính", color: "bg-blue-100 text-blue-700" },
  approved: { label: "Đã duyệt", color: "bg-green-100 text-green-700" },
  paid: { label: "Đã trả", color: "bg-purple-100 text-purple-700" },
};

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Tháng ${i + 1}` }));

export function PayrollTab() {
  const { payrollRuns, isLoading, createPayrollRun, updateRunStatus } = usePayroll();
  const [showCreate, setShowCreate] = useState(false);
  const [viewRunId, setViewRunId] = useState<string | null>(null);
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  // Fetch items for viewed run
  const { data: viewItems = [] } = useQuery({
    queryKey: ["payroll-items", viewRunId],
    queryFn: async () => {
      if (!viewRunId) return [];
      const { data, error } = await supabase
        .from("payroll_items")
        .select("*, perf_employees(user_id, title)")
        .eq("payroll_run_id", viewRunId)
        .order("net_salary", { ascending: false });
      if (error) throw error;
      // Fetch names
      const userIds = (data || []).map((d: any) => d.perf_employees?.user_id).filter(Boolean);
      if (userIds.length) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));
        return (data || []).map((d: any) => ({ ...d, employee_name: nameMap.get(d.perf_employees?.user_id) || d.perf_employees?.title || "—" }));
      }
      return data || [];
    },
    enabled: !!viewRunId,
  });

  const handleCreate = () => {
    createPayrollRun.mutate({ month: parseInt(month), year: parseInt(year) }, { onSuccess: () => setShowCreate(false) });
  };

  const handleExport = () => {
    if (!viewItems.length) return;
    const run = payrollRuns.find((r: any) => r.id === viewRunId);
    const rows = viewItems.map((i: any) => ({
      "Nhân viên": i.employee_name,
      "Lương cơ bản": i.base_salary,
      "Ngày công": i.worked_days,
      "Tăng ca (h)": i.overtime_hours,
      "Phụ cấp TC": i.overtime_pay,
      "BHXH+BHYT+BHTN": i.insurance_deduction,
      "Thuế TNCN": i.tax_deduction,
      "Lương gross": i.gross_salary,
      "Thực nhận": i.net_salary,
    }));
    void exportRowsToExcel(rows, "Bảng lương", `BangLuong_T${run?.period_month}_${run?.period_year}.xlsx`);
  };

  const fmt = (n: number) => n?.toLocaleString("vi-VN") || "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Bảng lương</h3>
          <p className="text-sm text-muted-foreground">Tạo và quản lý bảng lương theo tháng</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Tạo bảng lương
        </Button>
      </div>

      {payrollRuns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Chưa có bảng lương nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {payrollRuns.map((run: any) => (
            <Card key={run.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewRunId(run.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">T{run.period_month}/{run.period_year}</CardTitle>
                  <Badge className={`${STATUS_MAP[run.status]?.color || ""} border-0`}>{STATUS_MAP[run.status]?.label || run.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng thực nhận:</span>
                    <span className="font-semibold">{fmt(run.total_net_salary)}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nhân viên:</span>
                    <span>{run.total_employees}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo bảng lương mới</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Hệ thống sẽ tự động tính lương dựa trên: hợp đồng (lương cơ bản), chấm công (ngày công, tăng ca) và các khoản khấu trừ.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tháng</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Năm</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={createPayrollRun.isPending}>
              {createPayrollRun.isPending ? "Đang tính..." : "Tạo & Tính lương"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Payroll Details Dialog */}
      <Dialog open={!!viewRunId} onOpenChange={() => setViewRunId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Chi tiết bảng lương</DialogTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExport} className="gap-1">
                  <FileDown className="h-3 w-3" /> Xuất Excel
                </Button>
                {payrollRuns.find((r: any) => r.id === viewRunId)?.status === "calculated" && (
                  <Button size="sm" onClick={() => { updateRunStatus.mutate({ id: viewRunId!, status: "approved" }); }} className="gap-1">
                    <CheckCircle className="h-3 w-3" /> Duyệt
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead className="text-right">Lương CB</TableHead>
                <TableHead className="text-right">Ngày công</TableHead>
                <TableHead className="text-right">Tăng ca</TableHead>
                <TableHead className="text-right">BHXH</TableHead>
                <TableHead className="text-right">Thuế</TableHead>
                <TableHead className="text-right font-semibold">Thực nhận</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewItems.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.employee_name}</TableCell>
                  <TableCell className="text-right">{fmt(item.base_salary)}</TableCell>
                  <TableCell className="text-right">{item.worked_days}/{item.standard_days}</TableCell>
                  <TableCell className="text-right">{item.overtime_hours > 0 ? `${item.overtime_hours}h (+${fmt(item.overtime_pay)})` : "—"}</TableCell>
                  <TableCell className="text-right text-red-600">-{fmt(item.insurance_deduction)}</TableCell>
                  <TableCell className="text-right text-red-600">-{fmt(item.tax_deduction)}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">{fmt(item.net_salary)}đ</TableCell>
                </TableRow>
              ))}
              {viewItems.length > 0 && (
                <TableRow className="font-bold border-t-2">
                  <TableCell>Tổng cộng</TableCell>
                  <TableCell colSpan={5}></TableCell>
                  <TableCell className="text-right text-primary">{fmt(viewItems.reduce((s: number, i: any) => s + (i.net_salary || 0), 0))}đ</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
