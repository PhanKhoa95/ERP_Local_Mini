import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GlobalDateFilterProvider } from "@/contexts/GlobalDateFilterContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppRoutes } from "@/routes";
import { useErrorReporter } from "@/hooks/useErrorReporter";
import Auth from "./pages/Auth";
import PublicOrder from "./pages/PublicOrder";
import OrderTracking from "./pages/OrderTracking";
import HelpCenter from "./pages/HelpCenter";
import HealthCheck from "./pages/HealthCheck";
import { initLocalDemoSync } from "@/lib/localDemoSync";

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
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/health" element={<HealthCheck />} />
                <Route path="/order" element={<PublicOrder />} />
                <Route path="/public-order" element={<PublicOrder />} />
                <Route path="/tracking" element={<OrderTracking />} />
                <Route path="/order-tracking" element={<OrderTracking />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <AppShell>
                      <AppRoutes />
                    </AppShell>
                  </ProtectedRoute>
                } />
              </Routes>
            </AuthProvider>
          </GlobalDateFilterProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
