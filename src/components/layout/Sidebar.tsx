import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Ticket, Receipt, Package, Users, Wallet, BarChart3,
  Settings, LogOut, ChevronLeft, Menu, Warehouse, FileText, Search, Star,
  FolderOpen, TrendingUp, Trophy, Target, Gamepad2, UsersRound, Mic,
  ChevronDown, ClipboardList, FolderKanban, Stamp, Workflow, PackageSearch, Coins,
  FileSignature, CalendarDays, Activity, BookOpen, Bot, Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";

interface MenuItem {
  title: string;
  icon: any;
  path: string;
  minRole?: string; // admin, manager, staff
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Kinh doanh",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/" },
      { title: "POS Bán hàng", icon: ShoppingCart, path: "/pos" },
      { title: "Khuyến mãi", icon: Ticket, path: "/promotions" },
      { title: "Đơn hàng", icon: Receipt, path: "/orders" },
      { title: "Kho hàng", icon: Package, path: "/inventory" },
      { title: "Quản lý kho", icon: Warehouse, path: "/warehouses" },
      { title: "Đối tác", icon: Users, path: "/partners" },
      { title: "Tra cứu đơn hàng", icon: PackageSearch, path: "/tracking" },
      { title: "Công nợ", icon: FileText, path: "/debt-report" },
      { title: "E-Office", icon: Stamp, path: "/e-office" },
      { title: "Dashboard Chỉ thị", icon: Activity, path: "/directive-dashboard", minRole: "manager" },
      { title: "Hợp đồng", icon: FileSignature, path: "/contracts", minRole: "manager" },
      { title: "Đặt lịch", icon: CalendarDays, path: "/bookings" },
      { title: "Tự động hóa", icon: Workflow, path: "/workflows", minRole: "manager" },
      { title: "Sales Agent AI", icon: Bot, path: "/sales-agent", minRole: "manager" },
      { title: "Data Hub", icon: Database, path: "/data-hub", minRole: "manager" },
      { title: "Tài sản số", icon: Coins, path: "/digital-assets", minRole: "manager" },
      { title: "Kế toán", icon: BookOpen, path: "/accounting", minRole: "manager" },
      { title: "Tài chính", icon: Wallet, path: "/finance", minRole: "manager" },
      { title: "Báo cáo", icon: BarChart3, path: "/reports", minRole: "manager" },
    ],
  },
  {
    title: "Hiệu suất",
    items: [
      { title: "Tổng quan", icon: Trophy, path: "/performance" },
      { title: "KPI", icon: Target, path: "/performance/kpi" },
      { title: "Gamification", icon: Gamepad2, path: "/performance/gamification" },
      { title: "Quản lý Team", icon: UsersRound, path: "/performance/team", minRole: "manager" },
      { title: "Báo cáo nhanh", icon: Mic, path: "/work-report" },
      { title: "BC Chiến lược", icon: ClipboardList, path: "/strategic-report", minRole: "manager" },
      { title: "Dự án & KPI", icon: FolderKanban, path: "/projects" },
      { title: "Thiết lập", icon: Settings, path: "/performance/setup", minRole: "admin" },
    ],
  },
  {
    title: "Tài liệu",
    items: [
      { title: "Tra cứu AI", icon: Search, path: "/document-search" },
      { title: "Quản lý tài liệu", icon: FolderOpen, path: "/documents" },
      { title: "Trending", icon: TrendingUp, path: "/trending" },
      { title: "Bookmarks", icon: Star, path: "/bookmarks" },
    ],
  },
];

const roleLevel: Record<string, number> = {
  admin: 3,
  manager: 2,
  staff: 1,
};

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const { role } = useCompanyContext();

  const userLevel = roleLevel[role || "staff"] || 1;

  const handleNavClick = () => onNavigate?.();

  const filterItems = (items: MenuItem[]) =>
    items.filter(item => {
      if (!item.minRole) return true;
      return userLevel >= (roleLevel[item.minRole] || 0);
    });

  const isSectionActive = (section: MenuSection) =>
    section.items.some(item => location.pathname === item.path);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">E</span>
            </div>
            <span className="text-sidebar-foreground font-semibold text-lg">ERP Mini</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent hidden lg:flex"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {menuSections.map((section) => {
          const visibleItems = filterItems(section.items);
          if (visibleItems.length === 0) return null;
          const active = isSectionActive(section);
          
          if (collapsed) {
            return (
              <div key={section.title} className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={handleNavClick}
                      className={cn("sidebar-item justify-center", isActive && "sidebar-item-active")}
                      title={item.title}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                    </NavLink>
                  );
                })}
                <div className="border-b border-sidebar-border my-2" />
              </div>
            );
          }

          return (
            <Collapsible key={section.title} defaultOpen={active}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors">
                <ChevronDown className="h-3 w-3 transition-transform duration-200 [[data-state=closed]>&]:rotate-[-90deg]" />
                {section.title}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-1">
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={handleNavClick}
                      className={cn("sidebar-item", isActive && "sidebar-item-active")}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/settings"
          onClick={handleNavClick}
          className={cn(
            "sidebar-item",
            location.pathname === "/settings" && "sidebar-item-active"
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Cài đặt</span>}
        </NavLink>
        <button onClick={signOut} className="sidebar-item w-full text-left">
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
