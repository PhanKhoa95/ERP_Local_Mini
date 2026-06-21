import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { usePerformanceEmployee } from "@/hooks/usePerformanceEmployee";
import { toast } from "sonner";

import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

const ATTENDANCE_KEY = "erp-mini-local-demo-attendance-records";

const getSeedAttendance = (companyId: string) => {
  const records = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  
  const employees = [
    { id: "emp-a", days: 22 },
    { id: "emp-b", days: 20 },
    { id: "emp-c", days: 22 },
    { id: "emp-d", days: 22 }
  ];

  for (const emp of employees) {
    let dayCount = 0;
    for (let d = 1; d <= 31; d++) {
      const date = new Date(year, month, d);
      if (date.getMonth() !== month) break;
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      if (dayCount < emp.days) {
        const dateStr = date.toISOString().split("T")[0];
        records.push({
          id: `att-${emp.id}-${dateStr}`,
          employee_id: emp.id,
          company_id: companyId,
          date: dateStr,
          check_in: `${dateStr}T08:00:00.000Z`,
          check_out: `${dateStr}T17:00:00.000Z`,
          work_hours: 8,
          overtime_hours: 0,
          type: "office",
          location_data: null,
          created_at: new Date().toISOString()
        });
        dayCount++;
      }
    }
  }
  return records;
};

function getLocalAttendance(companyId: string): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(ATTENDANCE_KEY);
  if (!raw) {
    const seeded = getSeedAttendance(companyId);
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalAttendance(records: any[]) {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
}

export function useAttendance() {
  const { companyId } = useCompanyContext();
  const { employee } = usePerformanceEmployee();
  const qc = useQueryClient();

  const today = new Date().toISOString().split("T")[0];

  const { data: todayRecord, isLoading: todayLoading } = useQuery({
    queryKey: ["attendance-today", employee?.id, today],
    queryFn: async () => {
      if (!employee?.id) return null;

      if (isLocalDemoAuthEnabled()) {
        const records = getLocalAttendance(companyId || "");
        const record = records.find(r => r.employee_id === employee.id && r.date === today);
        return record || null;
      }

      const { data } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("employee_id", employee.id)
        .eq("date", today)
        .maybeSingle();
      return data;
    },
    enabled: !!employee?.id,
  });

  const { data: monthRecords = [], isLoading: monthLoading } = useQuery({
    queryKey: ["attendance-month", employee?.id, companyId],
    queryFn: async () => {
      if (!employee?.id) return [];
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      if (isLocalDemoAuthEnabled()) {
        const records = getLocalAttendance(companyId || "");
        return records.filter(r => r.employee_id === employee.id && r.date >= start && r.date <= end)
          .sort((a, b) => b.date.localeCompare(a.date));
      }

      const { data } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("employee_id", employee.id)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });
      return data || [];
    },
    enabled: !!employee?.id,
  });

  // For managers: all team attendance
  const { data: teamRecords = [], isLoading: teamLoading } = useQuery({
    queryKey: ["attendance-team", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

      if (isLocalDemoAuthEnabled()) {
        const records = getLocalAttendance(companyId);
        // Map with employee names
        const rawEmps = localStorage.getItem("erp-mini-local-demo-perf-employees");
        const emps = (rawEmps ? JSON.parse(rawEmps) : []) as any[];
        const empMap = new Map(emps.map((e: any) => [e.id, e]));

        return records.filter(r => r.company_id === companyId && r.date >= start)
          .map(r => {
            const emp = empMap.get(r.employee_id) as any;
            return {
              ...r,
              perf_employees: {
                user_id: emp?.user_id || "",
                title: emp?.title || "",
                full_name: emp?.full_name || "" // For UI compatibility
              }
            };
          })
          .sort((a, b) => b.date.localeCompare(a.date));
      }


      const { data } = await supabase
        .from("attendance_records")
        .select("*, perf_employees(user_id, title)")
        .eq("company_id", companyId)
        .gte("date", start)
        .order("date", { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!companyId,
  });

  const checkIn = useMutation({
    mutationFn: async (locationData?: any) => {
      if (!employee?.id || !companyId) throw new Error("Chưa có thông tin nhân viên");

      if (isLocalDemoAuthEnabled()) {
        const records = getLocalAttendance(companyId);
        const exists = records.some(r => r.employee_id === employee.id && r.date === today);
        if (exists) {
          throw new Error("Bạn đã chấm công hôm nay rồi");
        }
        const newRecord = {
          id: `att-${employee.id}-${today}`,
          employee_id: employee.id,
          company_id: companyId,
          date: today,
          check_in: new Date().toISOString(),
          type: locationData ? "field" : "office",
          location_data: locationData || null,
          created_at: new Date().toISOString()
        };
        saveLocalAttendance([newRecord, ...records]);
        return;
      }

      const { error } = await supabase.from("attendance_records").insert({
        employee_id: employee.id,
        company_id: companyId,
        date: today,
        check_in: new Date().toISOString(),
        type: locationData ? "field" : "office",
        location_data: locationData || null,
      });
      if (error) {
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
          throw new Error("Bạn đã chấm công hôm nay rồi");
        }
        throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance-today"] }); qc.invalidateQueries({ queryKey: ["attendance-month"] }); toast.success("Đã check-in thành công!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const checkOut = useMutation({
    mutationFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        const records = getLocalAttendance(companyId || "");
        const recordIdx = records.findIndex(r => r.employee_id === employee?.id && r.date === today);
        if (recordIdx === -1) throw new Error("Chưa check-in");

        const target = records[recordIdx];
        const checkOutTime = new Date();
        const checkInTime = new Date(target.check_in);
        const hours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        const workHours = Math.round(hours * 100) / 100;
        const overtime = Math.max(0, workHours - 8);

        records[recordIdx] = {
          ...target,
          check_out: checkOutTime.toISOString(),
          work_hours: workHours,
          overtime_hours: Math.round(overtime * 100) / 100,
        };
        saveLocalAttendance(records);
        return;
      }

      if (!todayRecord?.id) throw new Error("Chưa check-in");
      const checkOutTime = new Date();
      const checkInTime = new Date(todayRecord.check_in);
      const hours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      const workHours = Math.round(hours * 100) / 100;
      const overtime = Math.max(0, workHours - 8);

      const { error } = await supabase.from("attendance_records").update({
        check_out: checkOutTime.toISOString(),
        work_hours: workHours,
        overtime_hours: Math.round(overtime * 100) / 100,
      }).eq("id", todayRecord.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance-today"] }); qc.invalidateQueries({ queryKey: ["attendance-month"] }); toast.success("Đã check-out!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { todayRecord, todayLoading, monthRecords, monthLoading, teamRecords, teamLoading, checkIn, checkOut };
}

