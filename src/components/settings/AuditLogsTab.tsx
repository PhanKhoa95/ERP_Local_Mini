import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, History, User, Database, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const actionLabels: Record<string, string> = {
  INSERT: "Tạo mới",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  create: "Tạo mới",
  update: "Cập nhật",
  delete: "Xóa",
};

const tableLabels: Record<string, string> = {
  orders: "Đơn hàng",
  products: "Sản phẩm",
  partners: "Đối tác",
  inventory_transactions: "Kho hàng",
  vouchers: "Voucher",
  sales_channels: "Kênh bán",
  customer_notes: "Ghi chú KH",
  kpi_seasons: "Kỳ KPI",
  kpi_metrics: "Chỉ số KPI",
  work_reports: "Báo cáo",
  perf_employees: "Nhân viên",
  perf_org_units: "Phòng ban",
  tasks: "Công việc",
  documents: "Tài liệu",
  company_members: "Thành viên",
  profiles: "Hồ sơ",
  companies: "Công ty",
  payment_transactions: "Thanh toán",
  warehouses: "Kho",
  customer_groups: "Nhóm KH",
  shipping_zones: "Vận chuyển",
  product_bom: "Định mức BOM",
  journal_entries: "Bút toán",
  journal_lines: "Dòng bút toán",
  accounts: "Tài khoản kế toán",
};

const PAGE_SIZE = 20;

export function AuditLogsTab() {
  const { auditLogs, isLoading } = useAuditLogs(500);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);

  const filtered = auditLogs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (tableFilter !== "all" && log.table_name !== tableFilter) return false;
    if (searchText && !log.record_id?.includes(searchText) && !log.user_id?.includes(searchText)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const uniqueTables = [...new Set(auditLogs.map(l => l.table_name))].sort();
  const uniqueActions = [...new Set(auditLogs.map(l => l.action))].sort();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nhật ký hoạt động</CardTitle>
        <CardDescription>Theo dõi các thay đổi trong hệ thống</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Hành động" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {uniqueActions.map(a => (
                <SelectItem key={a} value={a}>{actionLabels[a] || a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tableFilter} onValueChange={(v) => { setTableFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Bảng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {uniqueTables.map(t => (
                <SelectItem key={t} value={t}>{tableLabels[t] || t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Tìm theo ID..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(0); }}
            className="w-[200px]"
          />
        </div>

        <div className="space-y-3">
          {paginated.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Không tìm thấy nhật ký</p>
            </div>
          ) : (
            paginated.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-lg bg-secondary/30"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant={log.action === "DELETE" || log.action === "delete" ? "destructive" : "default"}>
                      {actionLabels[log.action] || log.action}
                    </Badge>
                    <span className="text-sm font-medium">
                      {tableLabels[log.table_name] || log.table_name}
                    </span>
                  </div>
                  {log.user_id && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <User className="w-3 h-3" />
                      <span className="font-mono truncate">{log.user_id}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
                  </p>
                  {log.record_id && (
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      ID: {log.record_id}
                    </p>
                  )}
                  {log.new_data && Object.keys(log.new_data).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {Object.entries(log.new_data).map(([k, v]) => `${k}: ${v}`).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {filtered.length} kết quả · Trang {page + 1}/{totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
