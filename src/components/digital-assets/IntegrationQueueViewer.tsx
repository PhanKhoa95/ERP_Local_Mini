import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIntegrationSync } from "@/hooks/useIntegrationSync";
import { RefreshCw, Activity, RotateCcw, ChevronDown, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function IntegrationQueueViewer() {
  const { queue, isLoading, triggerSync } = useIntegrationSync();
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filteredQueue = statusFilter === "all"
    ? queue
    : queue.filter((item: any) => item.status === statusFilter);

  const handleRetry = async (itemId: string) => {
    const { error } = await supabase
      .from("integration_queue" as any)
      .update({ status: "pending", error_message: null, retry_count: 0 })
      .eq("id", itemId);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["integration-queue"] });
      toast({ title: "Đã đưa lại vào hàng chờ" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>Hàng đợi đồng bộ</CardTitle>
            <CardDescription>Theo dõi trạng thái đồng bộ dữ liệu từ đối tác</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => triggerSync.mutate()} disabled={triggerSync.isPending} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${triggerSync.isPending ? 'animate-spin' : ''}`} />
              Đồng bộ
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Nguồn</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Đang tải...</TableCell></TableRow>
              ) : filteredQueue.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
              ) : (
                filteredQueue.map((item: any) => (
                  <>
                    <TableRow key={item.id}>
                      <TableCell>{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell className="font-medium">{item.partner_type}</TableCell>
                      <TableCell>{item.action_type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.status === 'pending' && <Activity className="h-4 w-4 text-blue-500 animate-pulse" />}
                          {item.status === 'failed' && <AlertCircle className="h-4 w-4 text-destructive" />}
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            item.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {item.status === 'failed' && (
                            <Button variant="ghost" size="icon" onClick={() => handleRetry(item.id)} title="Thử lại">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {item.error_message && (
                            <Button variant="ghost" size="icon" title="Xem lỗi" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                              <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === item.id && item.error_message && (
                      <TableRow key={`${item.id}-error`}>
                        <TableCell colSpan={5} className="bg-destructive/5">
                          <p className="text-xs text-destructive font-mono p-2">{item.error_message}</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
