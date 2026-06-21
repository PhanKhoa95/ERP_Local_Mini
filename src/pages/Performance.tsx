import { MainLayout } from "@/components/layout/MainLayout";
import { usePerformanceOnboarding } from "@/hooks/usePerformanceOnboarding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, FileText, ClipboardCheck, Loader2, AlertTriangle, RefreshCw, Zap, GraduationCap, CalendarDays, User, Building2, Briefcase, Calendar, Phone, Mail, CreditCard, Shield, Clock } from "lucide-react";
import { PerformanceOverview } from "@/components/performance/PerformanceOverview";
import { WorkReportTab } from "@/components/performance/WorkReportTab";
import { MyTasksTab } from "@/components/tasks/MyTasksTab";
import { TrainingProgramsTab } from "@/components/performance/TrainingProgramsTab";
import { LeaveRequestTab } from "@/components/performance/LeaveRequestTab";
import { AttendanceTab } from "@/components/performance/AttendanceTab";
import { OnboardingChecklistCard } from "@/components/performance/OnboardingChecklistCard";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePerformanceEmployee } from "@/hooks/usePerformanceEmployee";
import { Badge } from "@/components/ui/badge";
import { useEmployeeRecords, type EmployeeRecord } from "@/hooks/useEmployeeRecords";
import { useEmployeeContracts } from "@/hooks/useEmployeeContracts";
import { EmployeeDetailDialog } from "@/components/performance/EmployeeDetailDialog";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

