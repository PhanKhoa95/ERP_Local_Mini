import { useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface ProtectedRouteProps {
  children: ReactNode;
  minRole?: "staff" | "manager" | "admin";
  module?: string;
}

const roleLevel: Record<string, number> = { staff: 1, manager: 2, admin: 3 };

const pathToModuleMap: Record<string, string> = {
  "/pos": "pos",
  "/orders": "orders",
  "/inventory": "inventory",
  "/warehouses": "inventory",
  "/partners": "partners",
  "/debt-report": "debt",
  "/contracts": "contracts",
  "/accounting": "accounting",
  "/finance": "finance",
  "/reports": "reports",
  "/strategic-report": "reports",
  "/settings": "settings"
};

export function ProtectedRoute({ children, minRole, module }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, role, companyLoading } = useAuthContext();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  if (loading || companyLoading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!user) return null;

  // 1. Dynamic RBAC check
  const targetModule = module || pathToModuleMap[location.pathname];
  if (targetModule) {
    const hasAccess = hasPermission(targetModule, "view");
    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md">
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Không có quyền truy cập</h1>
            <p className="text-muted-foreground">
              Bạn không có quyền xem mô-đun <strong>{targetModule}</strong>. Vui lòng liên hệ quản trị viên.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      );
    }
  }

  // 2. Legacy Role-based access control
  if (minRole) {
    const userLevel = roleLevel[role || "staff"] || 1;
    const requiredLevel = roleLevel[minRole] || 1;
    if (userLevel < requiredLevel) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md">
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Không có quyền truy cập</h1>
            <p className="text-muted-foreground">
              Bạn cần quyền <strong>{minRole}</strong> trở lên để truy cập trang này.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
