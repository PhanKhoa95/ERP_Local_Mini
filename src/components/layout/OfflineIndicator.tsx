import { WifiOff, RefreshCw, Cloud } from "lucide-react";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { SyncConflictDialog } from "./SyncConflictDialog";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, conflicts, flushQueue, resolveConflict } = useOfflineQueue();

  if (isOnline && pendingCount === 0 && conflicts.length === 0) return null;

  return (
    <>
      <div className={cn(
        "fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border text-sm font-medium transition-all",
        !isOnline
          ? "bg-destructive/10 border-destructive/30 text-destructive"
          : isSyncing
          ? "bg-warning/10 border-warning/30 text-warning"
          : "bg-primary/10 border-primary/30 text-primary"
      )}>
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Ngoại tuyến</span>
            {pendingCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Đang đồng bộ...</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <Cloud className="h-4 w-4" />
            <span>{pendingCount} thao tác chờ</span>
            <button onClick={flushQueue} className="ml-1 underline text-xs">Đồng bộ</button>
          </>
        ) : null}
      </div>

      {conflicts.length > 0 && (
        <SyncConflictDialog
          conflicts={conflicts}
          onResolve={resolveConflict}
        />
      )}
    </>
  );
}
