import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Users, UserPlus, Phone, Mail, FileText, CheckCircle2, ListFilter } from "lucide-react";
import { CustomFieldsDialog } from "./CustomFieldsDialog";

interface LeadsTabProps {
  leads: any[];
  createLead: any;
  updateLeadStatus: any;
  convertLeadToPartner: any;
  customFields: any[];
  customFieldValues: any[];
  saveCustomFieldValues: any;
  createCustomField: any;
}

const statusLabels: Record<string, string> = {
  new: "Mới tạo",
  contacting: "Đang liên hệ",
  unqualified: "Không tiềm năng",
  converted: "Đã chuyển đổi"
};

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
  contacting: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
  unqualified: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-750",
  converted: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900"
};

const sourceLabels: Record<string, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  website: "Website",
  manual: "Thủ công"
};

export function LeadsTab({
  leads,
  createLead,
  updateLeadStatus,
  convertLeadToPartner,
  customFields,
  customFieldValues,
  saveCustomFieldValues,
  createCustomField
}: LeadsTabProps) {
  const [open, setOpen] = useState(false);
  const [openFieldsConfig, setOpenFieldsConfig] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    source: "manual",
    notes: ""
  });

  // Dynamic custom fields form state
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, string>>({});

  const handleCustomFieldChange = (fieldId: string, val: string) => {
    setCustomFieldsData((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    // 1. Create the lead
    const newLead = await createLead.mutateAsync({
      name: formData.name,
      phone: formData.phone || null,
      email: formData.email || null,
      source: formData.source,
      status: "new",
      notes: formData.notes || null
    });

    // 2. Save custom fields values using the new lead's ID
    if (newLead && newLead.id) {
      await saveCustomFieldValues.mutateAsync({
        entityId: newLead.id,
        values: customFieldsData
      });
    }

    setFormData({ name: "", phone: "", email: "", source: "manual", notes: "" });
    setCustomFieldsData({});
    setOpen(false);
  };

  const handleConvert = async (lead: any) => {
    await convertLeadToPartner.mutateAsync({
      leadId: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email
    });
  };

  return (
    <div className="space-y-4">
      {/* Header and Add Button */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Users className="h-4.5 w-4.5 text-indigo-500" /> Quản lý Khách hàng tiềm năng (Leads)
          </h2>
          <p className="text-[11px] text-muted-foreground">Theo dõi và chăm sóc khách hàng quan tâm trước khi chốt đơn</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpenFieldsConfig(true)}
            className="h-8 text-xs font-semibold border-indigo-200 text-indigo-650 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 gap-1"
          >
            <ListFilter className="h-3.5 w-3.5" /> Trường tùy chỉnh
          </Button>
          <Button size="sm" onClick={() => setOpen(true)} className="h-8 text-xs font-semibold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Thêm Lead mới
          </Button>
        </div>
      </div>

      {/* Leads List Table */}
      <Card className="border border-border/80 shadow-md">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/20 text-muted-foreground text-left">
                <th className="p-3 font-semibold">Họ tên</th>
                <th className="p-3 font-semibold">Thông tin liên hệ</th>
                <th className="p-3 font-semibold">Nguồn</th>
                
                {/* Dynamically render header columns for custom fields */}
                {customFields.map((f) => (
                  <th key={f.id} className="p-3 font-semibold">{f.field_label}</th>
                ))}

                <th className="p-3 font-semibold">Ghi chú</th>
                <th className="p-3 font-semibold">Trạng thái</th>
                <th className="p-3 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b hover:bg-secondary/15 transition-colors">
                  <td className="p-3 font-bold text-foreground">{lead.name}</td>
                  <td className="p-3 space-y-1">
                    {lead.phone && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Phone className="h-3 w-3 text-indigo-500" /> {lead.phone}
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Mail className="h-3 w-3 text-emerald-500" /> {lead.email}
                      </div>
                    )}
                    {!lead.phone && !lead.email && <span className="text-[10px] italic text-muted-foreground">Chưa có liên hệ</span>}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[9px] px-2 py-0 border-none font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {sourceLabels[lead.source] || lead.source}
                    </Badge>
                  </td>

                  {/* Dynamically render values for custom fields */}
                  {customFields.map((f) => {
                    const matchedVal = customFieldValues.find(
                      (v) => v.entity_id === lead.id && v.field_id === f.id
                    );
                    return (
                      <td key={f.id} className="p-3 font-semibold text-foreground">
                        {matchedVal ? matchedVal.value : "-"}
                      </td>
                    );
                  })}

                  <td className="p-3 max-w-[200px] truncate text-[11px] italic text-muted-foreground">
                    {lead.notes || "-"}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={`text-[9px] px-2 py-0 border-none font-bold rounded-full ${statusColors[lead.status]}`}>
                      {statusLabels[lead.status] || lead.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {lead.status !== "converted" && (
                        <>
                          <Select
                            value={lead.status}
                            onValueChange={(val) => updateLeadStatus.mutateAsync({ id: lead.id, status: val })}
                          >
                            <SelectTrigger className="h-7 w-28 text-[10px] bg-background">
                              <SelectValue placeholder="Đổi trạng thái" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover text-foreground text-[10px]">
                              <SelectItem value="new">Mới tạo</SelectItem>
                              <SelectItem value="contacting">Đang liên hệ</SelectItem>
                              <SelectItem value="unqualified">Không tiềm năng</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConvert(lead)}
                            className="h-7 text-[10px] font-semibold text-green-600 border-green-200 hover:bg-green-50 flex items-center gap-1"
                          >
                            <UserPlus className="h-3 w-3" /> Chuyển KH chính thức
                          </Button>
                        </>
                      )}
                      {lead.status === "converted" && (
                        <div className="text-[10px] text-green-700 font-bold flex items-center gap-1 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Đã thành khách hàng
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6 + customFields.length} className="p-8 text-center text-muted-foreground italic">
                    Chưa có khách hàng tiềm năng nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add Lead Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px] bg-background text-foreground text-xs max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <UserPlus className="h-4.5 w-4.5 text-indigo-500" /> Thêm Khách hàng tiềm năng mới
            </DialogTitle>
            <DialogDescription className="text-xs">
              Nhập các trường thông tin cơ bản để ghi nhận Lead mới vào cơ sở chăm sóc.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="leadName" className="font-semibold">Họ và tên *</Label>
              <Input
                id="leadName"
                className="h-8"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Nguyễn Văn A"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="leadPhone" className="font-semibold">Số điện thoại</Label>
                <Input
                  id="leadPhone"
                  className="h-8"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0912..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="leadEmail" className="font-semibold">Email</Label>
                <Input
                  id="leadEmail"
                  type="email"
                  className="h-8"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="mail@domain.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold">Nguồn Lead</Label>
              <Select
                value={formData.source}
                onValueChange={(val) => setFormData({ ...formData, source: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Chọn nguồn..." />
                </SelectTrigger>
                <SelectContent className="bg-popover text-foreground">
                  <SelectItem value="manual">Thủ công</SelectItem>
                  <SelectItem value="facebook">Facebook Messenger</SelectItem>
                  <SelectItem value="tiktok">TikTok Chat</SelectItem>
                  <SelectItem value="website">Website Form</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamically render Custom Fields Inputs */}
            {customFields.length > 0 && (
              <div className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/40 space-y-3">
                <div className="text-[10px] font-bold text-foreground">TRƯỜNG TÙY CHỈNH BỔ SUNG:</div>
                <div className="grid grid-cols-2 gap-3">
                  {customFields.map((f) => (
                    <div key={f.id} className="space-y-1">
                      <Label htmlFor={`custom-${f.id}`} className="font-semibold">{f.field_label}</Label>
                      <Input
                        id={`custom-${f.id}`}
                        type={f.field_type}
                        className="h-8 text-xs bg-background"
                        value={customFieldsData[f.id] || ""}
                        onChange={(e) => handleCustomFieldChange(f.id, e.target.value)}
                        placeholder={`Nhập ${f.field_label.toLowerCase()}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="leadNotes" className="font-semibold">Ghi chú nhu cầu</Label>
              <Textarea
                id="leadNotes"
                className="min-h-[80px] text-xs"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ví dụ: Cần mua sỉ 50 áo khoác gió trước ngày 15/7..."
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Thoát</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">
                Thêm Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Fields Management Dialog */}
      <CustomFieldsDialog
        open={openFieldsConfig}
        onOpenChange={setOpenFieldsConfig}
        customFields={customFields}
        createCustomField={createCustomField}
      />
    </div>
  );
}
