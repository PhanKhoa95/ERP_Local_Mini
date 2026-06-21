import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { FileText, ChevronDown } from "lucide-react";
import { format } from "date-fns";

export function WebhookLogsPanel() {
  const { companyId } = useCompanyContext();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["webhook-logs", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_logs" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" /> Webhook Audit Logs
        </CardTitle>
        <CardDescription>Lịch sử toàn bộ request qua API Gateway</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>VNeID</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center">Đang tải...</TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Chưa có log nào</TableCell></TableRow>
              ) : (
                logs.map((log: any) => (
                  <>
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">{format(new Date(log.created_at), 'dd/MM HH:mm:ss')}</TableCell>
                      <TableCell>
                        <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-muted">{log.method}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[150px] truncate">{log.endpoint}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          log.status_code === 200 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {log.status_code || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{log.ip_address || '-'}</TableCell>
                      <TableCell>
                        {log.vneid_signature ? (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">✓</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                          <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === log.id ? 'rotate-180' : ''}`} />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedId === log.id && (
                      <TableRow key={`${log.id}-detail`}>
                        <TableCell colSpan={7} className="bg-muted/30">
                          <div className="grid gap-2 md:grid-cols-2 p-2">
                            <div>
                              <p className="text-xs font-semibold mb-1">Request Body</p>
                              <pre className="text-xs font-mono bg-background p-2 rounded max-h-32 overflow-auto">
                                {JSON.stringify(log.request_body, null, 2) || 'N/A'}
                              </pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold mb-1">Response Body</p>
                              <pre className="text-xs font-mono bg-background p-2 rounded max-h-32 overflow-auto">
                                {JSON.stringify(log.response_body, null, 2) || 'N/A'}
                              </pre>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground px-2 pb-2">User Agent: {log.user_agent || 'N/A'}</p>
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
