import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { usePerformanceOnboarding } from "@/hooks/usePerformanceOnboarding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ClipboardList, Settings, Loader2, ShieldAlert, AlertTriangle, RefreshCw, FileText, GraduationCap, UserCog, Target, FolderOpen, Briefcase, Clock, DollarSign, ShieldCheck } from "lucide-react";
import { TeamPerformanceTab } from "@/components/performance/TeamPerformanceTab";
import { ManagerReviewTab } from "@/components/performance/reports/ManagerReviewTab";
import { ManagerScoringTab } from "@/components/performance/ManagerScoringTab";
import { PerformanceSettings } from "@/components/performance/PerformanceSettings";
import { PolicyRecommendationsTab } from "@/components/performance/PolicyRecommendationsTab";
import { TrainingProgramsTab } from "@/components/performance/TrainingProgramsTab";
import { TransferHistoryPanel } from "@/components/performance/TransferHistoryPanel";
import { EmployeeRecordsTab } from "@/components/performance/EmployeeRecordsTab";
import { RecruitmentTab } from "@/components/performance/RecruitmentTab";
import { AttendanceTab } from "@/components/performance/AttendanceTab";
import { PayrollTab } from "@/components/performance/PayrollTab";
import { ComplianceTab } from "@/components/performance/ComplianceTab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PerformanceTeam = () => {
  const { role } = useCompanyContext();
  const { onboarding, isLoading, error } = usePerformanceOnboarding();
  const location = useLocation();
  const defaultTab = (location.state as any)?.activeTab || "overview";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const isManager = role === 'admin' || role === 'hr' || role === 'manager';
  const isAdmin = role === 'admin' || role === 'hr';

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Đang tải dữ liệu team...</p>
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
                  <CardDescription>Không thể tải thông tin team</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {error.message || "Đã xảy ra lỗi. Vui lòng thử lại."}
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

  if (!onboarding?.is_completed) {
    return <Navigate to="/performance/setup" replace />;
  }

  if (!isManager) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-destructive/10">
                  <ShieldAlert className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Không có quyền truy cập</CardTitle>
                  <CardDescription>Trang này chỉ dành cho Manager, HR và Admin</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bạn cần có vai trò Manager hoặc cao hơn để xem và quản lý hiệu suất team.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Team</h1>
          <p className="text-muted-foreground mt-1">
            Giám sát hiệu suất, tuyển dụng, chấm công, lương và tuân thủ
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-slide-up">
          <TabsList className="h-11 flex-wrap">
            <TabsTrigger value="overview" className="gap-2 px-4">
              <Users className="h-4 w-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="recruitment" className="gap-2 px-4">
              <Briefcase className="h-4 w-4" />
              Tuyển dụng
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2 px-4">
              <Clock className="h-4 w-4" />
              Chấm công
            </TabsTrigger>
            <TabsTrigger value="payroll" className="gap-2 px-4">
              <DollarSign className="h-4 w-4" />
              Bảng lương
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-2 px-4">
              <ClipboardList className="h-4 w-4" />
              Duyệt báo cáo
            </TabsTrigger>
            <TabsTrigger value="scoring" className="gap-2 px-4">
              <Target className="h-4 w-4" />
              Chấm KPI
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-2 px-4">
              <GraduationCap className="h-4 w-4" />
              Đào tạo
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2 px-4">
              <ShieldCheck className="h-4 w-4" />
              Tuân thủ
            </TabsTrigger>
            <TabsTrigger value="records" className="gap-2 px-4">
              <FolderOpen className="h-4 w-4" />
              Hồ sơ
            </TabsTrigger>
            <TabsTrigger value="hr" className="gap-2 px-4">
              <UserCog className="h-4 w-4" />
              Điều chuyển
            </TabsTrigger>
            <TabsTrigger value="policy" className="gap-2 px-4">
              <FileText className="h-4 w-4" />
              Chính sách
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="settings" className="gap-2 px-4">
                <Settings className="h-4 w-4" />
                Cài đặt
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <TeamPerformanceTab />
          </TabsContent>
          <TabsContent value="recruitment" className="mt-6">
            <RecruitmentTab />
          </TabsContent>
          <TabsContent value="attendance" className="mt-6">
            <AttendanceTab isManager />
          </TabsContent>
          <TabsContent value="payroll" className="mt-6">
            <PayrollTab />
          </TabsContent>
          <TabsContent value="review" className="mt-6">
            <ManagerReviewTab />
          </TabsContent>
          <TabsContent value="scoring" className="mt-6">
            <ManagerScoringTab />
          </TabsContent>
          <TabsContent value="training" className="mt-6">
            <TrainingProgramsTab isManager />
          </TabsContent>
          <TabsContent value="compliance" className="mt-6">
            <ComplianceTab />
          </TabsContent>
          <TabsContent value="records" className="mt-6">
            <EmployeeRecordsTab />
          </TabsContent>
          <TabsContent value="hr" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Điều chuyển & Thăng chức</CardTitle>
                <CardDescription>Lịch sử điều chuyển, thăng chức nhân sự trong công ty</CardDescription>
              </CardHeader>
              <CardContent>
                <TransferHistoryPanel />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="policy" className="mt-6">
            <PolicyRecommendationsTab />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="settings" className="mt-6">
              <PerformanceSettings />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default PerformanceTeam;
