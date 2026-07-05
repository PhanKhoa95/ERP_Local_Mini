import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePaymentSettings, type PaymentConfig } from "@/hooks/usePaymentSettings";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";
import { Loader2, CreditCard, Store, QrCode, Copy, ExternalLink, ShieldAlert, UserCheck, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";

export function BankSettingsTab() {
  const { config, isLoading: isPayLoading, updatePaymentSettings, authorizeStaff, revokeStaff } = usePaymentSettings();
  const { members = [], isLoading: isMembersLoading } = useCompanyMembers();
  const { toast } = useToast();

  const [bankForm, setBankForm] = useState<Omit<PaymentConfig, "id" | "company_id" | "allowed_staff_ids">>({
    bank_name: "",
    account_number: "",
    account_holder: "",
    branch: "",
    qr_type: "static",
    attach_qr_to_message: true,
  });

  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  useEffect(() => {
    if (config) {
      setBankForm({
        bank_name: config.bank_name || "",
        account_number: config.account_number || "",
        account_holder: config.account_holder || "",
        branch: config.branch || "",
        qr_type: config.qr_type || "static",
        attach_qr_to_message: config.attach_qr_to_message !== false,
      });
    }
  }, [config]);

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePaymentSettings.mutate(bankForm);
  };

  const handleAttachQrChange = (checked: boolean) => {
    setBankForm(prev => ({ ...prev, attach_qr_to_message: checked }));
    updatePaymentSettings.mutate({ attach_qr_to_message: checked });
  };

  const handleQrTypeChange = (value: "static" | "dynamic") => {
    setBankForm(prev => ({ ...prev, qr_type: value }));
    updatePaymentSettings.mutate({ qr_type: value });
  };

  const handleAddStaff = () => {
    if (!selectedStaffId) return;
    authorizeStaff.mutate(selectedStaffId, {
      onSuccess: () => setSelectedStaffId(""),
    });
  };

  const handleRemoveStaff = (staffId: string) => {
    revokeStaff.mutate(staffId);
  };

  const orderUrl = `${window.location.origin}/order`;
  const trackingUrl = `${window.location.origin}/tracking`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `Đã sao chép ${label}` });
  };

  // Get authorized staff profiles
  const authorizedStaff = (config.allowed_staff_ids || []).map(id => {
    const member = members.find(m => m.user_id === id);
    return {
      id,
      name: member?.profile?.full_name || "Nhân viên liên kết",
      phone: member?.profile?.phone || "N/A",
    };
  });

  // Filter members available to authorize (not already authorized)
  const availableStaff = members.filter(m => {
    const isAuthorized = (config.allowed_staff_ids || []).includes(m.user_id);
    return !isAuthorized;
  });

  if (isPayLoading || isMembersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bank Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-650" />
            Cấu hình tài khoản nhận tiền
          </CardTitle>
          <CardDescription>Thông tin tài khoản nhận thanh toán VietQR của shop</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBankSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên ngân hàng</Label>
                <Input
                  value={bankForm.bank_name || ""}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                  placeholder="VD: MB Bank, Techcombank, BIDV..."
                />
              </div>
              <div className="space-y-2">
                <Label>Chi nhánh</Label>
                <Input
                  value={bankForm.branch || ""}
                  onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                  placeholder="VD: Chi nhánh Hà Nội"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số tài khoản</Label>
                <Input
                  value={bankForm.account_number || ""}
                  onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                  placeholder="VD: 0123456789"
                />
              </div>
              <div className="space-y-2">
                <Label>Chủ tài khoản</Label>
                <Input
                  value={bankForm.account_holder || ""}
                  onChange={(e) => setBankForm({ ...bankForm, account_holder: e.target.value })}
                  placeholder="VD: NGUYEN VAN A"
                />
              </div>
            </div>
            <Button type="submit" disabled={updatePaymentSettings.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer font-bold">
              {updatePaymentSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lưu thông tin ngân hàng
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* VietQR Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-650" />
            Cấu hình giao dịch VietQR tự động
          </CardTitle>
          <CardDescription>Cài đặt cơ chế khớp đơn hàng tự động và gửi QR cho khách hàng</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
            <div className="space-y-1">
              <p className="font-semibold text-sm">Chế độ tạo mã VietQR</p>
              <p className="text-xs text-muted-foreground max-w-[500px]">
                {bankForm.qr_type === "dynamic" 
                  ? "QR ĐỘNG: Mỗi đơn hàng sinh một tài khoản ảo MD... có hiệu lực 30 ngày. Khách không cần nhập nội dung, hệ thống tự khớp đơn hàng tự động."
                  : "QR TĨNH: Sử dụng một số tài khoản ảo cố định cho shop. Khách bắt buộc phải nhập nội dung chuyển khoản là số điện thoại đặt hàng."}
              </p>
            </div>
            <Select value={bankForm.qr_type} onValueChange={(val: "static" | "dynamic") => handleQrTypeChange(val)}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900">
                <SelectValue placeholder="Chọn loại QR" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="static">QR Tĩnh cố định</SelectItem>
                <SelectItem value="dynamic">QR Động tự sinh</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
            <div className="space-y-1">
              <Label htmlFor="attach-qr" className="font-semibold text-sm cursor-pointer">Gửi kèm thông tin chuyển khoản và QR</Label>
              <p className="text-xs text-muted-foreground max-w-[500px]">
                Tự động gửi kèm ảnh mã QR, số tài khoản và nội dung chuyển khoản vào tin nhắn yêu cầu thanh toán gửi cho khách qua Pancake chat.
              </p>
            </div>
            <Switch
              id="attach-qr"
              checked={bankForm.attach_qr_to_message}
              onCheckedChange={handleAttachQrChange}
              className="cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Staff Permissions for Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-650" />
            Nhân viên được xem lịch sử giao dịch
          </CardTitle>
          <CardDescription>Cấp quyền cho nhân viên (kế toán, thủ quỹ) xem sao kê tài khoản ngân hàng và lịch sử đối soát trên POS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 max-w-md">
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="bg-white dark:bg-slate-900 flex-1">
                <SelectValue placeholder="Chọn nhân viên..." />
              </SelectTrigger>
              <SelectContent>
                {availableStaff.length === 0 ? (
                  <SelectItem value="none" disabled>Tất cả nhân viên đã được cấp quyền</SelectItem>
                ) : (
                  availableStaff.map(m => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profile?.full_name || "Không rõ tên"} ({m.role})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAddStaff} 
              disabled={!selectedStaffId || selectedStaffId === "none" || authorizeStaff.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
            >
              <UserCheck className="w-4 h-4 mr-1" /> Cấp quyền
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/30">
                <TableRow>
                  <TableHead>Tên nhân viên</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-20 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authorizedStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-xs italic">
                      Mặc định chỉ Admin/Chủ shop được quyền xem. Chưa có nhân viên nào được phân quyền.
                    </TableCell>
                  </TableRow>
                ) : (
                  authorizedStaff.map(staff => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-semibold text-xs">{staff.name}</TableCell>
                      <TableCell className="text-xs">{staff.phone}</TableCell>
                      <TableCell>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-success/15 text-success">
                          Đã cấp quyền
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveStaff(staff.id)}
                          disabled={revokeStaff.isPending}
                          className="h-7 w-7 text-destructive hover:bg-destructive/5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* QR Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-650" />
            QR Code & Link chia sẻ đặt hàng
          </CardTitle>
          <CardDescription>Quét hoặc chia sẻ đường dẫn để khách hàng tự đặt và tra cứu đơn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center space-y-3">
              <p className="font-semibold text-sm">Trang tự đặt hàng công khai</p>
              <div className="bg-white p-4 rounded-lg inline-block mx-auto border shadow-sm">
                <QRCodeSVG value={orderUrl} size={130} />
              </div>
              <div className="flex items-center gap-2 justify-center">
                <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px]">
                  {orderUrl}
                </code>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(orderUrl, "link đặt hàng")} className="h-8 w-8 cursor-pointer">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" asChild className="h-8 w-8 cursor-pointer">
                  <a href={orderUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="text-center space-y-3">
              <p className="font-semibold text-sm">Tra cứu hành trình đơn hàng</p>
              <div className="bg-white p-4 rounded-lg inline-block mx-auto border shadow-sm">
                <QRCodeSVG value={trackingUrl} size={130} />
              </div>
              <div className="flex items-center gap-2 justify-center">
                <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px]">
                  {trackingUrl}
                </code>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(trackingUrl, "link tra cứu")} className="h-8 w-8 cursor-pointer">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" asChild className="h-8 w-8 cursor-pointer">
                  <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
