import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    // Log error to audit_logs
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        supabase.from("audit_logs").insert({
          user_id: data.user.id,
          action: "CLIENT_ERROR",
          table_name: "frontend",
          record_id: window.location.pathname,
          new_data: {
            message: error.message,
            stack: error.stack?.substring(0, 500),
            componentStack: errorInfo.componentStack?.substring(0, 500),
          },
        }).then(() => {});
      }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Đã xảy ra lỗi</h1>
            <p className="text-muted-foreground text-sm">
              {this.state.error?.message || "Một lỗi không mong muốn đã xảy ra."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
