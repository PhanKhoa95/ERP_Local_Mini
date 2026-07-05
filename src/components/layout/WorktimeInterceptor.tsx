import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut } from "lucide-react";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

interface WorktimeConf {
  isRest: boolean;
  start: string;
  end: string;
}

export function WorktimeInterceptor({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { companyId } = useCompanyContext();
  const [isBlocked, setIsBlocked] = useState(false);
  const [scheduleText, setScheduleText] = useState("");

  useEffect(() => {
    if (!user || !companyId) {
      setIsBlocked(false);
      return;
    }

    const checkWorktime = () => {
      // 1. Fetch current member
      let member: any = null;
      let departments: any[] = [];

      if (isLocalDemoAuthEnabled()) {
        const rawMembers = localStorage.getItem("erp-mini-local-demo-company-members");
        if (rawMembers) {
          try {
            const list = JSON.parse(rawMembers);
            member = list.find((m: any) => m.user_id === user.id);
          } catch (e) {
            console.error("Error parsing members:", e);
          }
        }

        const rawDepts = localStorage.getItem("erp-mini-local-demo-departments");
        if (rawDepts) {
          try {
            departments = JSON.parse(rawDepts);
          } catch (e) {
            console.error("Error parsing departments:", e);
          }
        }
      }

      if (!member) {
        setIsBlocked(false);
        return;
      }

      // Admins are never blocked
      if (member.role === "admin") {
        setIsBlocked(false);
        return;
      }

      const now = new Date();
      const dayIndex = now.getDay();
      const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const dayLabels = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
      const currentDayKey = dayKeys[dayIndex];
      const currentDayLabel = dayLabels[dayIndex];

      let worktimeConf: WorktimeConf | null = null;
      let sourceName = "";

      // Check department worktime first
      const myDept = departments.find((d) => d.member_ids.includes(member.id));
      if (myDept && myDept.worktime && myDept.worktime[currentDayKey]) {
        worktimeConf = myDept.worktime[currentDayKey];
        sourceName = `Bộ phận ${myDept.name}`;
      }
      // Check personal worktime override
      else if (member.worktime && member.worktime[currentDayKey]) {
        worktimeConf = member.worktime[currentDayKey];
        sourceName = "Lịch làm việc cá nhân";
      }

      if (!worktimeConf) {
        setIsBlocked(false);
        return;
      }

      if (worktimeConf.isRest) {
        setIsBlocked(true);
        setScheduleText(`${currentDayLabel}: Ngày nghỉ (${sourceName})`);
        return;
      }

      const { start, end } = worktimeConf;
      if (!start || !end) {
        setIsBlocked(false);
        return;
      }

      const [startH, startM] = start.split(":").map(Number);
      const [endH, endM] = end.split(":").map(Number);

      const currentH = now.getHours();
      const currentM = now.getMinutes();

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const currentMinutes = currentH * 60 + currentM;

      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        setIsBlocked(true);
        setScheduleText(`${currentDayLabel}: ${start} - ${end} (${sourceName})`);
      } else {
        setIsBlocked(false);
      }
    };

    checkWorktime();
    // Re-check every 30 seconds
    const interval = setInterval(checkWorktime, 30000);
    return () => clearInterval(interval);
  }, [user, companyId]);

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-2xl text-center space-y-6">
          <div className="inline-flex p-4 rounded-full bg-red-500/10 text-red-500 animate-pulse">
            <ShieldAlert className="h-12 w-12" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">Hệ Thống Đã Khóa</h1>
            <p className="text-sm text-muted-foreground">
              Bạn đang truy cập hệ thống ngoài khung giờ làm việc được phân công.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-secondary/35 border text-sm font-semibold text-foreground">
            Lịch hôm nay: <span className="text-red-500 dark:text-red-400">{scheduleText}</span>
          </div>

          <div className="text-xs text-muted-foreground">
            Vui lòng liên hệ Quản trị viên nếu có sự thay đổi ca làm việc của bạn.
          </div>

          <div className="pt-2">
            <Button
              onClick={() => {
                setIsBlocked(false);
                signOut();
              }}
              variant="destructive"
              className="w-full font-bold gap-2"
            >
              <LogOut className="h-4 w-4" /> Đăng xuất tài khoản
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
