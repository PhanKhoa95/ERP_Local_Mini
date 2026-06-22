import { useState } from "react";
import { useAttendance } from "@/hooks/useAttendance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MapPin, Coffee, CheckCircle, Search, Calendar } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Props {
  isManager?: boolean;
}

export function AttendanceTab({ isManager = false }: Props) {
  const { teamRecords, teamLoading } = useAttendance();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecords = (teamRecords || []).filter((r: any) => {
    const term = searchTerm.toLowerCase();
    return (
      r.date.includes(term) ||
      (r.employee_name && r.employee_name.toLowerCase().includes(term)) ||
      r.type.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Lịch sử chấm công của Team
              </CardTitle>
              <CardDescription>Theo dõi giờ giấc check-in/check-out của các thành viên</CardDescription>
            </div>
            
            <div className="flex items-center gap-2 max-w-xs">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhân viên hoặc ngày..."
                  className="w-full bg-background border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {teamLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Coffee className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Không tìm thấy bản ghi chấm công nào</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Số giờ</TableHead>
                    <TableHead>Tăng ca</TableHead>
                    <TableHead>Hình thức</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((r: any) => (
                    <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold">{r.employee_name || "Nhân viên"}</TableCell>
                      <TableCell className="font-medium">
                        {format(new Date(r.date), "dd/MM/yyyy", { locale: vi })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.check_in ? format(new Date(r.check_in), "HH:mm:ss") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.check_out ? format(new Date(r.check_out), "HH:mm:ss") : "—"}
                      </TableCell>
                      <TableCell className="font-semibold">{r.work_hours || 0}h</TableCell>
                      <TableCell className="text-amber-600 dark:text-amber-400 font-semibold">
                        {r.overtime_hours > 0 ? `+${r.overtime_hours}h` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.type === "office" ? "default" : "outline"} className="gap-1">
                          {r.type === "office" ? <Calendar className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                          {r.type === "office" ? "Văn phòng" : "Điện trường / Ngoài"}
                        </Badge>
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
