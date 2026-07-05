import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Plus, Users, Building, Phone, Mail, FileText, CheckCircle2, UserCheck, AlertTriangle, ArrowRight, CalendarDays, Coins, ClipboardList, CheckSquare } from "lucide-react";

interface ContactsCompaniesTabProps {
  contacts: any[];
  companies: any[];
  createContact: any;
  createCompany: any;
  mergeContacts: any;

  // Activities references
  appointments: any[];
  deals: any[];
  tickets: any[];
  tasks: any[];
  
  // Actions references
  createAppointment: any;
  createDeal: any;
  createTicket: any;
  createTask: any;
}

export function ContactsCompaniesTab({
  contacts,
  companies,
  createContact,
  createCompany,
  mergeContacts,
  appointments,
  deals,
  tickets,
  tasks,
  createAppointment,
  createDeal,
  createTicket,
  createTask
}: ContactsCompaniesTabProps) {
  const [subTab, setSubTab] = useState<"contacts" | "companies">("contacts");
  
  // Dialog Open States
  const [openContact, setOpenContact] = useState(false);
  const [openCompany, setOpenCompany] = useState(false);
  const [openMerge, setOpenMerge] = useState(false);

  // Contact Details Sheet
  const [selectedContact, setSelectedContact] = useState<any | null>(null);

  // Forms states
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

  // Merge Duplicates Form State
  const [mergeState, setMergeState] = useState<{
    phoneOrEmail: string;
    duplicates: any[];
    mainContactId: string;
  }>({ phoneOrEmail: "", duplicates: [], mainContactId: "" });

  // Quick Create forms from Detail view
  const [openQuickApt, setOpenQuickApt] = useState(false);
  const [quickAptTime, setQuickAptTime] = useState("");
  const [quickAptPurpose, setQuickAptPurpose] = useState("");

  const [openQuickDeal, setOpenQuickDeal] = useState(false);
  const [quickDealAmount, setQuickDealAmount] = useState("");
  const [quickDealTitle, setQuickDealTitle] = useState("");

  const [openQuickTicket, setOpenQuickTicket] = useState(false);
  const [quickTicketTitle, setQuickTicketTitle] = useState("");
  const [quickTicketDesc, setQuickTicketDesc] = useState("");

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

  // Find duplicates
  const detectDuplicates = (c: any) => {
    if (!c.phone && !c.email) return [];
    return contacts.filter(other => 
      other.id !== c.id && 
      ((c.phone && other.phone === c.phone) || (c.email && other.email === c.email))
    );
  };

  const handleTriggerMerge = (contact: any, dups: any[]) => {
    const allDups = [contact, ...dups];
    setMergeState({
      phoneOrEmail: contact.phone || contact.email || "",
      duplicates: allDups,
      mainContactId: contact.id
    });
    setOpenMerge(true);
  };

  const handleMergeSubmit = async () => {
    const duplicateIds = mergeState.duplicates
      .map(d => d.id)
      .filter(id => id !== mergeState.mainContactId);
    
    await mergeContacts.mutateAsync({
      mainContactId: mergeState.mainContactId,
      duplicateContactIds: duplicateIds
    });
    setOpenMerge(false);
  };

  // Quick Action Submits
  const handleQuickAptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !quickAptTime) return;
    await createAppointment.mutateAsync({
      customer_name: selectedContact.name,
      phone: selectedContact.phone,
      appointment_time: new Date(quickAptTime).toISOString(),
      status: "scheduled",
      purpose: quickAptPurpose || null
    });
    setQuickAptTime("");
    setQuickAptPurpose("");
    setOpenQuickApt(false);
  };

  const handleQuickDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !quickDealTitle) return;
    await createDeal.mutateAsync({
      title: quickDealTitle,
      amount: Number(quickDealAmount) || 0,
      stage: "new",
      priority: "medium",
      close_date: null,
      lead_id: null
    });
    setQuickDealTitle("");
    setQuickDealAmount("");
    setOpenQuickDeal(false);
  };

  const handleQuickTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !quickTicketTitle) return;
    await createTicket.mutateAsync({
      customer_name: selectedContact.name,
      phone: selectedContact.phone,
      title: quickTicketTitle,
      description: quickTicketDesc || null,
      priority: "medium",
      status: "open",
      assigned_to: null
    });
    setQuickTicketTitle("");
    setQuickTicketDesc("");
    setOpenQuickTicket(false);
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
                  <th className="p-3 font-semibold">Trùng lặp</th>
                  <th className="p-3 font-semibold">Mô tả/Ghi chú</th>
                  <th className="p-3 font-semibold">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => {
                  const comp = companies.find((co) => co.id === c.company_map_id);
                  const dups = detectDuplicates(c);
                  return (
                    <tr key={c.id} className="border-b hover:bg-secondary/15 transition-colors">
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedContact(c)}
                          className="font-bold text-foreground flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 text-left"
                        >
                          <UserCheck className="h-3.5 w-3.5 text-indigo-500" /> {c.name}
                        </button>
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
                      <td className="p-3">
                        {dups.length > 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTriggerMerge(c, dups)}
                            className="h-6 text-[9px] font-bold border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 px-1.5 flex items-center gap-1"
                          >
                            <AlertTriangle className="h-3 w-3" /> Trùng ({dups.length})
                          </Button>
                        ) : (
                          <span className="text-emerald-600 text-[10px] font-semibold">✓ Duy nhất</span>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-muted-foreground max-w-[180px] truncate">
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
                    <td colSpan={6} className="p-12 text-center text-muted-foreground italic">
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

      {/* Merge Contacts Dialog */}
      <Dialog open={openMerge} onOpenChange={setOpenMerge}>
        <DialogContent className="sm:max-w-[480px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-rose-600">
              <AlertTriangle className="h-4.5 w-4.5" /> Gộp trùng lặp Liên hệ
            </DialogTitle>
            <DialogDescription className="text-xs">
              Các tài khoản trùng SĐT/Email sẽ được gộp làm một. Chọn liên hệ chính để giữ lại. Ghi chú của các liên hệ cũ sẽ được tự động gộp nối tiếp.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="font-semibold">Chọn bản ghi thông tin chính (Main Record):</Label>
              <Select
                value={mergeState.mainContactId}
                onValueChange={(val) => setMergeState({ ...mergeState, mainContactId: val })}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Chọn liên hệ giữ lại..." />
                </SelectTrigger>
                <SelectContent className="bg-popover text-foreground">
                  {mergeState.duplicates.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.phone || d.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 border p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40">
              <div className="text-[10px] font-bold text-foreground uppercase">Danh sách các bản ghi sẽ bị loại bỏ:</div>
              <div className="space-y-1.5">
                {mergeState.duplicates
                  .filter(d => d.id !== mergeState.mainContactId)
                  .map(d => (
                    <div key={d.id} className="flex justify-between items-center text-[10px] font-semibold text-muted-foreground p-1 border-b">
                      <span>{d.name} ({d.phone || d.email})</span>
                      <Badge variant="outline" className="text-[8px] bg-rose-50 text-rose-500 border-none">Sẽ xóa</Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setOpenMerge(false)}>Thoát</Button>
            <Button
              type="button"
              size="sm"
              onClick={handleMergeSubmit}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm"
            >
              Xác nhận Gộp trùng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Details Sheet (Activity Stream) */}
      <Sheet open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <SheetContent className="sm:max-w-[450px] bg-background text-foreground text-xs overflow-y-auto">
          {selectedContact && (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-6 w-6 text-indigo-500" />
                  <div>
                    <SheetTitle className="text-sm font-bold text-left">{selectedContact.name}</SheetTitle>
                    <SheetDescription className="text-[10px] text-left">
                      Khởi tạo: {new Date(selectedContact.created_at).toLocaleDateString("vi-VN")}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* General Info Card */}
              <Card className="border border-border/80 shadow-sm bg-slate-50/50 dark:bg-slate-900/10">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="font-bold">{selectedContact.phone || "Chưa cập nhật SĐT"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="font-bold">{selectedContact.email || "Chưa cập nhật Email"}</span>
                  </div>
                  {selectedContact.notes && (
                    <p className="text-[11px] text-muted-foreground italic border-t pt-2 mt-2 leading-relaxed">
                      "{selectedContact.notes}"
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions Panel */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-foreground uppercase tracking-tight">Thao tác nhanh:</div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setOpenQuickApt(true)} className="h-7 text-[10px] font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 flex-1 shadow-sm">
                    <CalendarDays className="h-3 w-3" /> Đặt lịch hẹn
                  </Button>
                  <Button size="sm" onClick={() => setOpenQuickDeal(true)} className="h-7 text-[10px] font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 flex-1 shadow-sm">
                    <Coins className="h-3 w-3" /> Tạo Cơ hội
                  </Button>
                  <Button size="sm" onClick={() => setOpenQuickTicket(true)} className="h-7 text-[10px] font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 flex-1 shadow-sm">
                    <AlertTriangle className="h-3 w-3" /> Báo sự cố
                  </Button>
                </div>
              </div>

              {/* Activity Stream Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="text-[10px] font-bold text-foreground uppercase tracking-tight flex items-center gap-1">
                  <ClipboardList className="h-3.5 w-3.5 text-indigo-500" /> Lịch sử hoạt động liên kết
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-0.5">
                  {/* Matching Appointments */}
                  {appointments
                    .filter(a => a.customer_name === selectedContact.name || a.phone === selectedContact.phone)
                    .map(apt => (
                      <div key={apt.id} className="p-3 border rounded-xl bg-card space-y-1 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[11px] text-foreground flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-emerald-500" /> Lịch hẹn chăm sóc
                          </span>
                          <Badge variant="outline" className="text-[8px] font-bold bg-emerald-50 border-none text-emerald-600 px-1">{apt.status}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-semibold">
                          Thời gian: {new Date(apt.appointment_time).toLocaleString("vi-VN")}
                        </p>
                        {apt.purpose && <p className="text-[10px] text-muted-foreground italic">"{apt.purpose}"</p>}
                      </div>
                    ))}

                  {/* Matching Tickets */}
                  {tickets
                    .filter(t => t.customer_name === selectedContact.name || t.phone === selectedContact.phone)
                    .map(tkt => (
                      <div key={tkt.id} className="p-3 border rounded-xl bg-card space-y-1 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[11px] text-foreground flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-rose-500" /> Khiếu nại/Sự cố: {tkt.title}
                          </span>
                          <Badge variant="outline" className="text-[8px] font-bold bg-rose-50 border-none text-rose-600 px-1">{tkt.status}</Badge>
                        </div>
                        {tkt.description && <p className="text-[10px] text-muted-foreground italic">"{tkt.description}"</p>}
                      </div>
                    ))}

                  {/* Matching Deals */}
                  {deals
                    .filter(d => d.title.toLowerCase().includes(selectedContact.name.toLowerCase()))
                    .map(deal => (
                      <div key={deal.id} className="p-3 border rounded-xl bg-card space-y-1 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[11px] text-foreground flex items-center gap-1">
                            <Coins className="h-3 w-3 text-amber-500" /> Cơ hội bán hàng: {deal.title}
                          </span>
                          <Badge variant="outline" className="text-[8px] font-bold bg-amber-50 border-none text-amber-600 px-1">{deal.stage}</Badge>
                        </div>
                        <p className="text-[10px] text-indigo-650 font-bold">Trị giá: {Number(deal.amount || 0).toLocaleString("vi-VN")}đ</p>
                      </div>
                    ))}

                  {/* Empty activities check */}
                  {appointments.filter(a => a.customer_name === selectedContact.name || a.phone === selectedContact.phone).length === 0 &&
                   tickets.filter(t => t.customer_name === selectedContact.name || t.phone === selectedContact.phone).length === 0 &&
                   deals.filter(d => d.title.toLowerCase().includes(selectedContact.name.toLowerCase())).length === 0 && (
                     <div className="text-center py-8 text-[11px] italic text-muted-foreground">
                       Chưa ghi nhận lịch sử hoạt động liên kết nào.
                     </div>
                   )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Quick Create Appointments Dialog */}
      <Dialog open={openQuickApt} onOpenChange={setOpenQuickApt}>
        <DialogContent className="sm:max-w-[360px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <CalendarDays className="h-4.5 w-4.5 text-indigo-500" /> Tạo lịch hẹn nhanh
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleQuickAptSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="quickAptTime" className="font-semibold">Thời gian hẹn *</Label>
              <Input
                id="quickAptTime"
                type="datetime-local"
                className="h-8"
                value={quickAptTime}
                onChange={(e) => setQuickAptTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="quickAptPurpose" className="font-semibold">Nội dung cuộc gọi / gặp</Label>
              <Textarea
                id="quickAptPurpose"
                className="min-h-[60px] text-xs"
                value={quickAptPurpose}
                onChange={(e) => setQuickAptPurpose(e.target.value)}
                placeholder="Ghi chú nội dung..."
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpenQuickApt(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold">
                Đặt lịch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Create Deals Dialog */}
      <Dialog open={openQuickDeal} onOpenChange={setOpenQuickDeal}>
        <DialogContent className="sm:max-w-[360px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Coins className="h-4.5 w-4.5 text-indigo-500" /> Tạo cơ hội bán hàng nhanh
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleQuickDealSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="quickDealTitle" className="font-semibold">Tiêu đề Deal *</Label>
              <Input
                id="quickDealTitle"
                className="h-8"
                value={quickDealTitle}
                onChange={(e) => setQuickDealTitle(e.target.value)}
                placeholder={`Ví dụ: Hợp đồng in B2B cho ${selectedContact?.name}`}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="quickDealAmount" className="font-semibold">Trị giá dự kiến (đ) *</Label>
              <Input
                id="quickDealAmount"
                type="number"
                className="h-8"
                value={quickDealAmount}
                onChange={(e) => setQuickDealAmount(e.target.value)}
                placeholder="5000000"
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpenQuickDeal(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold">
                Tạo Deal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Create Tickets Dialog */}
      <Dialog open={openQuickTicket} onOpenChange={setOpenQuickTicket}>
        <DialogContent className="sm:max-w-[360px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-500" /> Báo cáo sự cố nhanh
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleQuickTicketSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="quickTicketTitle" className="font-semibold">Tiêu đề lỗi sản phẩm *</Label>
              <Input
                id="quickTicketTitle"
                className="h-8"
                value={quickTicketTitle}
                onChange={(e) => setQuickTicketTitle(e.target.value)}
                placeholder="Ví dụ: Thiếu 50 sticker in ấn"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="quickTicketDesc" className="font-semibold">Chi tiết lỗi phản ánh</Label>
              <Textarea
                id="quickTicketDesc"
                className="min-h-[60px] text-xs"
                value={quickTicketDesc}
                onChange={(e) => setQuickTicketDesc(e.target.value)}
                placeholder="Ghi chú chi tiết sự cố..."
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpenQuickTicket(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                Tạo Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
