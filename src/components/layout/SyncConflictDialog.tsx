import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { SyncConflict } from "@/hooks/useOfflineQueue";

interface Props {
  conflicts: SyncConflict[];
  onResolve: (queueItemId: string, resolution: "local" | "server") => void;
  onDismiss?: () => void;
}

export function SyncConflictDialog({ conflicts, onResolve, onDismiss }: Props) {
  if (conflicts.length === 0) return null;
  const conflict = conflicts[0];

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open && onDismiss) onDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Xung đột dữ liệu ({conflicts.length})
          </DialogTitle>
          <DialogDescription>
            Dữ liệu trên server đã thay đổi trong khi bạn làm việc ngoại tuyến.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted text-sm">
            <p><span className="font-medium">Bảng:</span> {conflict.queueItem.table}</p>
            <p><span className="font-medium">Hành động:</span> {conflict.queueItem.action}</p>
            <p><span className="font-medium">Thời gian offline:</span> {new Date(conflict.queueItem.timestamp).toLocaleString("vi-VN")}</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="default"
              className="flex-1"
              onClick={() => onResolve(conflict.queueItem.id, "local")}
            >
              Giữ bản local
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onResolve(conflict.queueItem.id, "server")}
            >
              Giữ bản server
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
