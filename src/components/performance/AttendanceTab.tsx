import { useState, useEffect } from "react";
import { useAttendance } from "@/hooks/useAttendance";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";
import { useEmployeeRecords } from "@/hooks/useEmployeeRecords";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Clock, MapPin, Coffee, CheckCircle, Search, Calendar, 
  Wifi, Camera, QrCode, AlertCircle, Scan, User, Play 
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  isManager?: boolean;
}

export function AttendanceTab({ isManager = false }: Props) {
  const { 
    todayRecord, 
    todayLoading, 
    monthRecords = [], 
    monthLoading, 
    teamRecords = [], 
    teamLoading, 
    checkIn, 
    checkOut 
  } = useAttendance();

  const { members = [] } = useCompanyMembers();
  const { employees = [], isLoading: employeesLoading } = useEmployeeRecords();

  const [searchTerm, setSearchTerm] = useState("");
  const [subTab, setSubTab] = useState<"matrix" | "logs">("matrix");
  const [checkInMethod, setCheckInMethod] = useState<"wifi" | "gps" | "face" | "qr">("wifi");
  const [faceDialogOpen, setFaceDialogOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Live dynamic ticking clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter manager records
  const filteredRecords = (teamRecords || []).filter((r: any) => {
    const term = searchTerm.toLowerCase();
    return (
      r.date.includes(term) ||
      (r.employee_name && r.employee_name.toLowerCase().includes(term)) ||
      (r.perf_employees?.full_name && r.perf_employees.full_name.toLowerCase().includes(term)) ||
      r.type.toLowerCase().includes(term)
    );
  });

  // Handle camera and simulation check-in
  const handleStartFaceCheckin = async () => {
    setFaceDialogOpen(true);
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      setCameraStream(stream);
      setTimeout(() => {
        setScanning(false);
        checkIn.mutate({ method: "face", matchScore: 99.4 });
        setFaceDialogOpen(false);
        stream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }, 2500);
    } catch (err) {
      console.warn("Camera not available, falling back to scanner simulator:", err);
      // Fallback simulator for demo environments
      setTimeout(() => {
        setScanning(false);
        checkIn.mutate({ method: "face-simulated", matchScore: 98.2 });
        setFaceDialogOpen(false);
      }, 2500);
    }
  };

  const handleCheckInSubmit = () => {
    if (checkInMethod === "face") {
      handleStartFaceCheckin();
    } else if (checkInMethod === "gps") {
      checkIn.mutate({
        method: "gps",
        coordinates: { lat: 21.02851, lng: 105.85422 },
        accuracy: 10
      });
    } else if (checkInMethod === "wifi") {
      checkIn.mutate({
        method: "wifi",
        ssid: "Pancake_HQ_Wifi",
        ip: "192.168.1.88"
      });
    } else {
      checkIn.mutate({
        method: "qr",
        code: "PancakeWork-HQ-Office-Dynamic-2026"
      });
    }
  };

  // Close stream helper on manual modal close
  const handleCloseFaceModal = () => {
    setFaceDialogOpen(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const videoRef = (el: HTMLVideoElement | null) => {
    if (el && cameraStream) {
      el.srcObject = cameraStream;
      el.play().catch(e => console.warn("Failed to autoplay stream:", e));
    }
  };

  // Render stats
  const totalWorkDays = monthRecords.length;
  const lateDays = monthRecords.filter(r => {
    if (!r.check_in) return false;
    const date = new Date(r.check_in);
    return date.getHours() >= 8 && date.getMinutes() > 5;
  }).length;
  const overtimeHours = monthRecords.reduce((acc, r) => acc + (r.overtime_hours || 0), 0);

  // If in manager mode, render the team logs view
  if (isManager) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground font-bold">
                  <Clock className="h-5 w-5 text-primary" />
                  Bảng công & Chấm công của Team (Pancake Work)
                </CardTitle>
                <CardDescription>Theo dõi và đối soát ngày công, giờ giấc của các nhân viên</CardDescription>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 p-0.5 bg-muted border rounded-lg">
                  <Button 
                    variant={subTab === "matrix" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs font-semibold px-3"
                    onClick={() => setSubTab("matrix")}
                  >
                    Bảng công tháng
                  </Button>
                  <Button 
                    variant={subTab === "logs" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs font-semibold px-3"
                    onClick={() => setSubTab("logs")}
                  >
                    Nhật ký chi tiết
                  </Button>
                </div>
                
                {subTab === "logs" && (
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm..."
                      className="w-full bg-background border rounded-md pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {teamLoading || employeesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : subTab === "matrix" ? (
              <div className="border border-border/60 rounded-xl overflow-hidden shadow-xs">
                {/* Scrollable Container */}
                <div className="overflow-x-auto">
                  <Table className="min-w-[1200px] table-fixed">
                    <TableHeader className="bg-muted/40 text-[11px] font-bold">
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-20 border-r w-[150px] font-bold text-foreground shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          Nhân viên
                        </TableHead>
                        {daysArray.map((day) => {
                          const d = new Date(year, month, day);
                          const dayOfWeek = d.getDay();
                          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                          return (
                            <TableHead 
                              key={day} 
                              className={cn(
                                "text-center w-8 p-1 font-mono text-[10px] border-r border-border/40",
                                isWeekend && "bg-muted/30 text-muted-foreground font-semibold"
                              )}
                            >
                              {day}
                            </TableHead>
                          );
                        })}
                        <TableHead className="text-center w-12 font-bold text-emerald-500 bg-emerald-500/5">Công</TableHead>
                        <TableHead className="text-center w-12 font-bold text-rose-500 bg-rose-500/5">Muộn</TableHead>
                        <TableHead className="text-center w-12 font-bold text-amber-500 bg-amber-500/5 border-l">OT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {employees.map((emp) => {
                        let workCount = 0;
                        let lateCount = 0;
                        let otSum = 0;

                        return (
                          <TableRow key={emp.id} className="hover:bg-muted/20 transition-all">
                            {/* Sticky Left Column: Employee details */}
                            <TableCell className="sticky left-0 bg-background font-semibold border-r z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                              <div className="font-semibold text-foreground truncate max-w-[130px]">{emp.full_name || "Nhân sự"}</div>
                              <div className="text-[9px] text-muted-foreground font-normal truncate max-w-[130px]">{emp.position_name || "Nhân viên"}</div>
                            </TableCell>

                            {/* Daily calendar cells */}
                            {daysArray.map((day) => {
                              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              const r = teamRecords.find((rec: any) => rec.employee_id === emp.id && rec.date === dateStr);
                              
                              const d = new Date(year, month, day);
                              const dayOfWeek = d.getDay();
                              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                              if (r) {
                                workCount++;
                                otSum += r.overtime_hours || 0;
                                // Simple check late (after 08:05)
                                let isLate = false;
                                if (r.check_in) {
                                  const cIn = new Date(r.check_in);
                                  isLate = cIn.getHours() > 8 || (cIn.getHours() === 8 && cIn.getMinutes() > 5);
                                }
                                if (isLate) lateCount++;

                                return (
                                  <TableCell key={day} className="p-1 text-center border-r border-border/40">
                                    <span 
                                      className={cn(
                                        "h-6 w-6 rounded-md font-bold text-[10px] flex items-center justify-center mx-auto",
                                        isLate ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                                        !r.check_out ? "bg-orange-500/15 text-orange-600 dark:text-orange-400" :
                                        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                      )}
                                      title={r.check_in ? `Vào: ${format(new Date(r.check_in), "HH:mm")} | Ra: ${r.check_out ? format(new Date(r.check_out), "HH:mm") : "Chưa ra"}` : undefined}
                                    >
                                      {isLate ? "M" : !r.check_out ? "!" : "✔"}
                                    </span>
                                  </TableCell>
                                );
                              }

                              // No record cell
                              if (isWeekend) {
                                return (
                                  <TableCell key={day} className="p-1 text-center bg-muted/20 border-r border-border/40 text-[9px] text-muted-foreground/70 font-mono">
                                    —
                                  </TableCell>
                                );
                              }

                              const isPast = d < new Date();
                              return (
                                <TableCell key={day} className="p-1 text-center border-r border-border/40">
                                  {isPast ? (
                                    <span className="h-6 w-6 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px] flex items-center justify-center mx-auto">
                                      V
                                    </span>
                                  ) : (
                                    <span className="h-6 w-6 block" />
                                  )}
                                </TableCell>
                              );
                            })}

                            {/* Summary Columns */}
                            <TableCell className="text-center font-bold text-emerald-600 bg-emerald-500/5 border-l border-r">{workCount}</TableCell>
                            <TableCell className="text-center font-bold text-rose-500 bg-rose-500/5 border-r">{lateCount}</TableCell>
                            <TableCell className="text-center font-bold text-amber-500 bg-amber-500/5">{otSum > 0 ? `+${otSum}h` : "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Caption / Legend */}
                <div className="bg-muted/10 border-t p-3 flex flex-wrap gap-4 text-[10px] text-muted-foreground font-semibold">
                  <div className="flex items-center gap-1.5"><span className="h-4.5 w-4.5 bg-emerald-500/15 text-emerald-600 font-bold rounded flex items-center justify-center text-[9px]">✔</span> Đúng giờ</div>
                  <div className="flex items-center gap-1.5"><span className="h-4.5 w-4.5 bg-amber-500/15 text-amber-600 font-bold rounded flex items-center justify-center text-[9px]">M</span> Đi muộn (sau 08:05)</div>
                  <div className="flex items-center gap-1.5"><span className="h-4.5 w-4.5 bg-orange-500/15 text-orange-600 font-bold rounded flex items-center justify-center text-[9px]">!</span> Thiếu checkout</div>
                  <div className="flex items-center gap-1.5"><span className="h-4.5 w-4.5 bg-rose-500/15 text-rose-600 font-bold rounded flex items-center justify-center text-[9px]">V</span> Vắng mặt (Nghỉ không phép)</div>
                  <div className="flex items-center gap-1.5"><span className="text-muted-foreground/60 font-mono">—</span> Cuối tuần / Ngày nghỉ</div>
                </div>
              </div>
            ) : (
              /* Flat searchable logs view */
              <div className="border border-border/60 rounded-xl overflow-hidden shadow-xs">
                <Table>
                  <TableHeader className="bg-muted/40 text-[11px] font-bold">
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
                  <TableBody className="text-xs">
                    {filteredRecords.map((r: any) => {
                      const empName = r.employee_name || r.perf_employees?.full_name || members.find(m => m.id === r.employee_id)?.profile?.full_name || members.find(m => m.id === r.employee_id)?.email || "Nhân viên";
                      return (
                        <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-semibold text-foreground">{empName}</TableCell>
                          <TableCell className="font-medium text-muted-foreground">
                            {format(new Date(r.date), "dd/MM/yyyy", { locale: vi })}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground font-mono">
                            {r.check_in ? format(new Date(r.check_in), "HH:mm:ss") : "—"}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground font-mono">
                            {r.check_out ? format(new Date(r.check_out), "HH:mm:ss") : "—"}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">{r.work_hours || 0}h</TableCell>
                          <TableCell className="text-amber-600 dark:text-amber-400 font-semibold">
                            {r.overtime_hours > 0 ? `+${r.overtime_hours}h` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={r.type === "office" || r.type === "wifi" ? "default" : "outline"} className="gap-1 text-[10px] py-0.5">
                              {r.type === "office" || r.type === "wifi" ? <Wifi className="h-2.5 w-2.5" /> : <MapPin className="h-2.5 w-2.5" />}
                              {r.type === "office" || r.type === "wifi" ? "Văn phòng (Wifi)" : "Địa điểm (GPS/Camera)"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Employee (Checkin panel) view
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Check-in panel & stats */}
      <div className="lg:col-span-1 space-y-6">
        {/* Live check-in console card */}
        <Card className="border-border/60 bg-gradient-to-b from-card to-muted/20 shadow-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pancake Work Check-In</CardTitle>
            <div className="space-y-1.5 pt-2">
              <div className="text-3xl font-extrabold text-primary font-mono tracking-tight">
                {format(time, "HH:mm:ss")}
              </div>
              <div className="text-xs text-muted-foreground font-medium capitalize">
                {format(time, "EEEE, 'ngày' dd/MM/yyyy", { locale: vi })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Method selector tab */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-muted rounded-lg border">
              <Button 
                variant={checkInMethod === "wifi" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setCheckInMethod("wifi")}
                className="h-8 w-full"
                title="Check-in Wifi"
              >
                <Wifi className="h-4 w-4" />
              </Button>
              <Button 
                variant={checkInMethod === "gps" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setCheckInMethod("gps")}
                className="h-8 w-full"
                title="Check-in GPS"
              >
                <MapPin className="h-4 w-4" />
              </Button>
              <Button 
                variant={checkInMethod === "face" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setCheckInMethod("face")}
                className="h-8 w-full"
                title="FaceID Check-in"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button 
                variant={checkInMethod === "qr" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setCheckInMethod("qr")}
                className="h-8 w-full"
                title="Quét mã QR"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>

            {/* Simulators Info */}
            <div className="p-3.5 bg-muted/20 border border-border/40 rounded-xl space-y-2">
              {checkInMethod === "wifi" && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Mạng kết nối:</span>
                    <span className="font-bold text-foreground">Pancake_HQ_Wifi</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">BSSID/MAC:</span>
                    <span className="font-mono text-muted-foreground text-[10px]">74:ac:5f:e2:1d:90</span>
                  </div>
                  <Badge variant="outline" className="mt-1 bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[10px] w-full justify-center gap-1.5 py-0.5">
                    <CheckCircle className="h-3 w-3" /> Mạng Wi-Fi hợp lệ
                  </Badge>
                </div>
              )}

              {checkInMethod === "gps" && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Tọa độ định vị:</span>
                    <span className="font-mono font-bold text-foreground">21.0285° N, 105.8542° E</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Khoảng cách:</span>
                    <span className="font-semibold text-foreground">3 mét (Hợp lệ)</span>
                  </div>
                  <Badge variant="outline" className="mt-1 bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[10px] w-full justify-center gap-1.5 py-0.5">
                    <CheckCircle className="h-3 w-3" /> Trong bán kính văn phòng
                  </Badge>
                </div>
              )}

              {checkInMethod === "face" && (
                <div className="space-y-1 text-center py-1">
                  <span className="text-[11px] text-muted-foreground block font-medium">Chấm công nhận diện khuôn mặt qua Camera</span>
                  <span className="text-[10px] text-primary block mt-0.5 font-bold">Yêu cầu quyền truy cập Camera thiết bị</span>
                </div>
              )}

              {checkInMethod === "qr" && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Thiết bị hiển thị QR:</span>
                    <span className="font-semibold text-foreground">Bảng Tivi Đại Sảnh</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Mã quét:</span>
                    <span className="font-mono text-muted-foreground text-[10px]">POS-CHECKIN-QR-DYNAMIC</span>
                  </div>
                  <Badge variant="outline" className="mt-1 bg-sky-500/5 text-sky-500 border-sky-500/20 text-[10px] w-full justify-center gap-1.5 py-0.5">
                    <CheckCircle className="h-3 w-3" /> Sẵn sàng quét camera
                  </Badge>
                </div>
              )}
            </div>

            {/* Check-in / Check-out Action Buttons */}
            {todayLoading ? (
              <Skeleton className="h-11 w-full rounded-lg" />
            ) : !todayRecord ? (
              <Button 
                onClick={handleCheckInSubmit} 
                disabled={checkIn.isPending}
                className="w-full h-11 bg-primary text-white hover:bg-primary/95 text-xs font-bold shadow-md gap-1.5 active:scale-98 transition-all"
              >
                <Clock className="h-4.5 w-4.5 animate-pulse" />
                {checkIn.isPending ? "Đang xác nhận..." : "BẮT ĐẦU CHECK-IN VÀO CA"}
              </Button>
            ) : !todayRecord.check_out ? (
              <div className="space-y-3">
                <div className="text-center p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-emerald-500 text-xs font-semibold">
                  Đã Check-in lúc: {format(new Date(todayRecord.check_in), "HH:mm:ss")}
                </div>
                <Button 
                  onClick={() => checkOut.mutate()} 
                  disabled={checkOut.isPending}
                  variant="destructive"
                  className="w-full h-11 text-xs font-bold shadow-md gap-1.5 active:scale-98 transition-all"
                >
                  <Coffee className="h-4.5 w-4.5" />
                  {checkOut.isPending ? "Đang xử lý..." : "CHECK-OUT RA CA HẾT GIỜ"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-slate-500/5 border border-slate-500/20 rounded-lg text-center space-y-1">
                  <div className="text-[11px] text-muted-foreground font-medium">Hoàn thành ngày làm việc hôm nay</div>
                  <div className="text-xs font-bold text-foreground">
                    Ca làm việc: {format(new Date(todayRecord.check_in), "HH:mm")} - {format(new Date(todayRecord.check_out), "HH:mm")}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    Tổng giờ tính công: <span className="text-primary font-bold">{todayRecord.work_hours} giờ</span>
                  </div>
                </div>
                <Badge className="w-full justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 py-1 text-xs">
                  Hôm nay đã chấm công đầy đủ
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid Card */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="py-4">
            <CardTitle className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Thống kê tháng này</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 text-center pt-0">
            <div className="p-2.5 bg-muted/20 border border-border/40 rounded-xl space-y-0.5">
              <span className="text-[10px] text-muted-foreground font-medium block">Số ngày công</span>
              <span className="text-base font-extrabold text-foreground">{totalWorkDays}</span>
              <span className="text-[9px] text-muted-foreground block font-mono">/22 ngày</span>
            </div>
            <div className="p-2.5 bg-muted/20 border border-border/40 rounded-xl space-y-0.5">
              <span className="text-[10px] text-muted-foreground font-medium block">Đi muộn</span>
              <span className={cn("text-base font-extrabold block", lateDays > 0 ? "text-rose-500 font-extrabold" : "text-foreground")}>
                {lateDays}
              </span>
              <span className="text-[9px] text-muted-foreground block font-mono">lần</span>
            </div>
            <div className="p-2.5 bg-muted/20 border border-border/40 rounded-xl space-y-0.5">
              <span className="text-[10px] text-muted-foreground font-medium block">Tăng ca</span>
              <span className="text-base font-extrabold text-amber-500">{overtimeHours}h</span>
              <span className="text-[9px] text-muted-foreground block font-mono">OT</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal attendance records list Card */}
      <div className="lg:col-span-2">
        <Card className="border-border/60 shadow-md h-full">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-foreground">Sổ chấm công cá nhân</CardTitle>
            <CardDescription>Chi tiết ghi nhận giờ vào ca, tan ca trong tháng hiện tại</CardDescription>
          </CardHeader>
          <CardContent>
            {monthLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : monthRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Coffee className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-xs">Chưa có dữ liệu chấm công tháng này.</p>
              </div>
            ) : (
              <div className="border border-border/60 rounded-xl overflow-hidden shadow-xs">
                <Table>
                  <TableHeader className="bg-muted/40 text-[11px] font-bold">
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Giờ Check-in</TableHead>
                      <TableHead>Giờ Check-out</TableHead>
                      <TableHead>Giờ công</TableHead>
                      <TableHead>Overtime</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {monthRecords.map((r: any) => {
                      const isLate = r.check_in && new Date(r.check_in).getHours() >= 8 && new Date(r.check_in).getMinutes() > 5;
                      return (
                        <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-semibold text-foreground">
                            {format(new Date(r.date), "dd/MM/yyyy", { locale: vi })}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground text-[11px]">
                            {r.check_in ? format(new Date(r.check_in), "HH:mm:ss") : "—"}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground text-[11px]">
                            {r.check_out ? format(new Date(r.check_out), "HH:mm:ss") : "—"}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">{r.work_hours || 0}h</TableCell>
                          <TableCell className="text-amber-500 font-semibold">
                            {r.overtime_hours > 0 ? `+${r.overtime_hours}h` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-[10px] border py-0.5 font-medium capitalize",
                                isLate ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              )}
                            >
                              {isLate ? "Đi muộn" : "Đúng giờ"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Face Check-In Webcam Simulator Dialog */}
      <Dialog open={faceDialogOpen} onOpenChange={(open) => !open && handleCloseFaceModal()}>
        <DialogContent className="sm:max-w-[400px] bg-background text-foreground text-xs border border-border/80 shadow-2xl z-50 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-primary">
              <Camera className="h-4.5 w-4.5" /> Chấm công Face ID (Pancake Work)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Vui lòng giữ nguyên khuôn mặt trong khung hình để tiến hành xác thực.
            </DialogDescription>
          </DialogHeader>

          <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-primary/20 bg-slate-900 flex items-center justify-center">
            {cameraStream ? (
              <video 
                ref={videoRef}
                className="w-full h-full object-cover scale-x-[-1]" 
                muted 
                playsInline 
              />
            ) : (
              <div className="text-center space-y-2 p-4">
                <AlertCircle className="h-8 w-8 mx-auto text-amber-500 animate-bounce" />
                <p className="text-slate-400 font-medium">Đang khởi động Camera Simulator...</p>
              </div>
            )}

            {/* Glowing facial scanning frame overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="h-28 w-28 border-2 border-dashed border-primary rounded-full animate-spin duration-[6s] relative">
                <div className="absolute inset-0 border border-primary/40 rounded-full scale-110" />
              </div>
              <div className="absolute h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent w-[80%] top-[45%] animate-bounce duration-[2.5s]" />
            </div>

            {scanning && (
              <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded text-[10px] text-white font-mono tracking-widest animate-pulse">
                ĐANG QUÉT VÀ KIỂM TRA CHỈ SỐ...
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              onClick={handleCloseFaceModal}
              className="w-full text-xs font-semibold"
            >
              Hủy bỏ xác thực
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
