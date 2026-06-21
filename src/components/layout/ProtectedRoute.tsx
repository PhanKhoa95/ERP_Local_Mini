import { useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  minRole?: "staff" | "manager" | "admin";
}

const roleLevel: Record<string, number> = { staff: 1, manager: 2, admin: 3 };

export function ProtectedRoute({ children, minRole }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, loading, role, companyLoading } = useAuthContext();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  if (loading || companyLoading) {
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

  // Role-based access control
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
