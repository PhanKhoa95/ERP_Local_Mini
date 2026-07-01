import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { toast } from "sonner";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

const RUNS_KEY = "erp-mini-local-demo-payroll-runs";
const ITEMS_KEY = "erp-mini-local-demo-payroll-items";

function getLocalRuns(companyId: string): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(RUNS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalRuns(runs: any[]) {
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
}

function getLocalItems(): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(ITEMS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalItems(items: any[]) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export function usePayrollItems(runId: string) {
  return useQuery({
    queryKey: ["payroll-items", runId],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        const items = getLocalItems();
        const runItems = items.filter(i => i.payroll_run_id === runId);
        
        // Map với thông tin nhân viên mẫu
        const rawEmps = localStorage.getItem("erp-mini-local-demo-perf-employees");
        const emps = (rawEmps ? JSON.parse(rawEmps) : []) as any[];
        const empMap = new Map(emps.map((e: any) => [e.id, e]));

        return runItems.map(item => {
          const emp = empMap.get(item.employee_id) as any;
          return {
            ...item,
            perf_employees: {
              user_id: emp?.user_id || "",
              title: emp?.title || "",
              full_name: emp?.full_name || "" // For UI compatibility
            }
          };
        });
      }


      const { data, error } = await supabase
        .from("payroll_items")
        .select("*, perf_employees(user_id, title)")
        .eq("payroll_run_id", runId)
        .order("net_salary", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!runId,
  });
}

export function usePayroll() {
  const { companyId } = useCompanyContext();
  const qc = useQueryClient();

  const { data: payrollRuns = [], isLoading } = useQuery({
    queryKey: ["payroll-runs", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      if (isLocalDemoAuthEnabled()) {
        return getLocalRuns(companyId);
      }

      const { data, error } = await supabase
        .from("payroll_runs")
        .select("*")
        .eq("company_id", companyId)
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const createPayrollRun = useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      if (!companyId) throw new Error("No company");

      if (isLocalDemoAuthEnabled()) {
        const runs = getLocalRuns(companyId);
        const exists = runs.some(r => r.period_month === month && r.period_year === year);
        if (exists) {
          throw new Error(`Bảng lương tháng ${month}/${year} đã tồn tại`);
        }

        const runId = `run-${Date.now()}`;
        const newRun = {
          id: runId,
          company_id: companyId,
          period_month: month,
          period_year: year,
          total_net_salary: 0,
          total_employees: 0,
          status: "draft",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: "user-admin",
        };

        // Lấy danh sách nhân viên từ localStorage
        const rawEmps = localStorage.getItem("erp-mini-local-demo-perf-employees");
        const emps = rawEmps ? JSON.parse(rawEmps) : [];
        if (!emps.length) {
          saveLocalRuns([newRun, ...runs]);
          return newRun;
        }

        // Định cấu hình lương cứng và phụ cấp mẫu cho 4 nhân viên
        const contractMap = new Map([
          ["emp-a", { base: 25000000, project: 1500000, lunch: 500000, responsibility: 0, attendance: 0 }],
          ["emp-b", { base: 12000000, project: 0, lunch: 500000, responsibility: 0, attendance: 0 }],
          ["emp-c", { base: 18000000, project: 0, lunch: 500000, responsibility: 2000000, attendance: 0 }],
          ["emp-d", { base: 16000000, project: 0, lunch: 500000, responsibility: 0, attendance: 1000000 }],
        ]);

        // Lấy dữ liệu chấm công mẫu
        const rawAttendance = localStorage.getItem("erp-mini-local-demo-attendance-records");
        const attendance = rawAttendance ? JSON.parse(rawAttendance) : [];
        
        const attendanceMap = new Map<string, { days: number }>();
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const endDate = new Date(year, month, 0).toISOString().split("T")[0];

        const monthAtts = attendance.filter((a: any) => a.company_id === companyId && a.date >= startDate && a.date <= endDate);
        for (const a of monthAtts) {
          const existing = attendanceMap.get(a.employee_id) || { days: 0 };
          existing.days += 1;
          attendanceMap.set(a.employee_id, existing);
        }

        // Tính doanh thu POS mẫu để chia hoa hồng 2% cho Trần Thị B (emp-b)
        let posSales = 0;
        try {
          const rawOrders = localStorage.getItem("erp-mini-local-demo-orders") || localStorage.getItem("orders");
          const orders = rawOrders ? JSON.parse(rawOrders) : [];
          const posOrders = orders.filter((o: any) => o.status === "delivered" || o.status === "paid");
          posSales = posOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || o.total || 0), 0);
        } catch {
          posSales = 0;
        }
        if (posSales === 0) {
          posSales = 30000000; // Mock doanh thu 30M nếu chưa có đơn hàng
        }
        const salesCommission = Math.round(posSales * 0.02);

        // Tạo payroll items
        const items = emps.map((emp: any) => {
          const contract = contractMap.get(emp.id) || { base: 10000000, project: 0, lunch: 500000, responsibility: 0, attendance: 0 };
          const baseSalary = contract.base;
          const att = attendanceMap.get(emp.id) || { days: 22 };
          const workedDays = att.days || 22;
          const standardDays = 22;
          
          const proRatedSalary = Math.round((baseSalary / standardDays) * workedDays);
          const lunchAllow = contract.lunch;
          const projectAllow = contract.project;
          const respAllow = contract.responsibility;
          const attendAllow = contract.attendance;
          const commissionPay = emp.id === "emp-b" ? salesCommission : 0;

          // Tổng phụ cấp
          const totalAllowances = lunchAllow + projectAllow + respAllow + attendAllow;
          const grossSalary = proRatedSalary + totalAllowances + commissionPay;
          
          const insuranceDeduction = Math.round(baseSalary * 0.105); // 10.5%
          const taxableIncome = grossSalary - insuranceDeduction - 11000000; // 11M giảm trừ gia cảnh
          const taxDeduction = taxableIncome > 0 ? Math.round(taxableIncome * 0.1) : 0;
          const netSalary = grossSalary - insuranceDeduction - taxDeduction;

          return {
            id: `payitem-${emp.id}-${Date.now()}`,
            payroll_run_id: runId,
            employee_id: emp.id,
            base_salary: baseSalary,
            worked_days: workedDays,
            standard_days: standardDays,
            overtime_hours: 0,
            overtime_pay: 0,
            insurance_deduction: insuranceDeduction,
            tax_deduction: taxDeduction,
            gross_salary: grossSalary,
            net_salary: netSalary,
          };
        });

        // Lưu items
        const currentItems = getLocalItems();
        saveLocalItems([...items, ...currentItems]);

        // Cập nhật run totals
        const totalNet = items.reduce((s: number, i: any) => s + i.net_salary, 0);
        newRun.total_net_salary = totalNet;
        newRun.total_employees = items.length;
        newRun.status = "calculated";

        saveLocalRuns([newRun, ...runs]);
        return newRun;
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Create the run
      const { data: run, error: runError } = await supabase
        .from("payroll_runs")
        .insert({
          company_id: companyId,
          period_month: month,
          period_year: year,
          created_by: user?.id,
        })
        .select()
        .single();
      if (runError) {
        if (runError.message.includes("duplicate") || runError.message.includes("unique")) {
          throw new Error(`Bảng lương tháng ${month}/${year} đã tồn tại`);
        }
        throw runError;
      }

      // Get all active employees with contracts
      const { data: employees } = await supabase
        .from("perf_employees")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (!employees?.length) return run;

      // Get contracts for salary info
      const { data: contracts } = await supabase
        .from("employee_contracts")
        .select("employee_id, salary_amount")
        .eq("company_id", companyId)
        .eq("status", "active");

      const contractMap = new Map((contracts || []).map((c: any) => [c.employee_id, c.salary_amount || 0]));

      // Get attendance for the month
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = new Date(year, month, 0).toISOString().split("T")[0];

      const { data: attendance } = await supabase
        .from("attendance_records")
        .select("employee_id, work_hours, overtime_hours")
        .eq("company_id", companyId)
        .gte("date", startDate)
        .lte("date", endDate);

      const attendanceMap = new Map<string, { days: number; overtime: number }>();
      for (const a of attendance || []) {
        const existing = attendanceMap.get(a.employee_id) || { days: 0, overtime: 0 };
        existing.days += 1;
        existing.overtime += a.overtime_hours || 0;
        attendanceMap.set(a.employee_id, existing);
      }

      // Create payroll items
      const items = employees.map((emp: any) => {
        const baseSalary = contractMap.get(emp.id) || 0;
        const att = attendanceMap.get(emp.id) || { days: 22, overtime: 0 };
        const workedDays = att.days || 22;
        const standardDays = 22;
        const overtimeHours = att.overtime;
        const hourlyRate = baseSalary / standardDays / 8;
        const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5);
        const proRatedSalary = Math.round((baseSalary / standardDays) * workedDays);
        const insuranceDeduction = Math.round(baseSalary * 0.105); // 10.5% BHXH+BHYT+BHTN
        const grossSalary = proRatedSalary + overtimePay;
        const taxableIncome = grossSalary - insuranceDeduction - 11000000; // 11M personal deduction
        const taxDeduction = taxableIncome > 0 ? Math.round(taxableIncome * 0.1) : 0;
        const netSalary = grossSalary - insuranceDeduction - taxDeduction;

        return {
          payroll_run_id: run.id,
          employee_id: emp.id,
          base_salary: baseSalary,
          worked_days: workedDays,
          standard_days: standardDays,
          overtime_hours: overtimeHours,
          overtime_pay: overtimePay,
          insurance_deduction: insuranceDeduction,
          tax_deduction: taxDeduction,
          gross_salary: grossSalary,
          net_salary: netSalary,
        };
      });

      if (items.length) {
        const { error: itemsError } = await supabase.from("payroll_items").insert(items);
        if (itemsError) throw itemsError;

        // Update run totals
        const totalNet = items.reduce((s, i) => s + i.net_salary, 0);
        await supabase.from("payroll_runs").update({
          total_net_salary: totalNet,
          total_employees: items.length,
          status: "calculated",
        }).eq("id", run.id);
      }

      return run;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll-runs"] }); toast.success("Đã tạo bảng lương"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRunStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const runs = getLocalRuns(companyId || "");
        const idx = runs.findIndex(r => r.id === id);
        if (idx === -1) throw new Error("Không tìm thấy bảng lương");

        runs[idx].status = status;
        runs[idx].updated_at = new Date().toISOString();
        saveLocalRuns(runs);

        // Nếu chuyển trạng thái sang "paid" -> Tự động tạo bút toán kế toán cục bộ
        if (status === "paid") {
          const targetRun = runs[idx];
          const allItems = getLocalItems();
          const items = allItems.filter(i => i.payroll_run_id === id);

          const entryId = `entry-payroll-${Date.now()}`;
          const timestamp = new Date().toISOString();

          // 1. Tạo journal entry
          const journalEntry = {
            id: entryId,
            company_id: companyId || "",
            entry_date: new Date().toISOString().split("T")[0],
            description: `Hạch toán chi phí lương & chi trả lương tháng ${targetRun.period_month}/${targetRun.period_year}`,
            source_type: "payroll",
            status: "posted",
            created_at: timestamp,
            updated_at: timestamp,
          };

          // 2. Tạo journal lines
          const rawAccs = localStorage.getItem("erp-mini-local-demo-accounts");
          const accs = rawAccs ? JSON.parse(rawAccs) : [];
          const getAccId = (code: string) => accs.find((a: any) => a.code === code)?.id || `acc-${code}`;

          const tk641 = getAccId("641"); // Chi phí bán hàng
          const tk642 = getAccId("642"); // Chi phí quản lý
          const tk334 = getAccId("334"); // Phải trả người lao động
          const tk112 = getAccId("112"); // Tiền gửi ngân hàng
          const tk333 = getAccId("333"); // Thuế và phải nộp NN

          const lines = [];
          
          // Lương bộ phận Bán hàng (emp-b)
          const salesGross = items.filter(i => i.employee_id === "emp-b").reduce((s, i) => s + i.gross_salary, 0);
          if (salesGross > 0) {
            lines.push({
              id: `line-pay-${Date.now()}-1`,
              entry_id: entryId,
              account_id: tk641,
              debit: salesGross,
              credit: 0,
              asset_type: "cash",
              memo: `Lương bộ phận Bán hàng (Trần Thị B)`,
              created_at: timestamp
            });
          }

          // Lương bộ phận Quản lý & Kỹ thuật (emp-a, emp-c, emp-d)
          const adminGross = items.filter(i => i.employee_id !== "emp-b").reduce((s, i) => s + i.gross_salary, 0);
          if (adminGross > 0) {
            lines.push({
              id: `line-pay-${Date.now()}-2`,
              entry_id: entryId,
              account_id: tk642,
              debit: adminGross,
              credit: 0,
              asset_type: "cash",
              memo: `Lương bộ phận Kỹ thuật & Quản lý (Nguyễn Văn A, Lê Văn C, Phạm Thị D)`,
              created_at: timestamp
            });
          }

          // Phải trả người lao động (TK 334) - Có TK 334 (tổng gross_salary)
          const totalGross = salesGross + adminGross;
          lines.push({
            id: `line-pay-${Date.now()}-3`,
            entry_id: entryId,
            account_id: tk334,
            debit: 0,
            credit: totalGross,
            asset_type: "cash",
            memo: "Phải trả người lao động (Hạch toán tổng lương)",
            created_at: timestamp
          });

          // Chi trả lương thực nhận (TK 334) - Nợ TK 334 đối ứng với Có TK 112
          const totalNet = items.reduce((s, i) => s + i.net_salary, 0);
          lines.push({
            id: `line-pay-${Date.now()}-4`,
            entry_id: entryId,
            account_id: tk334,
            debit: totalNet,
            credit: 0,
            asset_type: "cash",
            memo: "Thanh toán lương thực nhận cho nhân viên",
            created_at: timestamp
          });
          lines.push({
            id: `line-pay-${Date.now()}-5`,
            entry_id: entryId,
            account_id: tk112,
            debit: 0,
            credit: totalNet,
            asset_type: "bank",
            memo: "Chi trả tiền lương bằng Tiền gửi ngân hàng",
            created_at: timestamp
          });

          // Khấu trừ Bảo hiểm và Thuế TNCN (TK 334) - Nợ TK 334 đối ứng với Có TK 333 (Thuế và bảo hiểm)
          const totalDeductions = items.reduce((s, i) => s + (i.insurance_deduction + i.tax_deduction), 0);
          if (totalDeductions > 0) {
            lines.push({
              id: `line-pay-${Date.now()}-6`,
              entry_id: entryId,
              account_id: tk334,
              debit: totalDeductions,
              credit: 0,
              asset_type: "cash",
              memo: "Khấu trừ Bảo hiểm & Thuế TNCN của nhân viên",
              created_at: timestamp
            });
            lines.push({
              id: `line-pay-${Date.now()}-7`,
              entry_id: entryId,
              account_id: tk333,
              debit: 0,
              credit: totalDeductions,
              asset_type: "cash",
              memo: "Khấu trừ bảo hiểm và Thuế phải nộp Nhà nước",
              created_at: timestamp
            });
          }

          // Lưu journal entries và lines vào localStorage
          const rawEntries = localStorage.getItem("erp-mini-local-demo-journal-entries");
          const entriesList = rawEntries ? JSON.parse(rawEntries) : [];
          localStorage.setItem("erp-mini-local-demo-journal-entries", JSON.stringify([journalEntry, ...entriesList]));

          const rawLines = localStorage.getItem("erp-mini-local-demo-journal-lines");
          const currentLines = rawLines ? JSON.parse(rawLines) : [];
          localStorage.setItem("erp-mini-local-demo-journal-lines", JSON.stringify([...lines, ...currentLines]));
        }

        return;
      }

      const { error } = await supabase.from("payroll_runs").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["payroll-runs"] }); 
      qc.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      qc.invalidateQueries({ queryKey: ["journal-entries-and-lines"] });
      toast.success("Đã cập nhật trạng thái"); 
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { payrollRuns, isLoading, getPayrollItems: usePayrollItems, createPayrollRun, updateRunStatus };
}
