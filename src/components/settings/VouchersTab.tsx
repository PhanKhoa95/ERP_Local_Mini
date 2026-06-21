import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, Ticket } from "lucide-react";
import { useVouchers, type Voucher } from "@/hooks/useVouchers";
import { VoucherDialog } from "./VoucherDialog";
import { format } from "date-fns";

export function VouchersTab() {
  const { vouchers, isLoading, createVoucher, updateVoucher, deleteVoucher } = useVouchers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  const openDialog = (voucher?: Voucher) => {
    setEditingVoucher(voucher || null);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (editingVoucher) {
      await updateVoucher.mutateAsync(data);
    } else {
      await createVoucher.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa mã giảm giá này?")) {
      await deleteVoucher.mutateAsync(id);
    }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat("vi-VN").format(v) + "đ";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Mã giảm giá</CardTitle>
            <CardDescription>Quản lý voucher và khuyến mãi</CardDescription>
          </div>
          <Button onClick={() => openDialog()} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Thêm voucher
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vouchers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có mã giảm giá nào</p>
              </div>
            ) : (
              vouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-secondary/30 gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Ticket className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{voucher.code}</span>
                        <Badge variant={voucher.is_active ? "default" : "secondary"}>
                          {voucher.is_active ? "Hoạt động" : "Tắt"}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{voucher.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Giảm: {voucher.discount_type === "percentage" ? `${voucher.discount_value}%` : formatCurrency(voucher.discount_value)}
                        {voucher.min_order_value ? ` | Đơn tối thiểu: ${formatCurrency(voucher.min_order_value)}` : ""}
                        {voucher.usage_limit ? ` | Còn: ${voucher.usage_limit - voucher.used_count}/${voucher.usage_limit}` : ""}
                      </p>
                      {(voucher.start_date || voucher.end_date) && (
                        <p className="text-xs text-muted-foreground">
                          {voucher.start_date && `Từ: ${format(new Date(voucher.start_date), "dd/MM/yyyy")}`}
                          {voucher.end_date && ` - Đến: ${format(new Date(voucher.end_date), "dd/MM/yyyy")}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(voucher)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(voucher.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <VoucherDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        voucher={editingVoucher}
        onSubmit={handleSubmit}
        isLoading={createVoucher.isPending || updateVoucher.isPending}
      />
    </>
  );
}
