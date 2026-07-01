import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePartnerDetail } from "@/hooks/usePartnerDetail";
import { useWarehouses } from "@/hooks/useWarehouses";
import {
  User, ShoppingCart, CreditCard, Package, MessageSquare,
  Plus, Phone, Mail, MapPin, Star, Loader2, Check, Clock,
  Trash2, Calendar, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: any;
}

const NOTE_TYPES = [
  { value: "general", label: "Chung", color: "bg-muted text-muted-foreground" },
  { value: "call", label: "Gọi điện", color: "bg-primary/10 text-primary" },
  { value: "email", label: "Email", color: "bg-info/10 text-info" },
  { value: "meeting", label: "Gặp mặt", color: "bg-success/10 text-success" },
  { value: "complaint", label: "Khiếu nại", color: "bg-destructive/10 text-destructive" },
  { value: "follow_up", label: "Theo dõi", color: "bg-warning/10 text-warning" },
];

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chờ xử lý", variant: "secondary" },
  confirmed: { label: "Đã xác nhận", variant: "default" },
  shipping: { label: "Đang giao", variant: "outline" },
  delivered: { label: "Đã giao", variant: "default" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

export function PartnerDetailDialog({ open, onOpenChange, partner }: Props) {
  const { warehouses } = useWarehouses();
  const { orders, transactions, topProducts, notes, stats, isLoading, createNote, updateNote, deleteNote } = usePartnerDetail(partner?.id || null);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [followUpDate, setFollowUpDate] = useState("");

  if (!partner) return null;

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    await createNote.mutateAsync({
      partner_id: partner.id,
      note_type: noteType,
      content: noteContent.trim(),
      follow_up_date: followUpDate || null,
    });
    setNoteContent("");
    setNoteType("general");
    setFollowUpDate("");
  };

  const fmtMoney = (v: number) => Number(v || 0).toLocaleString("vi-VN") + "đ";
  const fmtDate = (d: string) => { try { return format(new Date(d), "dd/MM/yyyy"); } catch { return d; } };
  const fmtDateTime = (d: string) => { try { return format(new Date(d), "dd/MM/yyyy HH:mm"); } catch { return d; } };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">{partner.name.charAt(0)}</span>
            </div>
            <div>
              <div>{partner.name}</div>
              <div className="text-sm font-normal text-muted-foreground">{partner.code}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="overview" className="gap-1 text-xs sm:text-sm"><User className="h-4 w-4" /><span className="hidden sm:inline">Tổng quan</span></TabsTrigger>
              <TabsTrigger value="orders" className="gap-1 text-xs sm:text-sm"><ShoppingCart className="h-4 w-4" /><span className="hidden sm:inline">Đơn hàng</span></TabsTrigger>
              <TabsTrigger value="payments" className="gap-1 text-xs sm:text-sm"><CreditCard className="h-4 w-4" /><span className="hidden sm:inline">Thanh toán</span></TabsTrigger>
              <TabsTrigger value="products" className="gap-1 text-xs sm:text-sm"><Package className="h-4 w-4" /><span className="hidden sm:inline">Sản phẩm</span></TabsTrigger>
              <TabsTrigger value="notes" className="gap-1 text-xs sm:text-sm"><MessageSquare className="h-4 w-4" /><span className="hidden sm:inline">CSKH</span></TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card><CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{stats.totalOrders}</div>
                  <div className="text-xs text-muted-foreground">Tổng đơn hàng</div>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{fmtMoney(partner.total_spent || 0)}</div>
                  <div className="text-xs text-muted-foreground">Tổng chi tiêu</div>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <div className={cn("text-2xl font-bold", (partner.debt_amount || 0) > 0 ? "text-destructive" : "text-success")}>{fmtMoney(partner.debt_amount || 0)}</div>
                  <div className="text-xs text-muted-foreground">Công nợ</div>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-warning flex items-center justify-center gap-1"><Star className="h-5 w-5" />{partner.loyalty_points || 0}</div>
                  <div className="text-xs text-muted-foreground">Điểm tích lũy</div>
                </CardContent></Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-sm">Thông tin liên hệ</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {partner.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{partner.phone}</div>}
                  {partner.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{partner.email}</div>}
                  {partner.address && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" />{partner.address}</div>}
                  {partner.tax_id && <div className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-muted-foreground" />MST: {partner.tax_id}</div>}
                  {partner.branch_id && <div className="flex items-center gap-2 text-sm"><strong>Chi nhánh:</strong> {partner.branch_id}</div>}
                  {partner.warehouse_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <strong>Kho mặc định:</strong> {warehouses.find(w => w.id === partner.warehouse_id)?.name || partner.warehouse_id}
                    </div>
                  )}
                  {partner.promo_segment && (
                    <div className="flex items-center gap-2 text-sm flex-wrap items-center gap-1">
                      <strong>Tệp ưu đãi:</strong>
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {partner.promo_segment === "all" ? "Khách lẻ / Tất cả (retail)" : partner.promo_segment === "loyalty" ? "Thành viên VIP (loyalty)" : "Khách mua sỉ (wholesale)"}
                      </Badge>
                    </div>
                  )}
                  {partner.notes && <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">{partner.notes}</div>}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Chưa có đơn hàng nào</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                      <TableHead>Thanh toán</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.order_number}</TableCell>
                        <TableCell>{fmtDate(o.order_date)}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_MAP[o.status]?.variant || "secondary"}>
                            {STATUS_MAP[o.status]?.label || o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmtMoney(o.total || 0)}</TableCell>
                        <TableCell>
                          <Badge variant={o.payment_status === "paid" ? "default" : "outline"}>
                            {o.payment_status === "paid" ? "Đã TT" : o.payment_status === "partial" ? "TT một phần" : "Chưa TT"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Chưa có giao dịch thanh toán</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead>Phương thức</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{fmtDate(t.transaction_date)}</TableCell>
                        <TableCell>
                          <Badge variant={t.transaction_type.includes("payment") ? "default" : "outline"}>
                            {t.transaction_type === "payment_in" ? "Thu" : t.transaction_type === "payment_out" ? "Chi" : t.transaction_type === "receivable" ? "Phải thu" : "Phải trả"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmtMoney(t.amount)}</TableCell>
                        <TableCell>{t.payment_method || "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{t.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              {topProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Chưa có dữ liệu sản phẩm</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="text-right">Số lần mua</TableHead>
                      <TableHead className="text-right">Tổng SL</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.product?.name || "N/A"}</TableCell>
                        <TableCell className="text-right">{p.orderCount}</TableCell>
                        <TableCell className="text-right">{p.totalQty}</TableCell>
                        <TableCell className="text-right font-medium">{fmtMoney(p.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Select value={noteType} onValueChange={setNoteType}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NOTE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-[160px]" placeholder="Follow-up" />
                  </div>
                  <Textarea placeholder="Nội dung ghi chú..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={2} />
                  <Button onClick={handleAddNote} disabled={!noteContent.trim() || createNote.isPending} size="sm">
                    <Plus className="h-4 w-4 mr-1" />Thêm ghi chú
                  </Button>
                </CardContent>
              </Card>

              {notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Chưa có ghi chú CSKH</div>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => {
                    const typeInfo = NOTE_TYPES.find((t) => t.value === note.note_type) || NOTE_TYPES[0];
                    return (
                      <Card key={note.id} className={cn(note.is_resolved && "opacity-60")}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={typeInfo.color}>{typeInfo.label}</Badge>
                                <span className="text-xs text-muted-foreground">{fmtDateTime(note.created_at)}</span>
                                {note.follow_up_date && (
                                  <span className="text-xs flex items-center gap-1 text-warning"><Calendar className="h-3 w-3" />{fmtDate(note.follow_up_date)}</span>
                                )}
                              </div>
                              <p className="text-sm">{note.content}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => updateNote.mutate({ id: note.id, is_resolved: !note.is_resolved })}>
                                {note.is_resolved ? <Clock className="h-4 w-4" /> : <Check className="h-4 w-4 text-success" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteNote.mutate(note.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
