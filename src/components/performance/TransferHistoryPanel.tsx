import { useEmployeeTransfer } from "@/hooks/useEmployeeTransfer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, History } from "lucide-react";
import { format } from "date-fns";

interface Props {
  employeeId?: string;
}

export function TransferHistoryPanel({ employeeId }: Props) {
  const { transfers = [], isLoading } = useEmployeeTransfer(employeeId);

  const getTransferBadge = (type: string) => {
    switch (type) {
      case "promotion":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Thăng chức</Badge>;
      case "demotion":
        return <Badge variant="destructive">Hạ chức</Badge>;
      case "transfer":
        return <Badge variant="secondary">Luân chuyển bộ phận</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p>Chưa ghi nhận lịch sử điều chuyển nào</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nhân viên</TableHead>
            <TableHead>Hình thức</TableHead>
            <TableHead>Thông tin chi tiết</TableHead>
            <TableHead>Ngày hiệu lực</TableHead>
            <TableHead>Lý do</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.map((t: any) => (
            <TableRow key={t.id} className="hover:bg-muted/30 transition-colors text-sm">
              <TableCell className="font-semibold flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                {t.employee_name}
              </TableCell>
              <TableCell>{getTransferBadge(t.transfer_type)}</TableCell>
              <TableCell>
                <div className="text-xs space-y-0.5">
                  {t.from_title && (
                    <div>
                      <span className="text-muted-foreground">Từ:</span> {t.from_title}
                    </div>
                  )}
                  {t.to_title && (
                    <div>
                      <span className="text-primary font-medium">Sang:</span> {t.to_title}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {t.effective_date ? format(new Date(t.effective_date), "dd/MM/yyyy") : "—"}
                </div>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={t.reason}>
                {t.reason || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
