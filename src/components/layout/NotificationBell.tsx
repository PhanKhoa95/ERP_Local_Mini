import { useState } from "react";
import { Bell, Check, Trash2, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "n-1",
      title: "Phê duyệt báo cáo",
      description: "Có 1 báo cáo chiến lược mới từ Nguyễn Văn An cần được duyệt.",
      time: "5 phút trước",
      unread: true
    },
    {
      id: "n-2",
      title: "Thanh toán tự động",
      description: "Đơn hàng DH001 đã khớp đối soát ngân hàng tự động (VietQR).",
      time: "2 giờ trước",
      unread: true
    },
    {
      id: "n-3",
      title: "Vận hành hệ thống",
      description: "Đồng bộ API Shopee Store hoàn thành thành công.",
      time: "1 ngày trước",
      unread: false
    }
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    toast.success("Đã đánh dấu đọc tất cả thông báo");
  };

  const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Đã xóa thông báo");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-secondary">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 max-h-[450px] overflow-y-auto" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Thông báo ({unreadCount})</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 text-[10px] text-primary gap-1 hover:bg-primary/5 px-2"
              >
                <MailOpen className="h-3 w-3" />
                Đọc tất cả
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Không có thông báo mới
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={`flex flex-col items-start gap-1 p-3 focus:bg-accent/40 ${
                  n.unread ? "bg-primary/5 font-medium" : ""
                }`}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <span className="text-xs text-foreground font-semibold">{n.title}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                </div>
                
                <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                  {n.description}
                </p>
                
                <div className="flex gap-2 justify-end w-full mt-1.5 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                  {n.unread && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleMarkAsRead(e, n.id)}
                      className="h-5 w-5 hover:bg-primary/10 hover:text-primary"
                      title="Đánh dấu đã đọc"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(e, n.id)}
                    className="h-5 w-5 hover:bg-destructive/10 hover:text-destructive"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
