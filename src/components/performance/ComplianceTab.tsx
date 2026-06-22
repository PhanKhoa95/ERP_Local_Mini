import { useComplianceAlerts } from "@/hooks/useComplianceAlerts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, ShieldAlert, CheckCircle, RefreshCw, AlertOctagon, Terminal } from "lucide-react";
import { format } from "date-fns";

export function ComplianceTab() {
  const { alerts, isLoading, resolveAlert, scanContractExpiry } = useComplianceAlerts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Giám sát tuân thủ nhân sự
          </h2>
          <p className="text-muted-foreground text-sm">
            Quản lý các cảnh báo về thời hạn hợp đồng, vi phạm quy chế hoặc yêu cầu pháp lý
          </p>
        </div>
        
        <Button 
          onClick={() => scanContractExpiry.mutate()} 
          disabled={scanContractExpiry.isPending} 
          className="gap-2"
        >
          {scanContractExpiry.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Quét hạn hợp đồng
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-4 w-4" />
              Cảnh báo chưa xử lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {alerts.filter(a => a.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Yêu cầu quản lý phê duyệt hoặc gia hạn</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              Đã xử lý an toàn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {alerts.filter(a => a.status === "resolved").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Các cảnh báo đã được giải quyết</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <AlertOctagon className="h-4 w-4" />
              Tổng số sự vụ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Tích lũy theo lịch sử hoạt động</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Danh sách cảnh báo tuân thủ</CardTitle>
          <CardDescription>Danh sách các cảnh báo tự động phát hiện bởi hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-40 text-emerald-500" />
              <p>Hệ thống sạch! Không có cảnh báo tuân thủ nào.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Hạn xử lý</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert: any) => (
                    <TableRow key={alert.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <Badge variant={alert.alert_type === "contract_expiry" ? "destructive" : "default"}>
                          {alert.alert_type === "contract_expiry" ? "Hết hạn HĐ" : "Quy chế"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{alert.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{alert.message}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {alert.due_date ? format(new Date(alert.due_date), "dd/MM/yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={alert.status === "pending" ? "destructive" : "secondary"}>
                          {alert.status === "pending" ? "Chờ xử lý" : "Đã xử lý"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {alert.status === "pending" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => resolveAlert.mutate(alert.id)}
                            disabled={resolveAlert.isPending}
                          >
                            Xử lý xong
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
