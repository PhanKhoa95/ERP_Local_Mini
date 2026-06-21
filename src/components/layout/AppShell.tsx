import { ReactNode, useState, Suspense, lazy } from "react";
import { Sidebar } from "./Sidebar";
import { OfflineIndicator } from "./OfflineIndicator";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const ERPChatbot = lazy(() => import("@/components/ai/ERPChatbot").then(m => ({ default: m.ERPChatbot })));

interface AppShellProps {
  children: ReactNode;
}

/**
 * Persistent app shell. Mounted ONCE for the whole authenticated app.
 * Routes render inside <main> via children — they do NOT remount the sidebar/chatbot.
 */
export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 ml-3">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">E</span>
          </div>
          <span className="text-sidebar-foreground font-semibold">ERP Mini</span>
        </div>
      </header>

      <main className={cn("transition-all duration-300", "lg:pl-64", "pt-14 lg:pt-0")}>
        {children}
      </main>

      <Suspense fallback={null}>
        <ERPChatbot />
      </Suspense>
      <OfflineIndicator />
    </div>
  );
}