const Performance = () => {
  const { onboarding, isLoading, error } = usePerformanceOnboarding();
  const { employee, currentLevel, isLoading: employeeLoading } = usePerformanceEmployee();
  const { employees, upsertProfile } = useEmployeeRecords();
  const { role } = useCompanyContext();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const myRecord = useMemo(() => {
    if (!employee) return null;
    return employees.find((e) => e.id === employee.id) || null;
  }, [employees, employee]);

  const { contracts } = useEmployeeContracts(myRecord?.id);
  const activeContract = contracts.find((c: any) => c.status === "active");

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Đang tải dữ liệu hiệu suất...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Lỗi tải dữ liệu</CardTitle>
                  <CardDescription>Không thể tải thông tin hiệu suất</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {error.message || "Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại."}
              </p>
              <Button onClick={() => window.location.reload()} className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                Thử lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Only redirect to setup if onboarding not completed AND user is admin
  // Staff/manager without onboarding should see a helpful message, not get redirected to a page they can't access
  if (!onboarding?.is_completed && role === "admin") {
    return <Navigate to="/performance/setup" replace />;
  }

  if (!onboarding?.is_completed && role !== "admin") {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Hệ thống chưa được thiết lập</CardTitle>
                  <CardDescription>Module hiệu suất chưa được cấu hình</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Quản trị viên (Admin) cần hoàn tất thiết lập ban đầu cho module Hiệu suất trước khi bạn có thể sử dụng.
                Vui lòng liên hệ Admin của công ty.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) => (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hiệu suất Cá nhân</h1>
            <p className="text-muted-foreground mt-1">
              Theo dõi tiến trình, công việc và báo cáo của bạn
            </p>
          </div>
          {employee && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                {employee.total_xp.toLocaleString()} XP
              </Badge>
              {currentLevel && (
                <Badge className="gap-1.5 px-3 py-1.5">
                  <Trophy className="h-3.5 w-3.5" />
                  {currentLevel.name}
                </Badge>
              )}
            </div>
          )}
        </div>

        <Tabs defaultValue="overview" className="w-full animate-slide-up">
          <TabsList className="h-11 flex-wrap">
            <TabsTrigger value="overview" className="gap-2 px-4">
              <Trophy className="h-4 w-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2 px-4">
              <ClipboardCheck className="h-4 w-4" />
              Công việc
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 px-4">
              <FileText className="h-4 w-4" />
              Báo cáo
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-2 px-4">
              <GraduationCap className="h-4 w-4" />
              Đào tạo
            </TabsTrigger>
            <TabsTrigger value="leave" className="gap-2 px-4">
              <CalendarDays className="h-4 w-4" />
              Nghỉ phép
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2 px-4">
              <Clock className="h-4 w-4" />
              Chấm công
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 px-4">
              <User className="h-4 w-4" />
              Hồ sơ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <OnboardingChecklistCard />
            <PerformanceOverview employee={employee || null} currentLevel={currentLevel || null} isEmployeeLoading={employeeLoading} />
          </TabsContent>
          <TabsContent value="tasks" className="mt-6">
            <MyTasksTab />
          </TabsContent>
          <TabsContent value="reports" className="mt-6">
            <WorkReportTab />
          </TabsContent>
          <TabsContent value="training" className="mt-6">
            <TrainingProgramsTab />
          </TabsContent>
          <TabsContent value="leave" className="mt-6">
            <LeaveRequestTab />
          </TabsContent>
          <TabsContent value="attendance" className="mt-6">
            <AttendanceTab />
          </TabsContent>
          <TabsContent value="profile" className="mt-6 space-y-4">
            {myRecord ? (
              <>
                {/* Basic Info Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Thông tin cơ bản
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setProfileDialogOpen(true)}>
                        Sửa hồ sơ
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-0 md:grid-cols-2">
                    <div>
                        <InfoRow icon={User} label="Họ tên" value={myRecord.full_name} />
                        <InfoRow icon={Phone} label="Điện thoại" value={myRecord.phone} />
                        <InfoRow icon={Mail} label="Email cá nhân" value={myRecord.employee_profile?.personal_email} />
                        <InfoRow icon={Calendar} label="Ngày sinh" value={myRecord.employee_profile?.date_of_birth ? format(new Date(myRecord.employee_profile.date_of_birth), "dd/MM/yyyy") : null} />
                        <InfoRow icon={Shield} label="CCCD/CMND" value={myRecord.employee_profile?.id_number} />
                      </div>
                      <div>
                        <InfoRow icon={Building2} label="Phòng ban" value={myRecord.org_unit_name} />
                        <InfoRow icon={Briefcase} label="Chức vụ" value={myRecord.title || myRecord.position_name} />
                        <InfoRow icon={Calendar} label="Ngày vào làm" value={myRecord.hire_date ? format(new Date(myRecord.hire_date), "dd/MM/yyyy") : null} />
                        <InfoRow icon={CreditCard} label="Ngân hàng" value={myRecord.employee_profile?.bank_name ? `${myRecord.employee_profile.bank_name} - ${myRecord.employee_profile.bank_account || ""}` : null} />
                        <InfoRow icon={Shield} label="Mã số thuế" value={myRecord.employee_profile?.tax_code} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contract Card */}
                {activeContract && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4" />
                        Hợp đồng hiện tại
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-0 md:grid-cols-2">
                        <InfoRow icon={FileText} label="Loại HĐ" value={
                          activeContract.contract_type === "indefinite" ? "Không thời hạn" :
                          activeContract.contract_type === "fixed_term" ? "Có thời hạn" : "Thử việc"
                        } />
                        <InfoRow icon={Calendar} label="Từ ngày" value={format(new Date(activeContract.start_date), "dd/MM/yyyy")} />
                        {activeContract.end_date && (
                          <InfoRow icon={Calendar} label="Đến ngày" value={format(new Date(activeContract.end_date), "dd/MM/yyyy")} />
                        )}
                        {activeContract.contract_number && (
                          <InfoRow icon={FileText} label="Số HĐ" value={activeContract.contract_number} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <EmployeeDetailDialog
                  open={profileDialogOpen}
                  onOpenChange={setProfileDialogOpen}
                  employee={myRecord}
                  onSaveProfile={(data) => upsertProfile.mutate(data, { onSuccess: () => setProfileDialogOpen(false) })}
                  isSaving={upsertProfile.isPending}
                />
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">Chưa có hồ sơ nhân viên. Liên hệ Admin để được thêm vào hệ thống.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Performance;
