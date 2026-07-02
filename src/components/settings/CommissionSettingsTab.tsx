import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Save, FileText, Settings, Users, Percent, DollarSign, ListFilter } from "lucide-react";

interface CommissionSubConfig {
  id: string;
  name: string;
  staffType: string;
  type: "source" | "formula" | "order_val" | "category" | "wholesale_retail";
  calcMethod: "percent" | "fixed" | "tiers";
  value: string;
  tiers?: { threshold: string; reward: string }[];
}

interface CommissionConfig {
  id: string;
  name: string;
  applicableStaff: string[];
  subConfigs: CommissionSubConfig[];
  isActive: boolean;
}

export function CommissionSettingsTab() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<CommissionConfig[]>([
    {
      id: "com-1",
      name: "Hoa hồng bán lẻ Shopee",
      applicableStaff: ["Thăng Long", "Thùy Dương"],
      isActive: true,
      subConfigs: [
        {
          id: "sub-1",
          name: "Đơn Shopee tư vấn",
          staffType: "consultant",
          type: "source",
          calcMethod: "percent",
          value: "3",
        }
      ]
    },
    {
      id: "com-2",
      name: "Doanh số CTV & Đóng hàng",
      applicableStaff: ["Khoa 12 Tran", "Lê Hoà"],
      isActive: true,
      subConfigs: [
        {
          id: "sub-2",
          name: "Đóng gói theo đơn",
          staffType: "packer",
          type: "order_val",
          calcMethod: "fixed",
          value: "5.000",
        },
        {
          id: "sub-3",
          name: "Mức doanh thu tư vấn",
          staffType: "consultant",
          type: "wholesale_retail",
          calcMethod: "tiers",
          value: "",
          tiers: [
            { threshold: "10.000.000", reward: "2" },
            { threshold: "50.000.000", reward: "5" }
          ]
        }
      ]
    }
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CommissionConfig | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formStaff, setFormStaff] = useState<string[]>([]);
  const [subConfigs, setSubConfigs] = useState<CommissionSubConfig[]>([]);

  const handleOpenCreate = () => {
    setEditingConfig(null);
    setFormName("");
    setFormStaff([]);
    setSubConfigs([]);
    setDialogOpen(true);
  };

  const handleOpenEdit = (config: CommissionConfig) => {
    setEditingConfig(config);
    setFormName(config.name);
    setFormStaff(config.applicableStaff);
    setSubConfigs(config.subConfigs);
    setDialogOpen(true);
  };

  const handleDeleteConfig = (id: string) => {
    setConfigs(configs.filter(c => c.id !== id));
    toast({
      title: "Đã xoá cấu hình",
      description: "Cấu hình hoa hồng đã được xoá thành công."
    });
  };

  const handleAddSubConfig = () => {
    const newSub: CommissionSubConfig = {
      id: "new-sub-" + Date.now(),
      name: "Cấu hình con mới",
      staffType: "consultant",
      type: "order_val",
      calcMethod: "percent",
      value: "1",
      tiers: []
    };
    setSubConfigs([...subConfigs, newSub]);
  };

  const handleRemoveSubConfig = (id: string) => {
    setSubConfigs(subConfigs.filter(s => s.id !== id));
  };

  const handleAddTier = (subId: string) => {
    setSubConfigs(subConfigs.map(s => {
      if (s.id === subId) {
        const currentTiers = s.tiers || [];
        return {
          ...s,
          tiers: [...currentTiers, { threshold: "0", reward: "0" }]
        };
      }
      return s;
    }));
  };

  const handleRemoveTier = (subId: string, index: number) => {
    setSubConfigs(subConfigs.map(s => {
      if (s.id === subId && s.tiers) {
        return {
          ...s,
          tiers: s.tiers.filter((_, i) => i !== index)
        };
      }
      return s;
    }));
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast({ variant: "destructive", title: "Lỗi", description: "Tên cấu hình không được để trống" });
      return;
    }

    if (editingConfig) {
      setConfigs(configs.map(c => c.id === editingConfig.id ? { ...c, name: formName, applicableStaff: formStaff, subConfigs } : c));
      toast({ title: "Cập nhật thành công", description: "Đã lưu thay đổi cấu hình hoa hồng." });
    } else {
      const newConfig: CommissionConfig = {
        id: "com-" + Date.now(),
        name: formName,
        applicableStaff: formStaff,
        isActive: true,
        subConfigs
      };
      setConfigs([...configs, newConfig]);
      toast({ title: "Tạo mới thành công", description: "Cấu hình hoa hồng mới đã được tạo." });
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b mb-4 space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Cấu hình hoa hồng nhân viên</CardTitle>
            <CardDescription className="text-xs">Thiết lập hoa hồng doanh thu theo nguồn, giá trị đơn, sản phẩm hoặc công thức cho nhân viên sales/telesales/đóng gói.</CardDescription>
          </div>
          <Button onClick={handleOpenCreate} size="sm" className="h-8 gap-1.5 cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            Tạo mới
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Kích hoạt</TableHead>
                  <TableHead className="text-xs">Tên cấu hình hoa hồng</TableHead>
                  <TableHead className="text-xs">Nhân viên áp dụng</TableHead>
                  <TableHead className="text-xs">Số cấu hình con</TableHead>
                  <TableHead className="text-xs text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell className="py-2.5">
                      <Switch
                        checked={c.isActive}
                        onCheckedChange={(checked) => setConfigs(configs.map(x => x.id === c.id ? { ...x, isActive: checked } : x))}
                        className="scale-75 origin-left"
                      />
                    </TableCell>
                    <TableCell className="py-2.5 font-medium text-xs">{c.name}</TableCell>
                    <TableCell className="py-2.5 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {c.applicableStaff.map(s => (
                          <Badge key={s} variant="outline" className="text-[10px] bg-secondary/50">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-xs font-semibold">{c.subConfigs.length} cấu hình</TableCell>
                    <TableCell className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => handleOpenEdit(c)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/5 cursor-pointer" onClick={() => handleDeleteConfig(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* dialog for create/edit commission config */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editingConfig ? "Cập nhật cấu hình hoa hồng" : "Tạo mới cấu hình hoa hồng"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập tên cấu hình, nhân viên áp dụng và thêm các cấu hình hoa hồng con.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="c-name" className="text-xs">Tên cấu hình cha *</Label>
                <Input
                  id="c-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Cấu hình hoa hồng Sales Online"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Chọn nhân viên áp dụng</Label>
                <div className="border rounded-md p-1.5 flex flex-wrap gap-1 bg-muted/10 min-h-[38px] items-center">
                  {["Thăng Long", "Khoa 12 Tran", "Thùy Dương", "Lê Hoà"].map(staff => {
                    const isSelected = formStaff.includes(staff);
                    return (
                      <Badge
                        key={staff}
                        variant={isSelected ? "default" : "outline"}
                        className="text-[10px] cursor-pointer px-2 py-0.5"
                        onClick={() => {
                          if (isSelected) {
                            setFormStaff(formStaff.filter(s => s !== staff));
                          } else {
                            setFormStaff([...formStaff, staff]);
                          }
                        }}
                      >
                        {staff}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground">Danh sách cấu hình hoa hồng con</h4>
                <Button variant="outline" size="sm" onClick={handleAddSubConfig} className="h-7 text-xs gap-1 cursor-pointer">
                  <Plus className="h-3 w-3" /> Thêm cấu hình con
                </Button>
              </div>

              {subConfigs.map((sub, sIdx) => (
                <div key={sub.id} className="border rounded-lg p-4 bg-muted/5 relative space-y-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/5 cursor-pointer"
                    onClick={() => handleRemoveSubConfig(sub.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Tên cấu hình con</Label>
                      <Input
                        value={sub.name}
                        onChange={(e) => setSubConfigs(subConfigs.map(x => x.id === sub.id ? { ...x, name: e.target.value } : x))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Dạng nhân viên</Label>
                      <Select
                        value={sub.staffType}
                        onValueChange={(val) => setSubConfigs(subConfigs.map(x => x.id === sub.id ? { ...x, staffType: val } : x))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectTrigger className="hidden" />
                        <SelectContent className="z-[100] bg-popover text-foreground">
                          <SelectItem value="consultant" className="text-xs">Nhân viên tư vấn (Sales)</SelectItem>
                          <SelectItem value="packer" className="text-xs">Nhân viên đóng gói</SelectItem>
                          <SelectItem value="shipper" className="text-xs">Nhân viên giao hàng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Dạng tính hoa hồng</Label>
                      <Select
                        value={sub.type}
                        onValueChange={(val: any) => setSubConfigs(subConfigs.map(x => x.id === sub.id ? { ...x, type: val } : x))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectTrigger className="hidden" />
                        <SelectContent className="z-[100] bg-popover text-foreground">
                          <SelectItem value="source" className="text-xs">Theo nguồn đơn</SelectItem>
                          <SelectItem value="formula" className="text-xs">Theo công thức</SelectItem>
                          <SelectItem value="order_val" className="text-xs">Theo giá trị đơn</SelectItem>
                          <SelectItem value="category" className="text-xs">Theo danh mục sản phẩm</SelectItem>
                          <SelectItem value="wholesale_retail" className="text-xs">Theo bán sỉ/lẻ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Cách tính</Label>
                      <Select
                        value={sub.calcMethod}
                        onValueChange={(val: any) => setSubConfigs(subConfigs.map(x => x.id === sub.id ? { ...x, calcMethod: val } : x))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectTrigger className="hidden" />
                        <SelectContent className="z-[100] bg-popover text-foreground">
                          <SelectItem value="percent" className="text-xs">Theo phần trăm (%)</SelectItem>
                          <SelectItem value="fixed" className="text-xs">Giá trị VNĐ</SelectItem>
                          <SelectItem value="tiers" className="text-xs">Tính theo mức</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {sub.calcMethod !== "tiers" ? (
                    <div className="flex items-center gap-2 max-w-xs">
                      <Label className="text-xs">Giá trị:</Label>
                      <Input
                        value={sub.value}
                        onChange={(e) => setSubConfigs(subConfigs.map(x => x.id === sub.id ? { ...x, value: e.target.value } : x))}
                        className="h-8 text-xs w-28 text-center"
                      />
                      <span className="text-xs text-muted-foreground">{sub.calcMethod === "percent" ? "%" : "đ"}</span>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-dashed">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Các mức hoa hồng:</Label>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary cursor-pointer" onClick={() => handleAddTier(sub.id)}>
                          + Thêm mức
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {(sub.tiers || []).map((t, tIdx) => (
                          <div key={tIdx} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Đạt mốc:</span>
                            <Input
                              value={t.threshold}
                              onChange={(e) => {
                                const newTiers = [...(sub.tiers || [])];
                                newTiers[tIdx].threshold = e.target.value;
                                setSubConfigs(subConfigs.map(x => x.id === sub.id ? { ...x, tiers: newTiers } : x));
                              }}
                              className="h-8 text-xs w-28 text-center"
                              placeholder="Doanh số đạt"
                            />
                            <span className="text-xs text-muted-foreground">đ → Hưởng:</span>
                            <Input
                              value={t.reward}
                              onChange={(e) => {
                                const newTiers = [...(sub.tiers || [])];
                                newTiers[tIdx].reward = e.target.value;
                                setSubConfigs(subConfigs.map(x => x.id === sub.id ? { ...x, tiers: newTiers } : x));
                              }}
                              className="h-8 text-xs w-16 text-center"
                              placeholder="Thưởng"
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive cursor-pointer"
                              onClick={() => handleRemoveTier(sub.id, tIdx)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="h-8 text-xs cursor-pointer">
              Hủy
            </Button>
            <Button size="sm" onClick={handleSave} className="h-8 text-xs cursor-pointer bg-blue-600 hover:bg-blue-700">
              <Save className="h-3.5 w-3.5 mr-1" />
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
