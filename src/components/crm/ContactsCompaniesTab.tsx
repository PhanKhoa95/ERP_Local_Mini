import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Users, Building, Phone, Mail, FileText, CheckCircle2, UserCheck, ShieldCheck } from "lucide-react";

interface ContactsCompaniesTabProps {
  contacts: any[];
  companies: any[];
  createContact: any;
  createCompany: any;
}

export function ContactsCompaniesTab({ contacts, companies, createContact, createCompany }: ContactsCompaniesTabProps) {
  const [subTab, setSubTab] = useState<"contacts" | "companies">("contacts");
  
  // Dialog Open States
  const [openContact, setOpenContact] = useState(false);
  const [openCompany, setOpenCompany] = useState(false);

  // Form states
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    company_map_id: "none"
  });

  const [companyForm, setCompanyForm] = useState({
    name: "",
    tax_code: "",
    address: "",
    phone: "",
    email: ""
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name) return;
    await createContact.mutateAsync({
      name: contactForm.name,
      phone: contactForm.phone || null,
      email: contactForm.email || null,
      notes: contactForm.notes || null,
      company_map_id: contactForm.company_map_id === "none" ? null : contactForm.company_map_id
    });
    setContactForm({ name: "", phone: "", email: "", notes: "", company_map_id: "none" });
    setOpenContact(false);
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name) return;
    await createCompany.mutateAsync({
      name: companyForm.name,
      tax_code: companyForm.tax_code || null,
      address: companyForm.address || null,
      phone: companyForm.phone || null,
      email: companyForm.email || null
    });
    setCompanyForm({ name: "", tax_code: "", address: "", phone: "", email: "" });
    setOpenCompany(false);
  };

  return (
    <div className="space-y-4">
      {/* Header and Toggle Options */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border">
          <button
            onClick={() => setSubTab("contacts")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${subTab === "contacts" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Users className="h-3.5 w-3.5" /> Liên hệ cá nhân ({contacts.length})
          </button>
          <button
            onClick={() => setSubTab("companies")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${subTab === "companies" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Building className="h-3.5 w-3.5" /> Công ty / Doanh nghiệp ({companies.length})
          </button>
        </div>

        <div className="flex gap-2">
          {subTab === "contacts" ? (
            <Button size="sm" onClick={() => setOpenContact(true)} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 shadow-sm">
              <Plus className="h-3.5 w-3.5" /> Thêm Liên hệ
            </Button>
          ) : (
            <Button size="sm" onClick={() => setOpenCompany(true)} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 shadow-sm">
              <Plus className="h-3.5 w-3.5" /> Thêm Công ty
            </Button>
          )}
        </div>
      </div>

      {/* Sub Tab View: Contacts List */}
      {subTab === "contacts" && (
        <Card className="border border-border/80 shadow-md">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground text-left">
                  <th className="p-3 font-semibold">Họ tên</th>
                  <th className="p-3 font-semibold">Thông tin liên lạc</th>
                  <th className="p-3 font-semibold">Công ty trực thuộc</th>
                  <th className="p-3 font-semibold">Mô tả/Ghi chú</th>
                  <th className="p-3 font-semibold">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => {
                  const comp = companies.find((co) => co.id === c.company_map_id);
                  return (
                    <tr key={c.id} className="border-b hover:bg-secondary/15 transition-colors">
                      <td className="p-3 font-bold text-foreground flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-indigo-500" /> {c.name}
                      </td>
                      <td className="p-3 space-y-1">
                        {c.phone && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Phone className="h-3 w-3 text-indigo-500" /> {c.phone}
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Mail className="h-3 w-3 text-emerald-500" /> {c.email}
                          </div>
                        )}
                        {!c.phone && !c.email && <span className="text-[10px] italic text-muted-foreground">Chưa có liên hệ</span>}
                      </td>
                      <td className="p-3">
                        {comp ? (
                          <Badge variant="outline" className="text-[10px] px-2 py-0 border-none font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400">
                            <Building className="h-3 w-3 mr-1" /> {comp.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[10px] italic">Cá nhân tự do</span>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-muted-foreground max-w-[220px] truncate">
                        {c.notes || "-"}
                      </td>
                      <td className="p-3 text-[10px] text-muted-foreground font-mono">
                        {new Date(c.created_at).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
                {contacts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground italic">
                      Danh sách liên hệ cá nhân đang trống.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Sub Tab View: Companies List */}
      {subTab === "companies" && (
        <Card className="border border-border/80 shadow-md">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground text-left">
                  <th className="p-3 font-semibold">Tên công ty</th>
                  <th className="p-3 font-semibold">Mã số thuế</th>
                  <th className="p-3 font-semibold">Thông tin liên hệ</th>
                  <th className="p-3 font-semibold">Địa chỉ giao dịch</th>
                  <th className="p-3 font-semibold">Thành viên liên kết</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((co) => {
                  const mappedConts = contacts.filter((c) => c.company_map_id === co.id);
                  return (
                    <tr key={co.id} className="border-b hover:bg-secondary/15 transition-colors">
                      <td className="p-3 font-extrabold text-foreground flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-blue-500" /> {co.name}
                      </td>
                      <td className="p-3 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                        {co.tax_code || <span className="text-[10px] italic text-muted-foreground font-sans font-normal">-</span>}
                      </td>
                      <td className="p-3 space-y-1">
                        {co.phone && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Phone className="h-3 w-3 text-indigo-500" /> {co.phone}
                          </div>
                        )}
                        {co.email && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Mail className="h-3 w-3 text-emerald-500" /> {co.email}
                          </div>
                        )}
                        {!co.phone && !co.email && <span className="text-[10px] italic text-muted-foreground">Chưa có liên hệ</span>}
                      </td>
                      <td className="p-3 text-[11px] text-muted-foreground max-w-[200px] truncate">
                        {co.address || "-"}
                      </td>
                      <td className="p-3">
                        {mappedConts.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {mappedConts.map((c) => (
                              <Badge key={c.id} variant="secondary" className="text-[8px] font-semibold px-1 rounded">
                                {c.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[10px] italic">Chưa có thành viên</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground italic">
                      Danh sách công ty đang trống.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Add Contact Dialog */}
      <Dialog open={openContact} onOpenChange={setOpenContact}>
        <DialogContent className="sm:max-w-[400px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Plus className="h-4.5 w-4.5 text-indigo-500" /> Thêm Liên hệ cá nhân mới
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thêm một đầu mối danh bạ khách hàng thuộc hệ sinh thái.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleContactSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="contName" className="font-semibold">Họ tên liên hệ *</Label>
              <Input
                id="contName"
                className="h-8"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder="Ví dụ: Nguyễn Văn Nam"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="contPhone" className="font-semibold">Số điện thoại</Label>
                <Input
                  id="contPhone"
                  className="h-8"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="0912..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contEmail" className="font-semibold">Email</Label>
                <Input
                  id="contEmail"
                  type="email"
                  className="h-8"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="mail@domain.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold">Thuộc công ty / tổ chức</Label>
              <Select
                value={contactForm.company_map_id}
                onValueChange={(val) => setContactForm({ ...contactForm, company_map_id: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Chọn công ty..." />
                </SelectTrigger>
                <SelectContent className="bg-popover text-foreground">
                  <SelectItem value="none">Cá nhân tự do (Không gán)</SelectItem>
                  {companies.map((co) => (
                    <SelectItem key={co.id} value={co.id}>{co.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="contNotes" className="font-semibold">Ghi chú chức danh / nhu cầu</Label>
              <Textarea
                id="contNotes"
                className="min-h-[80px] text-xs"
                value={contactForm.notes}
                onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                placeholder="Ví dụ: Trưởng phòng thu mua vật tư in ấn..."
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpenContact(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">
                Lưu liên hệ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Company Dialog */}
      <Dialog open={openCompany} onOpenChange={setOpenCompany}>
        <DialogContent className="sm:max-w-[400px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Building className="h-4.5 w-4.5 text-blue-500" /> Thêm doanh nghiệp/đối tác mới
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập pháp nhân doanh nghiệp để quản lý giao dịch B2B.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompanySubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="compName" className="font-semibold">Tên doanh nghiệp *</Label>
              <Input
                id="compName"
                className="h-8"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="Ví dụ: Công ty TNHH Giải pháp Số"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="compTaxCode" className="font-semibold">Mã số thuế</Label>
                <Input
                  id="compTaxCode"
                  className="h-8"
                  value={companyForm.tax_code}
                  onChange={(e) => setCompanyForm({ ...companyForm, tax_code: e.target.value })}
                  placeholder="0102030405"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="compPhone" className="font-semibold">Số điện thoại bàn</Label>
                <Input
                  id="compPhone"
                  className="h-8"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  placeholder="0243..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="compEmail" className="font-semibold">Email doanh nghiệp</Label>
              <Input
                id="compEmail"
                type="email"
                className="h-8"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                placeholder="contact@company.com"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="compAddress" className="font-semibold">Địa chỉ giao dịch / Xuất hóa đơn</Label>
              <Textarea
                id="compAddress"
                className="min-h-[70px] text-xs"
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                placeholder="Địa chỉ chi tiết..."
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpenCompany(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">
                Lưu doanh nghiệp
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
