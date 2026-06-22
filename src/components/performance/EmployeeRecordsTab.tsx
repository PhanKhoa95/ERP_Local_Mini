import { useState } from "react";
import { useEmployeeRecords } from "@/hooks/useEmployeeRecords";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FolderOpen, User, Phone, Briefcase, Award, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmployeeRecordsTab() {
  const { employees = [], isLoading, upsertProfile } = useEmployeeRecords();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Edit states for detail dialog
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [address, setAddress] = useState("");

  const filtered = employees.filter((e: any) => {
    const term = searchTerm.toLowerCase();
    return (
      (e.full_name && e.full_name.toLowerCase().includes(term)) ||
      (e.title && e.title.toLowerCase().includes(term)) ||
      (e.position_name && e.position_name.toLowerCase().includes(term)) ||
      (e.org_unit_name && e.org_unit_name.toLowerCase().includes(term))
    );
  });

  const handleOpenDetail = (emp: any) => {
    setSelectedRecord(emp);
    const profile = emp.employee_profile || {};
    setDob(profile.date_of_birth || "");
    setGender(profile.gender || "Nam");
    setIdNumber(profile.id_number || "");
    setAddress(profile.permanent_address || "");
  };

  const handleSaveProfile = async () => {
    if (!selectedRecord) return;
    await upsertProfile.mutateAsync({
      employee_id: selectedRecord.id,
      company_id: selectedRecord.company_id || "",
      date_of_birth: dob,
      gender,
      id_number: idNumber,
      permanent_address: address,
      id_issued_date: null,
      id_issued_place: null,
      current_address: address,
      personal_email: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
    });
    setSelectedRecord(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Hồ sơ nhân sự toàn công ty
          </h2>
          <p className="text-muted-foreground text-sm">
            Xem và cập nhật thông tin cá nhân, hồ sơ chi tiết của các nhân viên
          </p>
        </div>
        
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm theo tên, phòng ban..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Không tìm thấy nhân viên nào</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Chức danh</TableHead>
                    <TableHead>Phòng ban</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Điểm XP</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((emp: any) => (
                    <TableRow key={emp.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {emp.full_name ? emp.full_name.charAt(0) : "N"}
                        </div>
                        <div>
                          <div>{emp.full_name || "Nhân viên"}</div>
                          <div className="text-xs text-muted-foreground">{emp.phone || "Chưa có SĐT"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          {emp.position_name || emp.title || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{emp.org_unit_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Award className="h-3 w-3 text-amber-500" />
                          {emp.total_xp} XP
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={emp.is_active ? "default" : "outline"}>
                          {emp.is_active ? "Đang làm việc" : "Nghỉ việc"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDetail(emp)}>
                          Xem hồ sơ
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail & Edit Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết hồ sơ nhân sự</DialogTitle>
            <DialogDescription>Cập nhật thông tin lý lịch cá nhân cho nhân sự</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-3 bg-muted/20 border rounded-lg">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {selectedRecord.full_name ? selectedRecord.full_name.charAt(0) : "N"}
                </div>
                <div>
                  <h4 className="font-semibold text-base">{selectedRecord.full_name}</h4>
                  <p className="text-xs text-muted-foreground">{selectedRecord.position_name || selectedRecord.title || "—"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Ngày sinh</Label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                
                <div className="space-y-1">
                  <Label>Giới tính</Label>
                  <select
                    className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label>Số CCCD / Hộ chiếu</Label>
                  <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Nhập số CCCD..." />
                </div>

                <div className="space-y-1">
                  <Label>Địa chỉ thường trú</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Nhập địa chỉ..." />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleSaveProfile} disabled={upsertProfile.isPending}>
                  {upsertProfile.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
