import { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Pass-through wrapper. The actual app shell (Sidebar, ERPChatbot, OfflineIndicator,
 * mobile header) is mounted ONCE in `AppShell` so that route changes don't unmount it.
 * Pages keep using <MainLayout> for backward compatibility — it now just renders children.
 */
export function MainLayout({ children }: MainLayoutProps) {
  return <>{children}</>;
}
