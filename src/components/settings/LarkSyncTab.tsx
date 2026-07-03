import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Zap, RefreshCw, CheckCircle2, XCircle, Settings, Plus, Trash2, Calendar, Database, ShieldAlert } from "lucide-react";

interface LarkTableConfig {
  id: string;
  entityName: string;
  larkBaseId: string;
  tableName: string;
  isEnabled: boolean;
}

interface LarkSyncLog {
  id: string;
  timestamp: string;
  entityName: string;
  recordsCount: number;
  status: "success" | "error";
  message: string;
}

export function LarkSyncTab() {
  const [isConnected, setIsConnected] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("erp-mini-lark-connected") === "true";
  });

  const [appId, setAppId] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("erp-mini-lark-app-id") || "";
  });

  const [appSecret, setAppSecret] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("erp-mini-lark-app-secret") || "";
  });

  const [syncInterval, setSyncInterval] = useState(() => {
    if (typeof window === "undefined") return "30";
    return localStorage.getItem("erp-mini-lark-sync-interval") || "30";
  });

  const [configs, setConfigs] = useState<LarkTableConfig[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("erp-mini-lark-table-configs");
    if (raw) return JSON.parse(raw);
    return [
      { id: "cfg-1", entityName: "Đơn hàng (Orders)", larkBaseId: "tbl_orders_base_922", tableName: "Đơn hàng POS", isEnabled: true },
      { id: "cfg-2", entityName: "Sản phẩm (Products)", larkBaseId: "tbl_products_base_108", tableName: "Danh mục sản phẩm", isEnabled: true },
      { id: "cfg-3", entityName: "Khách hàng (Customers)", larkBaseId: "tbl_customers_base_827", tableName: "Khách hàng & Công nợ", isEnabled: true },
      { id: "cfg-4", entityName: "Phiếu nhập kho (Stock In)", larkBaseId: "tbl_inventory_base_534", tableName: "Phiếu nhập kho", isEnabled: false },
      { id: "cfg-5", entityName: "Phiếu xuất kho (Stock Out)", larkBaseId: "tbl_inventory_base_534", tableName: "Phiếu xuất kho", isEnabled: false },
      { id: "cfg-6", entityName: "Đánh giá đơn hàng (Order Reviews)", larkBaseId: "tbl_reviews_base_112", tableName: "Đánh giá sàn TMĐT", isEnabled: false }
    ];
  });

  const [logs, setLogs] = useState<LarkSyncLog[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("erp-mini-lark-sync-logs");
    if (raw) return JSON.parse(raw);
    return [
      { id: "log-1", timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString("vi-VN"), entityName: "Đơn hàng (Orders)", recordsCount: 15, status: "success", message: "Đồng bộ tự động hoàn tất" },
      { id: "log-2", timestamp: new Date(Date.now() - 3600000 * 4).toLocaleString("vi-VN"), entityName: "Sản phẩm (Products)", recordsCount: 4, status: "success", message: "Cập nhật tồn kho sản phẩm sang Lark Base thành công" },
      { id: "log-3", timestamp: new Date(Date.now() - 3600000 * 6).toLocaleString("vi-VN"), entityName: "Khách hàng (Customers)", recordsCount: 9, status: "success", message: "Đồng bộ thông tin khách hàng mới" }
    ];
  });

  const [syncRangeFrom, setSyncRangeFrom] = useState("");
  const [syncRangeTo, setSyncRangeTo] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConnect = () => {
    if (!appId.trim() || !appSecret.trim()) {
      toast.error("Vui lòng nhập đầy đủ App ID và App Secret để kết nối.");
      return;
    }
    setIsConnected(true);
    localStorage.setItem("erp-mini-lark-connected", "true");
    localStorage.setItem("erp-mini-lark-app-id", appId);
    localStorage.setItem("erp-mini-lark-app-secret", appSecret);
    toast.success("Kết nối Lark Suite thành công! Mini app đã được cấp quyền truy cập Lark Base.");
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    localStorage.removeItem("erp-mini-lark-connected");
    toast.success("Đã ngắt kết nối Lark Suite.");
  };

  const handleToggleConfig = (id: string) => {
    const updated = configs.map(c => c.id === id ? { ...c, isEnabled: !c.isEnabled } : c);
    setConfigs(updated);
    localStorage.setItem("erp-mini-lark-table-configs", JSON.stringify(updated));
    toast.success("Cập nhật kịch bản đồng bộ thành công.");
  };

  const handleUpdateTableConfig = (id: string, field: "larkBaseId" | "tableName", value: string) => {
    const updated = configs.map(c => c.id === id ? { ...c, [field]: value } : c);
    setConfigs(updated);
    localStorage.setItem("erp-mini-lark-table-configs", JSON.stringify(updated));
  };

  const handleSaveInterval = (val: string) => {
    setSyncInterval(val);
    localStorage.setItem("erp-mini-lark-sync-interval", val);
    toast.success(`Đã đổi chu kỳ đồng bộ tự động thành: ${val} phút/lần.`);
  };

  const handleManualSync = () => {
    if (!isConnected) {
      toast.error("Vui lòng kết nối Lark Suite trước khi đồng bộ.");
      return;
    }
    setIsSyncing(true);
    toast.info("Đang bắt đầu quét dữ liệu vận hành POS để đồng bộ sang Lark Base...");

    setTimeout(() => {
      setIsSyncing(false);
      const activeConfigs = configs.filter(c => c.isEnabled);
      if (activeConfigs.length === 0) {
        toast.warning("Không có nhóm dữ liệu nào được kích hoạt để đồng bộ.");
        return;
      }

      // Add a log for each enabled entity
      const newLogs: LarkSyncLog[] = activeConfigs.map((cfg, idx) => {
        const recordsCount = Math.floor(Math.random() * 20) + 1;
        return {
          id: `log-${Date.now()}-${idx}`,
          timestamp: new Date().toLocaleString("vi-VN"),
          entityName: cfg.entityName,
          recordsCount,
          status: "success" as const,
          message: `Đồng bộ thủ công hoàn tất. Đã đẩy sang bảng "${cfg.tableName}"`
        };
      });

      const updatedLogs = [...newLogs, ...logs].slice(0, 15);
      setLogs(updatedLogs);
      localStorage.setItem("erp-mini-lark-sync-logs", JSON.stringify(updatedLogs));
      toast.success(`Đồng bộ thành công! Đã cập nhật dữ liệu sang Lark Base.`);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-foreground">
      {/* Cấu hình kết nối (Trái) */}
      <Card className="xl:col-span-5 border border-border">
        <CardHeader className="border-b pb-3 mb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-500" />
            Liên kết Lark Suite
          </CardTitle>
          <CardDescription className="text-xs">
            Kết nối Pancake POS với ứng dụng Lark của doanh nghiệp để đồng bộ dữ liệu Base một chiều.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lark-app-id" className="text-xs font-semibold">Lark App ID *</Label>
            <Input
              id="lark-app-id"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="VD: cli_a18efb99d..."
              disabled={isConnected}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lark-app-secret" className="text-xs font-semibold">Lark App Secret *</Label>
            <Input
              id="lark-app-secret"
              type="password"
              value={appSecret}
              onChange={(e) => setAppSecret(e.target.value)}
              placeholder="Nhập Lark App Secret..."
              disabled={isConnected}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-emerald-500 hover:bg-emerald-600 text-white text-[10px]" : "text-[10px]"}>
                {isConnected ? "Đã liên kết" : "Chưa liên kết"}
              </Badge>
              {isConnected && <span className="text-[10px] text-muted-foreground">Đang chạy ngầm tự động</span>}
            </div>
            {isConnected ? (
              <Button onClick={handleDisconnect} variant="destructive" size="sm" className="h-8 text-xs cursor-pointer">
                Ngắt kết nối
              </Button>
            ) : (
              <Button onClick={handleConnect} size="sm" className="h-8 text-xs cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                Liên kết ngay
              </Button>
            )}
          </div>

          {isConnected && (
            <div className="border-t pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Chu kỳ đồng bộ tự động</Label>
                <Select value={syncInterval} onValueChange={handleSaveInterval}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-foreground z-50">
                    <SelectItem value="5" className="text-xs">Mỗi 5 phút</SelectItem>
                    <SelectItem value="15" className="text-xs">Mỗi 15 phút</SelectItem>
                    <SelectItem value="30" className="text-xs">Mỗi 30 phút</SelectItem>
                    <SelectItem value="60" className="text-xs">Mỗi 60 phút</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  POS tự động đẩy dữ liệu sang các bảng Lark Base sau mỗi chu kỳ định kỳ.
                </p>
              </div>

              <div className="border-t pt-4 space-y-3">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                  Đồng bộ thủ công (Dữ liệu cũ)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground">Từ ngày</span>
                    <Input
                      type="date"
                      value={syncRangeFrom}
                      onChange={(e) => setSyncRangeFrom(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted-foreground">Đến ngày</span>
                    <Input
                      type="date"
                      value={syncRangeTo}
                      onChange={(e) => setSyncRangeTo(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-semibold"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Đang đồng bộ...
                    </>
                  ) : (
                    "Đồng bộ thủ công"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cấu hình chi tiết bảng & Lịch sử log (Phải) */}
      <div className="xl:col-span-7 space-y-6">
        {/* Mapping Tables */}
        <Card className="border border-border">
          <CardHeader className="pb-3 border-b mb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Database className="h-4 w-4 text-blue-500" />
              Cấu hình bảng đích trên Lark Base
            </CardTitle>
            <CardDescription className="text-xs">
              Mỗi thực thể dữ liệu POS tương ứng với một bảng trong Lark Base. Chỉ sửa đổi mã bảng đích.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nhóm dữ liệu POS</TableHead>
                    <TableHead className="text-xs">Lark Base ID</TableHead>
                    <TableHead className="text-xs">Tên bảng đích</TableHead>
                    <TableHead className="text-xs w-16 text-center">Đồng bộ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((cfg) => (
                    <TableRow key={cfg.id}>
                      <TableCell className="text-xs font-semibold py-2">
                        {cfg.entityName}
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          value={cfg.larkBaseId}
                          onChange={(e) => handleUpdateTableConfig(cfg.id, "larkBaseId", e.target.value)}
                          disabled={!isConnected}
                          className="h-7 text-xs font-mono py-0"
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          value={cfg.tableName}
                          onChange={(e) => handleUpdateTableConfig(cfg.id, "tableName", e.target.value)}
                          disabled={!isConnected}
                          className="h-7 text-xs py-0"
                        />
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <Switch
                          checked={cfg.isEnabled}
                          onCheckedChange={() => handleToggleConfig(cfg.id)}
                          disabled={!isConnected}
                          className="scale-90"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-3 border-t bg-muted/20 flex items-start gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                <strong>Quy tắc quan trọng:</strong> Vui lòng giữ nguyên cấu trúc cột dữ liệu mặc định do POS tạo ra trên Lark Base. Nếu đổi tên cột gốc, dữ liệu đồng bộ các phiên sau có thể bị sai lệch.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sync logs history */}
        <Card className="border border-border">
          <CardHeader className="pb-3 border-b mb-3">
            <CardTitle className="text-sm font-semibold">Lịch sử đồng bộ gần nhất</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Thời gian</TableHead>
                    <TableHead className="text-xs">Nhóm dữ liệu</TableHead>
                    <TableHead className="text-xs">Bản ghi</TableHead>
                    <TableHead className="text-xs">Kết quả</TableHead>
                    <TableHead className="text-xs">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground py-2 whitespace-nowrap">
                        {log.timestamp}
                      </TableCell>
                      <TableCell className="text-xs font-semibold py-2">
                        {log.entityName}
                      </TableCell>
                      <TableCell className="text-xs py-2 text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {log.recordsCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="flex items-center gap-1 text-[11px]">
                          {log.status === "success" ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-emerald-600 font-medium">Thành công</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5 text-destructive" />
                              <span className="text-destructive font-medium">Thất bại</span>
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-2">
                        {log.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
