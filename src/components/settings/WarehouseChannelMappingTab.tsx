import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, Link2, ChevronDown, ChevronRight, Warehouse } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const STORAGE_KEY = "erp-mini-warehouse-channel-mappings";

interface WarehouseMapping {
  id: string;
  erp_warehouse_id: string;
  platform_warehouse_name: string;
  sync_enabled: boolean;
}

interface Channel {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  mappings: WarehouseMapping[];
}

const DEFAULT_WAREHOUSES = [
  { id: "wh-1", name: "Kho chính HCM" },
  { id: "wh-2", name: "Kho Hà Nội" },
  { id: "wh-3", name: "Kho Đà Nẵng" },
];

const DEFAULT_CHANNELS: Channel[] = [
  { id: "channel-shopee", name: "Shopee", icon: "🛒", connected: true, mappings: [] },
  { id: "channel-tiktok", name: "TikTok Shop", icon: "🎵", connected: false, mappings: [] },
  { id: "channel-facebook", name: "Facebook", icon: "📘", connected: true, mappings: [] },
  { id: "channel-zalo", name: "Zalo", icon: "💬", connected: true, mappings: [] },
  { id: "channel-retail", name: "Bán tại quầy", icon: "🏪", connected: true, mappings: [] },
];

function generateId() {
  return `map-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function ChannelCard({
  channel,
  onChange,
}: {
  channel: Channel;
  onChange: (updated: Channel) => void;
}) {
  const [expanded, setExpanded] = useState(channel.connected);
  const { toast } = useToast();

  const addMapping = () => {
    onChange({
      ...channel,
      mappings: [
        ...channel.mappings,
        {
          id: generateId(),
          erp_warehouse_id: DEFAULT_WAREHOUSES[0].id,
          platform_warehouse_name: "",
          sync_enabled: true,
        },
      ],
    });
  };

  const removeMapping = (id: string) => {
    onChange({ ...channel, mappings: channel.mappings.filter((m) => m.id !== id) });
  };

  const updateMapping = (id: string, patch: Partial<WarehouseMapping>) => {
    onChange({
      ...channel,
      mappings: channel.mappings.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });
  };

  return (
    <Card className={`border ${channel.connected ? "border-border" : "border-dashed border-muted-foreground/30 opacity-60"}`}>
      <CardHeader
        className="pb-2 cursor-pointer select-none"
        onClick={() => channel.connected && setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{channel.icon}</span>
            <div>
              <div className="font-semibold text-sm flex items-center gap-2">
                {channel.name}
                {channel.connected ? (
                  <Badge variant="default" className="text-xs bg-emerald-500 hover:bg-emerald-600">
                    <Link2 className="h-3 w-3 mr-1" />
                    Đã kết nối
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Chưa kết nối
                  </Badge>
                )}
              </div>
              {channel.connected && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {channel.mappings.length} ánh xạ kho
                </div>
              )}
            </div>
          </div>
          {channel.connected && (
            <span className="text-muted-foreground">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          )}
        </div>
      </CardHeader>

      {channel.connected && expanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {channel.mappings.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-3 border border-dashed rounded-md">
                Chưa có ánh xạ kho nào. Nhấn "Thêm ánh xạ" để bắt đầu.
              </p>
            )}

            {channel.mappings.map((mapping) => {
              const erpWh = DEFAULT_WAREHOUSES.find((w) => w.id === mapping.erp_warehouse_id);
              return (
                <div
                  key={mapping.id}
                  className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center p-2 bg-muted/30 rounded-md"
                >
                  {/* ERP warehouse */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Kho ERP</Label>
                    <Select
                      value={mapping.erp_warehouse_id}
                      onValueChange={(v) => updateMapping(mapping.id, { erp_warehouse_id: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_WAREHOUSES.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id} className="text-xs">
                            {wh.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Platform warehouse name */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Kho trên sàn</Label>
                    <Input
                      className="h-8 text-xs"
                      value={mapping.platform_warehouse_name}
                      onChange={(e) =>
                        updateMapping(mapping.id, { platform_warehouse_name: e.target.value })
                      }
                      placeholder={`Tên kho ${channel.name}`}
                    />
                  </div>

                  {/* Sync toggle */}
                  <div className="flex flex-col items-center gap-1 pt-3">
                    <Label className="text-xs text-muted-foreground">Đồng bộ</Label>
                    <Switch
                      checked={mapping.sync_enabled}
                      onCheckedChange={(v) => updateMapping(mapping.id, { sync_enabled: v })}
                    />
                  </div>

                  {/* Remove */}
                  <div className="pt-4">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => removeMapping(mapping.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            <Button size="sm" variant="outline" className="w-full text-xs" onClick={addMapping}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Thêm ánh xạ kho
            </Button>
          </div>
        </CardContent>
      )}

      {!channel.connected && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            Kết nối kênh này trong mục <strong>Kênh bán hàng</strong> để cấu hình ánh xạ kho.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export function WarehouseChannelMappingTab() {
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: Channel[] = JSON.parse(raw);
        // Merge saved mappings into default channels list (in case new channels added)
        setChannels(
          DEFAULT_CHANNELS.map((def) => {
            const found = saved.find((s) => s.id === def.id);
            return found ? { ...def, mappings: found.mappings } : def;
          })
        );
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
      toast({ title: "Đã lưu cấu hình ánh xạ kho thành công." });
    } catch {
      toast({ title: "Lỗi khi lưu cấu hình.", variant: "destructive" });
    }
  };

  const updateChannel = (updated: Channel) => {
    setChannels((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const totalMappings = channels.reduce((sum, c) => sum + c.mappings.length, 0);
  const connectedCount = channels.filter((c) => c.connected).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-primary" />
            Ánh xạ kho theo kênh bán hàng
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cấu hình kho ERP tương ứng với kho trên từng sàn thương mại điện tử
          </p>
        </div>
        <Button size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-1" /> Lưu cấu hình
        </Button>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 flex-wrap">
        <Badge variant="secondary" className="text-xs gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
          {connectedCount} kênh đã kết nối
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {DEFAULT_WAREHOUSES.length} kho ERP khả dụng
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {totalMappings} ánh xạ đã tạo
        </Badge>
      </div>

      {/* Warehouse reference */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Kho ERP hiện có</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_WAREHOUSES.map((wh) => (
              <Badge key={wh.id} variant="outline" className="text-xs">
                {wh.name}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Để thêm kho mới, vào mục <strong>Quản lý kho</strong> trong hệ thống.
          </p>
        </CardContent>
      </Card>

      {/* Channel cards */}
      <div className="space-y-3">
        {channels.map((channel) => (
          <ChannelCard key={channel.id} channel={channel} onChange={updateChannel} />
        ))}
      </div>
    </div>
  );
}
