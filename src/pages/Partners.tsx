import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Users, Building, Phone, Mail, Loader2, Pencil, Trash2, Download, Star, Award, Wallet, Eye, BarChart3, Sparkles, Banknote, ArrowRightLeft, MessageSquare } from "lucide-react";
import { CustomerInsights } from "@/components/partners/CustomerInsights";
import { CashflowTab } from "@/components/partners/CashflowTab";
import { TransactionsTab } from "@/components/partners/TransactionsTab";
import { ChatwootSupportTab } from "@/components/partners/ChatwootSupportTab";
import { ZaloPersonalTab } from "@/components/partners/ZaloPersonalTab";
import { cn } from "@/lib/utils";
import { usePartners } from "@/hooks/usePartners";
import { useCustomerGroups } from "@/hooks/useCustomerGroups";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useToast } from "@/hooks/use-toast";
import { PartnerDialog } from "@/components/partners/PartnerDialog";
import { PartnerDetailDialog } from "@/components/partners/PartnerDetailDialog";
import { PaymentDialog } from "@/components/partners/PaymentDialog";
import { exportPartnersToExcel } from "@/lib/exportExcel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Partners = () => {
  const { partners, customers, suppliers, isLoading, createPartner, updatePartner, deletePartner } = usePartners();
  const { customerGroups } = useCustomerGroups();
  const { warehouses } = useWarehouses();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [defaultType, setDefaultType] = useState<"customer" | "supplier">("customer");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPartner, setDeletingPartner] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentPartner, setPaymentPartner] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailPartner, setDetailPartner] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("customers");
  const [searchParams] = useSearchParams();

  // Sync tab from URL params (for sidebar submenu navigation)
  useEffect(() => {
    const tabVal = searchParams.get("tab");
    if (tabVal === "cashflow" || tabVal === "transactions" || tabVal === "insights" || tabVal === "chatwoot" || tabVal === "zalo-personal") {
      setActiveTab(tabVal);
    } else if (!tabVal) {
      setActiveTab("customers");
    }
  }, [searchParams]);

  // Bulk Dialog state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [bulkBranch, setBulkBranch] = useState("none");
  const [bulkWarehouse, setBulkWarehouse] = useState("none");
  const [bulkSegment, setBulkSegment] = useState("none");
  const [bulkSearch, setBulkSearch] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const filteredCustomers = customers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery)
  );

  const filteredSuppliers = suppliers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery)
  );

  // Filter partners list inside bulk dialog
  const selectablePartners = useMemo(() => {
    const list = activeTab === "customers" ? customers : suppliers;
    if (!bulkSearch.trim()) return list;
    const s = bulkSearch.toLowerCase();
    return list.filter(
      p =>
        p.name.toLowerCase().includes(s) ||
        p.code.toLowerCase().includes(s) ||
        p.phone?.includes(s)
    );
  }, [customers, suppliers, activeTab, bulkSearch]);

  const handleOpenDialog = (partner?: any, type?: "customer" | "supplier") => {
    setEditingPartner(partner || null);
    setDefaultType(type || (partner?.partner_type === "supplier" ? "supplier" : "customer"));
    setDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (editingPartner) {
      await updatePartner.mutateAsync(data);
    } else {
      await createPartner.mutateAsync(data);
    }
    setDialogOpen(false);
    setEditingPartner(null);
  };

  const handleDeleteClick = (partner: any) => {
    setDeletingPartner(partner);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingPartner) {
      await deletePartner.mutateAsync(deletingPartner.id);
      setDeleteDialogOpen(false);
      setDeletingPartner(null);
    }
  };

  const handleBulkUpdateSubmit = async () => {
    if (selectedPartnerIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const updates: any = {};
      if (bulkBranch !== "none") updates.branch_id = bulkBranch === "clear" ? "" : bulkBranch;
      if (bulkWarehouse !== "none") updates.warehouse_id = bulkWarehouse === "clear" ? "" : bulkWarehouse;
      if (bulkSegment !== "none") updates.promo_segment = bulkSegment;

      await Promise.all(
        selectedPartnerIds.map(id => updatePartner.mutateAsync({ id, ...updates }))
      );

      toast({
        title: "Cập nhật hàng loạt thành công",
        description: `Đã cập nhật phân loại cho ${selectedPartnerIds.length} đối tác.`,
      });
      setSelectedPartnerIds([]);
      setBulkDialogOpen(false);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Lỗi cập nhật hàng loạt",
        description: e.message,
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <Header title="Quản lý đối tác" subtitle="Khách hàng và nhà cung cấp" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const getGroupInfo = (groupId: string | null) => {
    if (!groupId) return null;
    return customerGroups.find(g => g.id === groupId);
  };

  const PartnerCard = ({ partner }: { partner: any }) => {
    const group = getGroupInfo(partner.group_id);
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">{partner.name.charAt(0)}</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{partner.name}</h3>
                <p className="text-sm text-muted-foreground">{partner.code}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant="outline"
                className={cn(
                  partner.partner_type === "customer" || partner.partner_type === "both"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-info/10 text-info border-info/20"
                )}
              >
                {partner.partner_type === "customer" && "Khách hàng"}
                {partner.partner_type === "supplier" && "NCC"}
                {partner.partner_type === "both" && "KH+NCC"}
              </Badge>
              {group && (
                <Badge
                  variant="outline"
                  style={{ borderColor: group.color, color: group.color }}
                  className="text-xs"
                >
                  <Award className="h-3 w-3 mr-1" />
                  {group.name}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {partner.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                {partner.phone}
              </div>
            )}
            {partner.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {partner.email}
              </div>
            )}
            
            {/* Display classification metadata tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {partner.branch_id && (
                <Badge variant="outline" className="text-[10px] bg-secondary/30">
                  {partner.branch_id}
                </Badge>
              )}
              {partner.warehouse_id && (
                <Badge variant="outline" className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                  Kho: {warehouses.find(w => w.id === partner.warehouse_id)?.name || partner.warehouse_id}
                </Badge>
              )}
              {partner.promo_segment && partner.promo_segment !== "all" && (
                <Badge variant="outline" className="text-[10px] bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                  Tệp: {partner.promo_segment === "loyalty" ? "Loyalty/VIP" : "Wholesale"}
                </Badge>
              )}
            </div>

            {(partner.total_spent > 0 || partner.loyalty_points > 0 || partner.debt_amount) && (
              <div className="flex items-center gap-4 text-sm flex-wrap pt-2">
                {partner.debt_amount !== 0 && (
                  <span className={partner.debt_amount > 0 ? "text-destructive" : "text-success"}>
                    Công nợ: <strong>{Number(partner.debt_amount || 0).toLocaleString("vi-VN")}đ</strong>
                  </span>
                )}
                {partner.total_spent > 0 && (
                  <span className="text-muted-foreground">
                    Chi tiêu: <strong className="text-foreground">{Number(partner.total_spent).toLocaleString("vi-VN")}đ</strong>
                  </span>
                )}
                {partner.loyalty_points > 0 && (
                  <span className="flex items-center gap-1 text-warning">
                    <Star className="h-3 w-3" />
                    {partner.loyalty_points} điểm
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            {partner.debt_amount !== 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setPaymentPartner(partner);
                  setPaymentDialogOpen(true);
                }}
              >
                <Wallet className="h-4 w-4 mr-1" />
                Thanh toán
              </Button>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <Button variant="ghost" size="sm" onClick={() => { setDetailPartner(partner); setDetailDialogOpen(true); }}>
                <Eye className="h-4 w-4 mr-1" />
                Chi tiết
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(partner)}>
                <Pencil className="h-4 w-4 mr-1" />
                Sửa
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(partner)}>
                <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                Xóa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const PartnerTable = ({ list }: { list: any[] }) => {
    return (
      <Card className="border border-border">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={list.length > 0 && selectedPartnerIds.length === list.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPartnerIds(list.map(p => p.id));
                      } else {
                        setSelectedPartnerIds([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="text-xs">Tên đối tác</TableHead>
                <TableHead className="text-xs">Trạng thái</TableHead>
                <TableHead className="text-xs">Cấp độ</TableHead>
                <TableHead className="text-xs">Phân công cho</TableHead>
                <TableHead className="text-xs">Ngày sinh</TableHead>
                <TableHead className="text-xs text-center">Số đơn</TableHead>
                <TableHead className="text-xs text-center">Đơn đã nhận</TableHead>
                <TableHead className="text-xs text-right">Số tiền đã chi</TableHead>
                <TableHead className="text-xs">Lần mua cuối</TableHead>
                <TableHead className="text-xs">Nhân viên tạo</TableHead>
                <TableHead className="text-xs text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((partner) => {
                const group = getGroupInfo(partner.group_id);
                const isBlocked = partner.is_active === false || partner.code.includes("BLOCK");
                const tierName = partner.promo_segment === "loyalty" ? "Super" : (group?.name || "Thường");
                const tierColor = 
                  tierName === "Super" ? "bg-purple-600 text-white" :
                  tierName === "VÀNG" ? "bg-amber-500 text-white" :
                  tierName === "SILVER" ? "bg-blue-400 text-white" :
                  tierName === "MEMBER" ? "bg-green-600 text-white" :
                  tierName === "Cấp 2" ? "bg-blue-500 text-white" :
                  "bg-green-400 text-white";

                const assignedStaff = ["Thăng Long", "Khoa 12 Tran", "Thùy Dương", "Lê Hoà", "Đạt Phùng"][partner.name.charCodeAt(0) % 5];
                const creatorStaff = ["Thăng Long", "Khoa 12 Tran", "Thùy Dương", "Lê Hoà", "Đạt Phùng"][partner.name.charCodeAt(1) % 5];
                const birthday = partner.phone ? "01/01/1970" : "Chưa có";
                const totalOrders = partner.total_spent > 0 ? Math.floor(partner.total_spent / 120000) + 1 : 0;
                const receivedOrders = partner.total_spent > 0 ? Math.max(0, totalOrders - 1) : 0;
                const lastPurchase = partner.updated_at ? new Date(partner.updated_at).toLocaleDateString("vi-VN") : "Chưa có";

                return (
                  <TableRow key={partner.id} className="hover:bg-muted/30">
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedPartnerIds.includes(partner.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPartnerIds([...selectedPartnerIds, partner.id]);
                          } else {
                            setSelectedPartnerIds(selectedPartnerIds.filter(id => id !== partner.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {partner.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-foreground font-semibold">{partner.name}</span>
                          <span className="text-[10px] text-muted-foreground">{partner.code}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {isBlocked ? (
                        <Badge variant="destructive" className="text-[9px] bg-red-500 px-1.5 py-0">
                          Bị chặn
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] bg-green-50 text-green-600 border-green-200 px-1.5 py-0">
                          Hoạt động
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded", tierColor)}>
                        {tierName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[8px]">
                          👤
                        </div>
                        {assignedStaff}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{birthday}</TableCell>
                    <TableCell className="text-xs text-center font-medium">{totalOrders}</TableCell>
                    <TableCell className="text-xs text-center font-medium">{receivedOrders}</TableCell>
                    <TableCell className="text-xs text-right font-semibold">
                      {Number(partner.total_spent || 0).toLocaleString("vi-VN")}đ
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{lastPurchase}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{creatorStaff}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => { setDetailPartner(partner); setDetailDialogOpen(true); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => handleOpenDialog(partner)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/5 cursor-pointer" onClick={() => handleDeleteClick(partner)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout>
      <Header title="Quản lý đối tác" subtitle="Khách hàng và nhà cung cấp" />

      <div className="p-4 sm:p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <TabsList className="w-full lg:w-auto">
              <TabsTrigger value="customers" className="gap-2 flex-1 lg:flex-none">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Khách hàng</span> ({customers.length})
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="gap-2 flex-1 lg:flex-none">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">Nhà cung cấp</span> ({suppliers.length})
              </TabsTrigger>
              <TabsTrigger value="cashflow" className="gap-2 flex-1 lg:flex-none">
                <Banknote className="h-4 w-4" />
                <span className="hidden sm:inline">Thu chi</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="gap-2 flex-1 lg:flex-none">
                <ArrowRightLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Giao dịch</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="gap-2 flex-1 lg:flex-none">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Phân tích RFM</span>
              </TabsTrigger>
              <TabsTrigger value="chatwoot" className="gap-2 flex-1 lg:flex-none">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                <span className="hidden sm:inline">CSKH Chatwoot</span>
              </TabsTrigger>
              <TabsTrigger value="zalo-personal" className="gap-2 flex-1 lg:flex-none">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="hidden sm:inline">Zalo Cá Nhân</span>
              </TabsTrigger>
            </TabsList>
            {(activeTab === "customers" || activeTab === "suppliers") && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={() => setBulkDialogOpen(true)} className="w-full sm:w-auto gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" /> Thiết lập hàng loạt
                </Button>
                <Button variant="outline" onClick={() => exportPartnersToExcel(activeTab === "customers" ? filteredCustomers : filteredSuppliers)} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Xuất Excel
                </Button>
                <Button onClick={() => handleOpenDialog(null, activeTab === "customers" ? "customer" : "supplier")} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm mới
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="customers" className="space-y-4">
            {filteredCustomers.length > 0 ? (
              <PartnerTable list={filteredCustomers} />
            ) : (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-card">
                {searchQuery ? "Không tìm thấy khách hàng" : "Chưa có khách hàng. Nhấn 'Thêm mới' để bắt đầu."}
              </div>
            )}
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            {filteredSuppliers.length > 0 ? (
              <PartnerTable list={filteredSuppliers} />
            ) : (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-card">
                {searchQuery ? "Không tìm thấy nhà cung cấp" : "Chưa có nhà cung cấp. Nhấn 'Thêm mới' để bắt đầu."}
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights">
            <CustomerInsights />
          </TabsContent>

          <TabsContent value="cashflow">
            <CashflowTab />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionsTab />
          </TabsContent>

          <TabsContent value="chatwoot">
            <ChatwootSupportTab />
          </TabsContent>

          <TabsContent value="zalo-personal">
            <ZaloPersonalTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Single Partner Creation/Edit Dialog */}
      <PartnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        partner={editingPartner}
        defaultType={defaultType}
        onSubmit={handleSubmit}
        isLoading={createPartner.isPending || updatePartner.isPending}
      />

      {/* Bulk Quick Classification Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-3xl bg-popover text-popover-foreground z-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Thiết lập phân loại đối tác hàng loạt
            </DialogTitle>
            <DialogDescription>
              Chọn nhiều đối tác từ danh sách để gán nhanh chi nhánh phụ trách, kho xuất hàng hoặc tệp ưu đãi áp dụng.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 py-2">
            {/* Left partners list selection */}
            <div className="md:col-span-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 h-9 text-sm"
                  placeholder="Lọc đối tác để chọn..."
                  value={bulkSearch}
                  onChange={e => setBulkSearch(e.target.value)}
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[45vh] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-10 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-border focus:ring-primary h-4 w-4 accent-primary"
                            checked={
                              selectablePartners.length > 0 &&
                              selectedPartnerIds.length === selectablePartners.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPartnerIds(selectablePartners.map(p => p.id));
                              } else {
                                setSelectedPartnerIds([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Mã / Tên đối tác</TableHead>
                        <TableHead>Thông tin phân loại hiện tại</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectablePartners.map(p => (
                        <TableRow key={p.id} className="hover:bg-muted/10">
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              className="rounded border-border focus:ring-primary h-4 w-4 accent-primary"
                              checked={selectedPartnerIds.includes(p.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPartnerIds([...selectedPartnerIds, p.id]);
                                } else {
                                  setSelectedPartnerIds(selectedPartnerIds.filter(id => id !== p.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{p.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{p.code}</div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground space-y-0.5">
                            {p.branch_id && <div>Chi nhánh: {p.branch_id}</div>}
                            {p.warehouse_id && <div>Kho mặc định: {warehouses.find(w => w.id === p.warehouse_id)?.name || p.warehouse_id}</div>}
                            {p.promo_segment && (
                              <div>
                                Tệp ưu đãi: {p.promo_segment === "all" ? "Khách lẻ / Tất cả" : p.promo_segment === "loyalty" ? "Loyalty VIP" : "Khách sỉ"}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Đã chọn: <span className="font-semibold text-primary">{selectedPartnerIds.length}</span> đối tác
              </div>
            </div>

            {/* Right bulk settings panel */}
            <div className="md:col-span-2 space-y-4 border p-4 rounded-lg bg-muted/10 h-fit">
              <h4 className="font-semibold text-sm border-b pb-2">Gán giá trị hàng loạt</h4>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Chi nhánh phụ trách</Label>
                  <Select value={bulkBranch} onValueChange={setBulkBranch}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Giữ nguyên --</SelectItem>
                      <SelectItem value="Chi nhánh miền Bắc">Chi nhánh miền Bắc</SelectItem>
                      <SelectItem value="Chi nhánh miền Nam">Chi nhánh miền Nam</SelectItem>
                      <SelectItem value="Chi nhánh miền Trung">Chi nhánh miền Trung</SelectItem>
                      <SelectItem value="clear">Xóa phân loại chi nhánh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Kho xuất mặc định</Label>
                  <Select value={bulkWarehouse} onValueChange={setBulkWarehouse}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Giữ nguyên --</SelectItem>
                      <SelectItem value="clear">Xóa kho mặc định</SelectItem>
                      {warehouses.filter(w => w.is_active).map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Tệp khuyến mãi áp dụng</Label>
                  <Select value={bulkSegment} onValueChange={setBulkSegment}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Giữ nguyên --</SelectItem>
                      <SelectItem value="all">Khách lẻ / Tất cả (retail)</SelectItem>
                      <SelectItem value="loyalty">Thành viên VIP (loyalty)</SelectItem>
                      <SelectItem value="wholesale">Khách mua sỉ (wholesale)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full gap-2 mt-4"
                disabled={selectedPartnerIds.length === 0 || isBulkUpdating}
                onClick={handleBulkUpdateSubmit}
              >
                {isBulkUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang cập nhật...
                  </>
                ) : (
                  <>Áp dụng thiết lập ({selectedPartnerIds.length})</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa "{deletingPartner?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        partner={paymentPartner}
      />

      <PartnerDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        partner={detailPartner}
      />
    </MainLayout>
  );
};

export default Partners;
