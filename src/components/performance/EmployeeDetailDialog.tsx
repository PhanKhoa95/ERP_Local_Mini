import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: any | null;
  onSaveProfile: (data: any) => void;
  isSaving: boolean;
}

export function EmployeeDetailDialog({ open, onOpenChange, employee, onSaveProfile, isSaving }: Props) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");

  useEffect(() => {
    if (employee) {
      setFullName(employee.full_name || "");
      setPhone(employee.phone || "");
      const profile = employee.employee_profile || {};
      setDob(profile.date_of_birth || "");
      setGender(profile.gender || "Nam");
      setIdNumber(profile.id_number || "");
      setAddress(profile.permanent_address || "");
      setBankName(profile.bank_name || "");
      setBankAccount(profile.bank_account || "");
      setTaxCode(profile.tax_code || "");
      setPersonalEmail(profile.personal_email || "");
    }
  }, [employee]);

  const handleSave = () => {
    if (!employee) return;
    onSaveProfile({
      employee_id: employee.id,
      company_id: employee.company_id || "",
      date_of_birth: dob || null,
      gender: gender || null,
      id_number: idNumber || null,
      id_issued_date: null,
      id_issued_place: null,
      permanent_address: address || null,
      current_address: address || null,
      personal_email: personalEmail || null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      bank_name: bankName || null,
      bank_account: bankAccount || null,
      tax_code: taxCode || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật hồ sơ cá nhân</DialogTitle>
          <DialogDescription>
            Điền đầy đủ thông tin chi tiết của bạn để phục vụ việc tính lương và quản lý nhân sự
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Họ tên</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div className="space-y-1">
              <Label>Số điện thoại</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912345678" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Số CCCD / Hộ chiếu</Label>
              <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="001095012345" />
            </div>
            <div className="space-y-1">
              <Label>Email cá nhân</Label>
              <Input type="email" value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} placeholder="an.nguyen@gmail.com" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Địa chỉ thường trú</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Đường Lê Lợi, Quận 1, TP.HCM" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <Label>Tên ngân hàng</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Vietcombank, Techcombank..." />
            </div>
            <div className="space-y-1">
              <Label>Số tài khoản ngân hàng</Label>
              <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="1028374827" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Mã số thuế cá nhân</Label>
            <Input value={taxCode} onChange={(e) => setTaxCode(e.target.value)} placeholder="8129384729" />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Hủy bỏ
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
