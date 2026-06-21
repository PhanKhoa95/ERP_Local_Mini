import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePlatformSync } from "@/hooks/usePlatformSync";
import { useSalesChannels } from "@/hooks/useSalesChannels";
import {
  RefreshCw, Loader2, CheckCircle, XCircle, Clock, Link2,
  AlertTriangle, Wifi, WifiOff, ArrowDown, Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const platformLabels: Record<string, string> = {
  shopee: "Shopee",
  lazada: "Lazada",
  tiktok: "TikTok Shop",
  tiki: "Tiki",
};

const platformColors: Record<string, string> = {
  shopee: "#EE4D2D",
  lazada: "#0F146D",
  tiktok: "#000000",
  tiki: "#1A94FF",
};

const platformIcons: Record<string, string> = {
  shopee: "🛒",
  lazada: "🏪",
  tiktok: "🎵",
  tiki: "📦",
};

function getTokenStatus(channel: any): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
  detail: string;
} {
  if (!channel.sync_enabled) return {
    label: "Chưa kết nối",
    variant: "secondary",
    icon: <WifiOff className="h-3 w-3" />,
    detail: "Bấm kết nối để bắt đầu đồng bộ"
  };
  if (!channel.token_expires_at) return {
    label: "Đã kết nối",
    variant: "default",
    icon: <Wifi className="h-3 w-3" />,
    detail: "Kết nối ổn định"
  };
  const expires = new Date(channel.token_expires_at);
  if (expires < new Date()) return {
    label: "Token hết hạn",
    variant: "destructive",
    icon: <AlertTriangle className="h-3 w-3" />,
    detail: "Cần kết nối lại để tiếp tục đồng bộ"
  };
  const hoursLeft = (expires.getTime() - Date.now()) / 3600000;
  if (hoursLeft < 2) return {
    label: "Sắp hết hạn",
    variant: "outline",
    icon: <Clock className="h-3 w-3" />,
    detail: `Còn ${Math.round(hoursLeft * 60)} phút`
  };
  return {
    label: "Đã kết nối",
    variant: "default",
    icon: <CheckCircle className="h-3 w-3" />,
    detail: `Token còn ${Math.round(hoursLeft)}h`
  };
}

export function PlatformSyncPanel() {
  const { channels } = useSalesChannels();
  const { syncOrders, syncLogs, getAuthUrl } = usePlatformSync();
  const [syncingChannel, setSyncingChannel] = useState<string | null>(null);
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null);

  const platformChannels = channels.filter(
    (c: any) => c.platform_type && c.platform_type !== "manual"
  );

  if (platformChannels.length === 0) return null;

  const connectedChannels = platformChannels.filter((c: any) => c.sync_enabled);
  const disconnectedChannels = platformChannels.filter((c: any) => !c.sync_enabled);

  const handleSync = async (channelId: string) => {
    setSyncingChannel(channelId);
    try {
      await syncOrders.mutateAsync({ channelId });
    } finally {
      setSyncingChannel(null);
    }
  };

  const handleConnect = async (channel: any) => {
    // Tiki uses token-based auth, no OAuth needed
    if (channel.platform_type === "tiki") {
      return;
    }

    setConnectingChannel(channel.id);
    try {
      const redirectUri = window.location.origin + "/platform-callback";
      const url = await getAuthUrl.mutateAsync({
        channelId: channel.id,
        redirectUri: redirectUri + "?state=" + channel.id,
      });
      if (url) window.location.href = url;
    } catch {
      setConnectingChannel(null);
    }
  };

  const recentLogs = syncLogs.slice(0, 5);

  const statusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="h-3.5 w-3.5 text-green-600" />;
      case "failed": return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case "running": return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
      case "partial": return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <Card className="overflow-hidden border-border/50">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-1.5 ring-1 ring-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Đồng bộ đơn sàn</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {connectedChannels.length}/{platformChannels.length} kênh đang kết nối
              </p>
            </div>
          </div>
          {connectedChannels.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={syncOrders.isPending} className="gap-2">
                  {syncOrders.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Đồng bộ
                  <ArrowDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {connectedChannels.map((channel: any) => (
                  <DropdownMenuItem
                    key={channel.id}
                    onClick={() => handleSync(channel.id)}
                    disabled={syncingChannel === channel.id}
                    className="gap-2"
                  >
                    <span className="text-base">{platformIcons[channel.platform_type] || "📦"}</span>
                    <span className="font-medium">{channel.name}</span>
                    {channel.last_synced_at && (
                      <span className="text-[10px] text-muted-foreground ml-auto pl-4">
                        {formatDistanceToNow(new Date(channel.last_synced_at), { addSuffix: true, locale: vi })}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Channel status cards */}
        <div className="space-y-2">
          {platformChannels.map((channel: any) => {
            const tokenStatus = getTokenStatus(channel);
            const isSyncing = syncingChannel === channel.id;
            const platformColor = platformColors[channel.platform_type] || channel.color;

            return (
              <div
                key={channel.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg border border-border/50 transition-all duration-300 ${
                  isSyncing ? 'ring-1 ring-primary/30 bg-primary/5' : 'hover:bg-secondary/30'
                }`}
              >
                {/* Platform icon & color indicator */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: platformColor }}
                >
                  {platformIcons[channel.platform_type] || channel.name.charAt(0)}
                </div>

                {/* Channel info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">{channel.name}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant={tokenStatus.variant} className="text-[10px] px-1.5 py-0 gap-1">
                            {tokenStatus.icon}
                            {tokenStatus.label}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">{tokenStatus.detail}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {channel.sync_enabled && channel.last_synced_at && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Đồng bộ {formatDistanceToNow(new Date(channel.last_synced_at), { addSuffix: true, locale: vi })}
                    </p>
                  )}
                  {isSyncing && (
                    <div className="mt-1.5 shimmer-progress rounded-full">
                      <Progress value={65} className="h-1" />
                    </div>
                  )}
                </div>

                {/* Action button */}
                {!channel.sync_enabled ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5 shrink-0 gap-1"
                    onClick={() => handleConnect(channel)}
                    disabled={connectingChannel === channel.id}
                  >
                    {connectingChannel === channel.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Link2 className="h-3 w-3" />
                        Kết nối
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2 shrink-0"
                    onClick={() => handleSync(channel.id)}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Sync log timeline */}
        {recentLogs.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Lịch sử đồng bộ
            </p>
            <div className="sync-timeline space-y-2.5">
              {recentLogs.map((log: any, index: number) => (
                <div key={log.id} className="relative pl-5 animate-fade-in" style={{ animationDelay: `${index * 80}ms` }}>
                  <div className={`sync-timeline-dot ${log.status === 'success' ? 'success' : log.status === 'failed' ? 'error' : log.status === 'running' ? 'running' : ''}`}>
                    <div className="scale-75">{statusIcon(log.status)}</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm py-0.5">
                    <span className="font-medium text-foreground text-xs">
                      {(log.sales_channels as any)?.name || "—"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {log.records_synced || 0} đơn
                    </span>
                    {log.status === "failed" && log.error_message && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          </TooltipTrigger>
                          <TooltipContent className="text-xs max-w-64">{log.error_message}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(log.started_at), { addSuffix: true, locale: vi })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
