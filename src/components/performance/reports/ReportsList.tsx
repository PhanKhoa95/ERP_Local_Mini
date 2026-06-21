import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CalendarDays, 
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertTriangle
} from "lucide-react";
import { WorkReport } from "@/hooks/useWorkReports";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ReportsListProps {
  reports: WorkReport[];
  isLoading: boolean;
  statusConfig: Record<string, { label: string; color: string; icon: any }>;
}

export function ReportsList({ reports, isLoading, statusConfig }: ReportsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CalendarDays className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Chưa có báo cáo nào</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const config = statusConfig[report.status];
        const StatusIcon = config?.icon || Circle;
        const completedCount = report.completed_tasks?.length || 0;
        const pendingCount = report.pending_tasks?.length || 0;
        const blockerCount = report.blockers?.length || 0;

        return (
          <Card key={report.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {format(new Date(report.report_date), "dd/MM/yyyy", { locale: vi })}
                      </span>
                      <Badge className={config?.color || "bg-muted"}>
                        {config?.label || report.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {completedCount} hoàn thành
                      </span>
                      <span className="flex items-center gap-1">
                        <Circle className="h-3 w-3 text-blue-500" />
                        {pendingCount} đang làm
                      </span>
                      {blockerCount > 0 && (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                          {blockerCount} blocker
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
