import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Ticket, Check, X, Truck, AlertTriangle, Warehouse, CheckCircle2, Info } from "lucide-react";
import { useSalesChannels } from "@/hooks/useSalesChannels";
import { useProducts } from "@/hooks/useProducts";
import { usePartners } from "@/hooks/usePartners";
import { useVouchers, type Voucher } from "@/hooks/useVouchers";
import { useShippingZones } from "@/hooks/useShippingZones";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useWarehouseStock } from "@/hooks/useWarehouseStock";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { normalizePhone } from "@/lib/orderControl";
import { useToast } from "@/hooks/use-toast";
import { validateOrderPayload } from "@/lib/validation";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

interface OrderItem {
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function CreateOrderDialog({ open, onOpenChange, onSubmit, isLoading }: CreateOrderDialogProps) {
  const { channels } = useSalesChannels();
  const { products } = useProducts();
  const { customers } = usePartners();
  const { vouchers, validateVoucher } = useVouchers();
  const { shippingZones } = useShippingZones();
  const { warehouses } = useWarehouses();
  const { autoSelectWarehouse, checkStockAvailability } = useWarehouseStock();
  const { toast } = useToast();

  // Fetch all BOM items
  const { data: allBomItems = [] } = useQuery({
    queryKey: ["all-product-bom"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_bom")
        .select(`
          *,
          material:products!product_bom_material_id_fkey(id, name, sku, stock_quantity, unit)
        `)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    channel_id: "",
    partner_id: "",
    order_type: "b2c" as "b2b" | "b2c",
    platform_order_id: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    shipping_address: "",
    payment_method: "cod",
    payment_reference: "",
    priority: "normal",
    notes: "",
    internal_notes: "",
    shipping_zone_id: "",
    warehouse_id: "",
  });

  const [items, setItems] = useState<OrderItem[]>([]);
  
  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState("");
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        channel_id: "",
        partner_id: "",
        order_type: "b2c",
        platform_order_id: "",
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        customer_address: "",
        shipping_address: "",
        payment_method: "cod",
        payment_reference: "",
        priority: "normal",
        notes: "",
        internal_notes: "",
        shipping_zone_id: "",
        warehouse_id: "",
      });
      setItems([]);
      setVoucherCode("");
      setAppliedVoucher(null);
      setVoucherDiscount(0);
      setVoucherError("");
    }
  }, [open]);

  // Auto-select warehouse based on order items
  const warehouseAnalysis = useMemo(() => {
    const orderItems = items
      .filter(item => item.product_id)
      .map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));
    return autoSelectWarehouse(orderItems);
  }, [items, autoSelectWarehouse]);

  // Auto-set warehouse when analysis changes
  useEffect(() => {
    if (warehouseAnalysis.warehouse_id && !formData.warehouse_id) {
      setFormData(prev => ({ ...prev, warehouse_id: warehouseAnalysis.warehouse_id! }));
    }
  }, [warehouseAnalysis.warehouse_id, formData.warehouse_id]);

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 1, unit_price: 0, discount: 0, total: 0 }]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].product = product;
        newItems[index].unit_price = Number(product.selling_price) || 0;
      }
    }

    // Recalculate total
    const item = newItems[index];
    item.total = (item.quantity * item.unit_price) - item.discount;

    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  // Calculate material shortages for BOM products
  const materialShortages = useMemo(() => {
    const shortages: Array<{
      productName: string;
      materialName: string;
      materialSku: string;
      required: number;
      available: number;
      shortage: number;
      unit: string;
    }> = [];

    items.forEach(orderItem => {
      if (!orderItem.product_id) return;
      
      const bomItems = allBomItems.filter(bom => bom.product_id === orderItem.product_id);
      
      bomItems.forEach(bomItem => {
        const material = bomItem.material as any;
        if (!material) return;
        
        const requiredQty = orderItem.quantity * bomItem.quantity;
        const availableQty = material.stock_quantity || 0;
        
        if (requiredQty > availableQty) {
          // Check if already in shortages list
          const existingIdx = shortages.findIndex(s => s.materialSku === material.sku);
          if (existingIdx >= 0) {
            shortages[existingIdx].required += requiredQty;
            shortages[existingIdx].shortage = Math.max(0, shortages[existingIdx].required - shortages[existingIdx].available);
          } else {
            shortages.push({
              productName: orderItem.product?.name || "",
              materialName: material.name,
              materialSku: material.sku,
              required: requiredQty,
              available: availableQty,
              shortage: requiredQty - availableQty,
              unit: material.unit || "cái",
            });
          }
        }
      });
    });

    return shortages;
  }, [items, allBomItems]);
  
  // Get shipping fee
  const selectedZone = shippingZones.find(z => z.id === formData.shipping_zone_id);
  const shippingFee = selectedZone 
    ? (selectedZone.free_shipping_threshold && subtotal >= selectedZone.free_shipping_threshold ? 0 : selectedZone.base_fee)
    : 0;
  
  const grandTotal = subtotal - voucherDiscount + shippingFee;

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    
    setIsValidatingVoucher(true);
    setVoucherError("");
    
    const result = await validateVoucher(voucherCode, subtotal);
    
    if (result.valid && result.voucher && result.discount) {
      setAppliedVoucher(result.voucher);
      setVoucherDiscount(result.discount);
    } else {
      setVoucherError(result.message || "Mã giảm giá không hợp lệ");
    }
    
    setIsValidatingVoucher(false);
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    setVoucherCode("");
    setVoucherError("");
  };

  const handleCustomerSelect = (value: string) => {
    const customer = customers.find((c) => c.id === value);
    setFormData((prev) => ({
      ...prev,
      partner_id: value,
      customer_name: customer?.name || prev.customer_name,
      customer_phone: normalizePhone(customer?.phone) || prev.customer_phone,
      customer_email: customer?.email || prev.customer_email,
      customer_address: customer?.address || prev.customer_address,
      shipping_address: prev.shipping_address || customer?.address || "",
    }));
  };

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateOrderPayload(formData, items.length);

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    const orderNumber = `ORD-${Date.now()}`;

    onSubmit({
      order: {
        order_number: orderNumber,
        platform_order_id: formData.platform_order_id || null,
        channel_id: formData.channel_id,
        partner_id: formData.partner_id || null,
        order_type: formData.order_type,
        source_type: "manual",
        customer_name: formData.customer_name || null,
        customer_phone: normalizePhone(formData.customer_phone) || null,
        customer_email: formData.customer_email || null,
        customer_address: formData.customer_address || formData.shipping_address || null,
        shipping_address: formData.shipping_address || formData.customer_address,
        payment_method: formData.payment_method,
        payment_reference: formData.payment_reference || null,
        priority: formData.priority,
        internal_notes: formData.internal_notes || null,
        warehouse_id: formData.warehouse_id || null,
        shipping_zone_id: formData.shipping_zone_id || null,
        notes: formData.notes,
        subtotal,
        shipping_fee: shippingFee,
        voucher_id: appliedVoucher?.id || null,
        voucher_discount: voucherDiscount,
        discount: voucherDiscount,
        total: grandTotal,
        status: "pending",
      },
      items: items.map(({ product_id, quantity, unit_price, discount, total }) => ({
        product_id,
        quantity,
        unit_price,
        discount,
        total,
      })),
    });
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat("vi-VN").format(v) + "đ";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/80 backdrop-blur-lg shadow-xl rounded-xl animate-fade-in">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-foreground">Tạo đơn hàng mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nguồn đơn *</Label>
              <Select
                value={formData.channel_id}
                onValueChange={(value) => setFormData({ ...formData, channel_id: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Chọn kênh bán" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: channel.color || "#3B82F6" }}
                        />
                        {channel.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Loại đơn</Label>
              <Select
                value={formData.order_type}
                onValueChange={(value: "b2b" | "b2c") => setFormData({ ...formData, order_type: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="b2c">B2C - Khách lẻ</SelectItem>
                  <SelectItem value="b2b">B2B - Khách sỉ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Khách hàng</Label>
            <Select
              value={formData.partner_id}
              onValueChange={handleCustomerSelect}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Chọn khách hàng (tùy chọn)" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tên khách / người nhận</Label>
              <Input
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input
                inputMode="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: normalizePhone(e.target.value) })}
                placeholder="0901234567"
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ khách hàng</Label>
              <Input
                value={formData.customer_address}
                onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                placeholder="Địa chỉ liên hệ"
              />
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sản phẩm</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Thêm sản phẩm
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="space-y-1 p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={item.product_id}
                      onValueChange={(value) => updateItem(index, "product_id", value)}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Chọn sản phẩm" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.sku} - {product.name} (Tồn: {product.stock_quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    className="w-20"
                    placeholder="SL"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                    min={1}
                  />
                  <Input
                    type="number"
                    className="w-28"
                    placeholder="Đơn giá"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, "unit_price", Number(e.target.value))}
                  />
                  <div className="w-28 text-right font-medium">
                    {item.total.toLocaleString("vi-VN")}đ
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                {item.product && item.unit_price > 0 && item.product.cost_price > 0 && item.unit_price < item.product.cost_price && (
                  <div className="text-xs text-amber-500 font-medium pl-1">
                    Cảnh báo: Đơn giá thấp hơn giá vốn ({item.product.cost_price.toLocaleString("vi-VN")}đ)
                  </div>
                )}
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                Chưa có sản phẩm. Nhấn "Thêm sản phẩm" để bắt đầu.
              </div>
            )}

            {/* Material Shortage Warning */}
            {materialShortages.length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong className="block mb-2">Cảnh báo: Thiếu nguyên vật liệu (BOM)</strong>
                  <ul className="space-y-1 text-sm">
                    {materialShortages.map((shortage, idx) => (
                      <li key={idx}>
                        • <span className="font-medium">{shortage.materialName}</span> ({shortage.materialSku}): 
                        Cần {shortage.required} {shortage.unit}, 
                        Tồn {shortage.available} {shortage.unit}, 
                        Thiếu <span className="text-destructive font-bold">{shortage.shortage}</span> {shortage.unit}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Warehouse Selection - Auto Selected */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" /> Kho xuất hàng
            </Label>
            <Select
              value={formData.warehouse_id}
              onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
            >
              <SelectTrigger className={cn(
                "bg-background",
                warehouseAnalysis.all_available ? "border-green-500" : warehouseAnalysis.issues.length > 0 ? "border-orange-500" : ""
              )}>
                <SelectValue placeholder="Tự động chọn kho có hàng" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {warehouses.filter(w => w.is_active).map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-3 w-3" />
                      {warehouse.name}
                      {warehouse.is_default && <Badge variant="secondary" className="text-xs">Mặc định</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stock Availability Status */}
            {items.length > 0 && items.some(i => i.product_id) && (
              <div className="mt-2">
                {warehouseAnalysis.all_available ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm p-2 bg-green-50 rounded-lg">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Đủ hàng tại kho <strong>{warehouseAnalysis.warehouse_name}</strong></span>
                  </div>
                ) : warehouseAnalysis.issues.length > 0 && (
                  <Alert className="border-orange-300 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong className="block mb-1">Cảnh báo tồn kho:</strong>
                      <ul className="space-y-1 text-sm">
                        {warehouseAnalysis.issues.map(issue => (
                          <li key={issue.product_id}>
                            • {issue.product_name}: cần {issue.required}, có {issue.available}, thiếu <strong className="text-orange-700">{issue.shortage}</strong>
                          </li>
                        ))}
                      </ul>
                      {warehouseAnalysis.issues.length > 0 && (
                        <p className="mt-2 text-xs flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Đơn hàng vẫn có thể tạo nhưng cần bổ sung tồn kho trước khi xác nhận.
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Shipping Zone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Truck className="h-4 w-4" /> Vùng vận chuyển
            </Label>
            <Select
              value={formData.shipping_zone_id}
              onValueChange={(value) => setFormData({ ...formData, shipping_zone_id: value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Chọn vùng vận chuyển" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {shippingZones.filter(z => z.is_active).map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name} - {formatCurrency(zone.base_fee)}
                    {zone.free_shipping_threshold && ` (Free từ ${formatCurrency(zone.free_shipping_threshold)})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Phương thức thanh toán</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="cod">COD</SelectItem>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                  <SelectItem value="card">Thẻ</SelectItem>
                  <SelectItem value="ewallet">Ví điện tử</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mã đơn sàn (nếu có)</Label>
              <Input
                value={formData.platform_order_id}
                onChange={(e) => setFormData({ ...formData, platform_order_id: e.target.value })}
                placeholder="Ví dụ: SP-12345"
              />
            </div>
            <div className="space-y-2">
              <Label>Mã tham chiếu thanh toán</Label>
              <Input
                value={formData.payment_reference}
                onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                placeholder="Mã CK/giao dịch"
              />
            </div>
            <div className="space-y-2">
              <Label>Mức ưu tiên</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="normal">Thường</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="urgent">Gấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Voucher */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Ticket className="h-4 w-4" /> Mã giảm giá
            </Label>
            {appliedVoucher ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-700">{appliedVoucher.code}</span>
                  <span className="text-sm text-green-600">(-{formatCurrency(voucherDiscount)})</span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={removeVoucher}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mã giảm giá"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                />
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleApplyVoucher}
                  disabled={isValidatingVoucher || !voucherCode}
                >
                  Áp dụng
                </Button>
              </div>
            )}
            {voucherError && <p className="text-sm text-destructive">{voucherError}</p>}
          </div>

          {/* Totals */}
          <div className="space-y-2 p-4 bg-secondary/30 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Tạm tính:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm giá:</span>
                <span>-{formatCurrency(voucherDiscount)}</span>
              </div>
            )}
            {shippingFee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Phí vận chuyển:</span>
                <span>{formatCurrency(shippingFee)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Tổng cộng:</span>
              <span className="text-primary">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Địa chỉ giao hàng</Label>
            <Textarea
              value={formData.shipping_address}
              onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
              placeholder="Nhập địa chỉ giao hàng"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ghi chú cho đơn</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ghi chú in/hiển thị cho xử lý đơn"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú nội bộ kiểm soát</Label>
              <Textarea
                value={formData.internal_notes}
                onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                placeholder="Thông tin chỉ dùng nội bộ: kiểm hàng, ưu tiên, rủi ro..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || validationErrors.length > 0}
              className="h-10 px-6"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo đơn hàng
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
