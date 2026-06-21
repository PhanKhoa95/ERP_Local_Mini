import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { OnboardingWizard } from "@/components/performance/onboarding/OnboardingWizard";
import { usePerformanceOnboarding } from "@/hooks/usePerformanceOnboarding";
import { Navigate } from "react-router-dom";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PerformanceSetup = () => {
  const { onboarding, isLoading, error } = usePerformanceOnboarding();

  // Wait for data to fully load (hook now handles company context internally)
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // If already completed, redirect to performance main page BEFORE rendering wizard
  if (onboarding?.is_completed) {
    return <Navigate to="/performance" replace />;
  }

  // Show error state instead of causing redirect loop
  if (error) {
    return (
      <MainLayout>
        <Header title="Thiết lập Hệ thống Hiệu suất" />
        <div className="p-6 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle>Lỗi tải dữ liệu</CardTitle>
                  <CardDescription>
                    Không thể tải thông tin thiết lập
                  </CardDescription>
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

  return (
    <MainLayout>
      <Header title="Thiết lập Hệ thống Hiệu suất" />
      <OnboardingWizard />
    </MainLayout>
  );
};

export default PerformanceSetup;
