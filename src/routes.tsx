import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import NotFound from "./pages/NotFound";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Orders = lazy(() => import("./pages/Orders"));
const POS = lazy(() => import("./pages/POS"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Partners = lazy(() => import("./pages/Partners"));
const Memberships = lazy(() => import("./pages/Memberships"));
const Finance = lazy(() => import("./pages/Finance"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Warehouses = lazy(() => import("./pages/Warehouses"));
const DebtReport = lazy(() => import("./pages/DebtReport"));
const DocumentSearch = lazy(() => import("./pages/DocumentSearch"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const Documents = lazy(() => import("./pages/Documents"));
const TrendingAnalytics = lazy(() => import("./pages/TrendingAnalytics"));
const Performance = lazy(() => import("./pages/Performance"));
const PerformanceSetup = lazy(() => import("./pages/PerformanceSetup"));
const PerformanceKPI = lazy(() => import("./pages/PerformanceKPI"));
const PerformanceGamification = lazy(() => import("./pages/PerformanceGamification"));
const PerformanceTeam = lazy(() => import("./pages/PerformanceTeam"));
const WorkReport = lazy(() => import("./pages/WorkReport"));
const StrategicReport = lazy(() => import("./pages/StrategicReport"));
const ProjectManagement = lazy(() => import("./pages/ProjectManagement"));
const EOffice = lazy(() => import("./pages/EOffice"));
const Workflows = lazy(() => import("./pages/Workflows"));
const PlatformCallback = lazy(() => import("./pages/PlatformCallback"));
const DigitalAssets = lazy(() => import("./pages/DigitalAssets"));
const Contracts = lazy(() => import("./pages/Contracts"));
const Bookings = lazy(() => import("./pages/Bookings"));
const DirectiveDashboard = lazy(() => import("./pages/DirectiveDashboard"));
const Accounting = lazy(() => import("./pages/Accounting"));
const SalesAgent = lazy(() => import("./pages/SalesAgent"));
const DataHub = lazy(() => import("./pages/DataHub"));
const Promotions = lazy(() => import("./pages/Promotions"));

const ProductionMaterials = lazy(() => import("./pages/ProductionMaterials"));

function PageLoader() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <span className="h-8 w-64 block bg-muted animate-pulse rounded" />
        <span className="h-4 w-48 block bg-muted animate-pulse rounded" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="h-28 rounded-xl block bg-muted animate-pulse" />
        ))}
      </div>
      <span className="h-64 rounded-xl block bg-muted animate-pulse" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/memberships" element={<Memberships />} />
        <Route path="/finance" element={
          <ProtectedRoute minRole="manager"><Finance /></ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute minRole="manager"><Reports /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute minRole="admin"><Settings /></ProtectedRoute>
        } />
        <Route path="/warehouses" element={<Warehouses />} />
        <Route path="/debt-report" element={
          <ProtectedRoute minRole="manager"><DebtReport /></ProtectedRoute>
        } />
        <Route path="/document-search" element={<DocumentSearch />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/trending" element={<TrendingAnalytics />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/performance/setup" element={
          <ProtectedRoute minRole="admin"><PerformanceSetup /></ProtectedRoute>
        } />
        <Route path="/performance/kpi" element={<PerformanceKPI />} />
        <Route path="/performance/gamification" element={<PerformanceGamification />} />
        <Route path="/performance/team" element={
          <ProtectedRoute minRole="manager"><PerformanceTeam /></ProtectedRoute>
        } />
        <Route path="/work-report" element={<WorkReport />} />
        <Route path="/strategic-report" element={
          <ProtectedRoute minRole="manager"><StrategicReport /></ProtectedRoute>
        } />
        <Route path="/projects" element={<ProjectManagement />} />
        <Route path="/e-office" element={<EOffice />} />
        <Route path="/workflows" element={
          <ProtectedRoute minRole="manager"><Workflows /></ProtectedRoute>
        } />
        <Route path="/platform-callback" element={<PlatformCallback />} />
        <Route path="/digital-assets" element={
          <ProtectedRoute minRole="manager"><DigitalAssets /></ProtectedRoute>
        } />
        <Route path="/contracts" element={
          <ProtectedRoute minRole="manager"><Contracts /></ProtectedRoute>
        } />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/directive-dashboard" element={
          <ProtectedRoute minRole="manager"><DirectiveDashboard /></ProtectedRoute>
        } />
        <Route path="/accounting" element={
          <ProtectedRoute minRole="manager"><Accounting /></ProtectedRoute>
        } />
        <Route path="/sales-agent" element={
          <ProtectedRoute minRole="manager"><SalesAgent /></ProtectedRoute>
        } />
        <Route path="/data-hub" element={
          <ProtectedRoute minRole="manager"><DataHub /></ProtectedRoute>
        } />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/production/materials" element={<ProductionMaterials />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
