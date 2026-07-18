import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { GlobalDateFilterProvider } from "@/contexts/GlobalDateFilterContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useErrorReporter } from "@/hooks/useErrorReporter";
import { initLocalDemoSync } from "@/lib/localDemoSync";

const AppShell = lazy(() => import("@/components/layout/AppShell").then(module => ({ default: module.AppShell })));
const AppRoutes = lazy(() => import("@/routes").then(module => ({ default: module.AppRoutes })));
const Auth = lazy(() => import("./pages/Auth"));
const PublicOrder = lazy(() => import("./pages/PublicOrder"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const HealthCheck = lazy(() => import("./pages/HealthCheck"));
const CustomerDisplay = lazy(() => import("./pages/CustomerDisplay"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

// Initialize network sync for local demo mode
initLocalDemoSync(queryClient);

function ErrorReporterInit() {
  useErrorReporter();
  return null;
}

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <span className="sr-only">Đang tải trang</span>
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorReporterInit />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GlobalDateFilterProvider>
            <AuthProvider>
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/health" element={<HealthCheck />} />
                  <Route path="/order" element={<PublicOrder />} />
                  <Route path="/public-order" element={<PublicOrder />} />
                  <Route path="/tracking" element={<OrderTracking />} />
                  <Route path="/order-tracking" element={<OrderTracking />} />
                  <Route path="/help" element={<HelpCenter />} />
                  <Route path="/customer-display" element={<CustomerDisplay />} />
                  <Route path="/*" element={
                    <ProtectedRoute>
                      <AppShell>
                        <AppRoutes />
                      </AppShell>
                    </ProtectedRoute>
                  } />
                </Routes>
              </Suspense>
            </AuthProvider>
          </GlobalDateFilterProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
