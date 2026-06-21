import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, Truck, Package, XCircle, RotateCcw, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = [
  { id: "pending", label: "Chờ xử lý", icon: Clock, color: "text-warning" },
  { id: "confirmed", label: "Xác nhận", icon: Check, color: "text-info" },
  { id: "processing", label: "Đang xử lý", icon: Package, color: "text-primary" },
  { id: "shipping", label: "Đang giao", icon: Truck, color: "text-purple-500" },
  { id: "delivered", label: "Đã giao", icon: CheckCircle, color: "text-success" },
  { id: "cancelled", label: "Hủy", icon: XCircle, color: "text-destructive" },
  { id: "returned", label: "Hoàn", icon: RotateCcw, color: "text-muted-foreground" },
];

interface QuickStatusButtonsProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export function QuickStatusButtons({
  currentStatus,
  onStatusChange,
  isLoading,
  compact = false,
}: QuickStatusButtonsProps) {
  const currentConfig = statusConfig.find((s) => s.id === currentStatus);
  const CurrentIcon = currentConfig?.icon || Clock;

  // Get next logical status
  const getNextStatus = () => {
    const statusOrder = ["pending", "confirmed", "processing", "shipping", "delivered"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1];
    }
    return null;
  };

  const nextStatus = getNextStatus();
  const nextConfig = nextStatus ? statusConfig.find((s) => s.id === nextStatus) : null;

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2 text-xs", currentConfig?.color)}
            disabled={isLoading}
          >
            <CurrentIcon className="h-3 w-3 mr-1" />
            {currentConfig?.label}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
          {statusConfig.map((status) => {
            const Icon = status.icon;
            return (
              <DropdownMenuItem
                key={status.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(status.id);
                }}
                className={cn(
                  "flex items-center gap-2",
                  status.id === currentStatus && "bg-secondary"
                )}
              >
                <Icon className={cn("h-4 w-4", status.color)} />
                {status.label}
                {status.id === currentStatus && <Check className="h-3 w-3 ml-auto" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {/* Quick next status button */}
      {nextConfig && (
        <Button
          size="sm"
          variant="outline"
          className={cn("h-7 px-2 text-xs", nextConfig.color)}
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(nextConfig.id);
          }}
          disabled={isLoading}
        >
          {React.createElement(nextConfig.icon, { className: "h-3 w-3 mr-1" })}
          {nextConfig.label}
        </Button>
      )}

      {/* Dropdown for all statuses */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isLoading}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {statusConfig.map((status) => {
            const Icon = status.icon;
            return (
              <DropdownMenuItem
                key={status.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(status.id);
                }}
                className={cn(
                  "flex items-center gap-2",
                  status.id === currentStatus && "bg-secondary"
                )}
              >
                <Icon className={cn("h-4 w-4", status.color)} />
                {status.label}
                {status.id === currentStatus && <Check className="h-3 w-3 ml-auto" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Need to import React for createElement
import React from "react";
