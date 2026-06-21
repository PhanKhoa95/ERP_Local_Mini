import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users, Building, Phone, Mail, Loader2, Pencil, Trash2, Download, Star, Award, Wallet, Eye, BarChart3 } from "lucide-react";
import { CustomerInsights } from "@/components/partners/CustomerInsights";
import { cn } from "@/lib/utils";
import { usePartners } from "@/hooks/usePartners";
import { useCustomerGroups } from "@/hooks/useCustomerGroups";
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
            {(partner.total_spent > 0 || partner.loyalty_points > 0 || partner.debt_amount) && (
              <div className="flex items-center gap-4 text-sm flex-wrap">
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
              <TabsTrigger value="insights" className="gap-2 flex-1 lg:flex-none">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Phân tích RFM</span>
              </TabsTrigger>
            </TabsList>
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
              <Button variant="outline" onClick={() => exportPartnersToExcel(activeTab === "customers" ? filteredCustomers : filteredSuppliers)} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
              <Button onClick={() => handleOpenDialog(null, activeTab === "customers" ? "customer" : "supplier")} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Thêm mới
              </Button>
            </div>
          </div>

          <TabsContent value="customers">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => (
                <PartnerCard key={customer.id} partner={customer} />
              ))}
              {filteredCustomers.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  {searchQuery ? "Không tìm thấy khách hàng" : "Chưa có khách hàng. Nhấn 'Thêm mới' để bắt đầu."}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="suppliers">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((supplier) => (
                <PartnerCard key={supplier.id} partner={supplier} />
              ))}
              {filteredSuppliers.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  {searchQuery ? "Không tìm thấy nhà cung cấp" : "Chưa có nhà cung cấp. Nhấn 'Thêm mới' để bắt đầu."}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <CustomerInsights />
          </TabsContent>
        </Tabs>
      </div>

      <PartnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        partner={editingPartner}
        defaultType={defaultType}
        onSubmit={handleSubmit}
        isLoading={createPartner.isPending || updatePartner.isPending}
      />

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
