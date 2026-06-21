import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuotations } from "@/hooks/useQuotations";
import { useProducts } from "@/hooks/useProducts";
import { usePartners } from "@/hooks/usePartners";
import { Plus, FileText, ArrowRight, Trash2, Send, Check, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Nháp", color: "bg-muted text-muted-foreground" },
  sent: { label: "Đã gửi", color: "bg-info/10 text-info" },
  accepted: { label: "Chấp nhận", color: "bg-success/10 text-success" },
  rejected: { label: "Từ chối", color: "bg-destructive/10 text-destructive" },
  converted: { label: "Đã chuyển ĐH", color: "bg-primary/10 text-primary" },
};

interface QuotationItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

export function QuotationsTab() {
  const { quotations, isLoading, createQuotation, updateQuotationStatus, convertToOrder, deleteQuotation } = useQuotations();
  const { products } = useProducts();
  const { partners } = usePartners();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state
  const [partnerId, setPartnerId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");

  const resetForm = () => {
    setPartnerId("");
    setValidUntil("");
    setNotes("");
    setItems([]);
    setSelectedProduct("");
  };

  const addItem = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    setItems(prev => [...prev, {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.selling_price || product.cost_price || 0,
      discount: 0,
    }]);
    setSelectedProduct("");
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleCreate = async () => {
    if (items.length === 0) return;
    await createQuotation.mutateAsync({
      quotation: { partner_id: partnerId || null, valid_until: validUntil || null, notes },
      items: items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: i.discount,
      })),
    });
    resetForm();
    setDialogOpen(false);
  };

  const filteredQuotations = quotations.filter((q: any) =>
    q.quotation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.partners?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = items.reduce((s, i) => s + (i.quantity * i.unit_price - i.discount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm báo giá..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Tạo báo giá
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredQuotations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>Chưa có báo giá nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredQuotations.map((q: any) => {
            const config = statusConfig[q.status] || statusConfig.draft;
            return (
              <Card key={q.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{q.quotation_number}</span>
                        <Badge variant="outline" className={cn("text-xs", config.color)}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>KH: {q.partners?.name || "N/A"}</span>
                        <span>{new Date(q.created_at).toLocaleDateString("vi-VN")}</span>
                        <span className="font-medium text-foreground">
                          {(q.total || 0).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {q.status === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuotationStatus.mutate({ id: q.id, status: "sent" })}
                          className="gap-1 text-xs"
                        >
                          <Send className="h-3 w-3" /> Gửi
                        </Button>
                      )}
                      {(q.status === "sent" || q.status === "accepted") && q.status !== "converted" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => convertToOrder.mutate(q.id)}
                          disabled={convertToOrder.isPending}
                          className="gap-1 text-xs"
                        >
                          <ArrowRight className="h-3 w-3" /> Tạo đơn
                        </Button>
                      )}
                      {q.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQuotation.mutate(q.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo Báo giá mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Khách hàng</label>
              <Select value={partnerId} onValueChange={setPartnerId}>
                <SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger>
                <SelectContent>
                  {partners.filter((p: any) => p.partner_type === "customer").map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Hiệu lực đến</label>
              <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </div>

            {/* Add products */}
            <div>
              <label className="text-sm font-medium">Sản phẩm</label>
              <div className="flex gap-2 mt-1">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Chọn sản phẩm" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} - {(p.selling_price || p.cost_price || 0).toLocaleString()}đ</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={addItem} disabled={!selectedProduct}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg border text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product_name}</p>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => updateItem(i, "quantity", Number(e.target.value))}
                      className="w-16 text-center"
                    />
                    <span className="text-muted-foreground">×</span>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={e => updateItem(i, "unit_price", Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-xs font-medium w-20 text-right">
                      {(item.quantity * item.unit_price).toLocaleString()}đ
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(i)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="text-right font-semibold text-sm">
                  Tổng: {totalAmount.toLocaleString("vi-VN")}đ
                </div>
              </div>
            )}

            <Textarea
              placeholder="Ghi chú..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={items.length === 0 || createQuotation.isPending}>
              {createQuotation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo báo giá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
