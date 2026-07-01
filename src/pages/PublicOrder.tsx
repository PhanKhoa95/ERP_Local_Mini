import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Minus, Trash2, Search, Package, CreditCard, CheckCircle, Store, Phone, MapPin, User, FileSearch, Ticket, Truck, Check, X, Eye, Warehouse } from "lucide-react";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import type { BankInfo, ShopInfo } from "@/hooks/useShopSettings";
import { useVouchers, type Voucher } from "@/hooks/useVouchers";
import { useShippingZones } from "@/hooks/useShippingZones";
import { useProductCategories } from "@/hooks/useProductCategories";
import { ProductDetailDialog } from "@/components/orders/ProductDetailDialog";
import { cn } from "@/lib/utils";
import { normalizePhone } from "@/lib/orderControl";
import { asJson, calculateOrderQualityScore, recordRawEvent } from "@/lib/dataHub";

type Product = Tables<"products">;

interface WarehouseInfo {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  quantity: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  pickupWarehouse?: WarehouseInfo;
}

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  province: string;
  notes: string;
}

interface OrderItem {
  product: Product;
  quantity: number;
  total: number;
}

type OrderStep = "browse" | "cart" | "checkout" | "success";

import { VIETNAM_PROVINCES as PROVINCES } from "@/lib/provinces";

export default function PublicOrder() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<OrderStep>("browse");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank">("cod");
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    address: "",
    province: "",
    notes: "",
  });
  const [orderNumber, setOrderNumber] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  // Product detail dialog
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  
  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState("");
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  const { validateVoucher, applyVoucher } = useVouchers();
  const { shippingZones, calculateShippingFee } = useShippingZones();
  const { activeCategories } = useProductCategories();

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .gt("stock_quantity", 0)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  // Fetch warehouses with stock
  const { data: warehousesWithStock = [] } = useQuery({
    queryKey: ["public-warehouses-stock", selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct) return [];
      
      const { data: stockData, error: stockError } = await supabase
        .from("warehouse_stock")
        .select(`
          quantity,
          warehouses!inner(id, name, address, phone, is_active)
        `)
        .eq("product_id", selectedProduct.id)
        .gt("quantity", 0);
      
      if (stockError) return [];
      
      return (stockData || [])
        .filter((s: any) => s.warehouses?.is_active !== false)
        .map((s: any) => ({
          id: s.warehouses.id,
          name: s.warehouses.name,
          address: s.warehouses.address,
          phone: s.warehouses.phone,
          quantity: s.quantity,
        })) as WarehouseInfo[];
    },
    enabled: !!selectedProduct,
  });

  // Fetch shop settings
  const { data: bankInfo } = useQuery({
    queryKey: ["shop_settings", "bank_info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_settings")
        .select("value")
        .eq("key", "bank_info")
        .single();
      if (error) return null;
      return data?.value as unknown as BankInfo;
    },
  });

  const { data: shopInfo } = useQuery({
    queryKey: ["shop_settings", "shop_info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_settings")
        .select("value")
        .eq("key", "shop_info")
        .single();
      if (error) return null;
      return data?.value as unknown as ShopInfo;
    },
  });

  // Check if any item is pickup
  const hasPickupItems = cart.some(item => item.pickupWarehouse);
  const allPickupItems = cart.every(item => item.pickupWarehouse);

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.selling_price || 0) * item.quantity, 0);
  const shippingFee = allPickupItems ? 0 : (customerInfo.province ? calculateShippingFee(customerInfo.province, cartSubtotal) : 0);
  const cartTotal = cartSubtotal - voucherDiscount + shippingFee;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    
    setIsValidatingVoucher(true);
    setVoucherError("");
    
    const result = await validateVoucher(voucherCode, cartSubtotal);
    
    if (result.valid && result.voucher && result.discount) {
      setAppliedVoucher(result.voucher);
      setVoucherDiscount(result.discount);
      toast({ title: "Áp dụng mã giảm giá thành công!" });
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

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderNum = `PO${Date.now().toString().slice(-8)}`;
      const storefrontCompanyId = cart.find(item => item.product.company_id)?.product.company_id || null;
      
      // Build shipping address and notes
      let shippingAddress = `${customerInfo.name} - ${customerInfo.phone}\n`;
      if (allPickupItems) {
        const pickupWarehouses = [...new Set(cart.map(item => item.pickupWarehouse?.name))].filter(Boolean);
        shippingAddress += `Nhận tại kho: ${pickupWarehouses.join(", ")}`;
      } else {
        shippingAddress += `${customerInfo.address}, ${customerInfo.province}`;
      }
      
      let notes = `Thanh toán: ${paymentMethod === "cod" ? "COD" : "Chuyển khoản"}`;
      if (hasPickupItems) {
        const pickupItems = cart.filter(i => i.pickupWarehouse);
        notes += `\nSản phẩm nhận tại kho: ${pickupItems.map(i => `${i.product.name} (${i.pickupWarehouse?.name})`).join(", ")}`;
      }
      if (customerInfo.notes) {
        notes += `\n${customerInfo.notes}`;
      }
      
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNum,
          company_id: storefrontCompanyId,
          source_type: "public_store",
          order_type: "b2c",
          status: "pending",
          customer_name: customerInfo.name,
          customer_phone: normalizePhone(customerInfo.phone),
          customer_address: allPickupItems ? shippingAddress : `${customerInfo.address}, ${customerInfo.province}`,
          shipping_province: allPickupItems ? null : customerInfo.province,
          payment_method: paymentMethod === "cod" ? "cod" : "bank_transfer",
          subtotal: cartSubtotal,
          shipping_fee: shippingFee,
          voucher_id: appliedVoucher?.id || null,
          voucher_discount: voucherDiscount,
          discount: voucherDiscount,
          total: cartTotal,
          shipping_address: shippingAddress,
          notes: notes,
        })
        .select()
        .single();
      
      if (orderError) throw orderError;

      const items = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.selling_price || 0,
        total: (item.product.selling_price || 0) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(items);

      if (itemsError) throw itemsError;

      if (storefrontCompanyId) {
        await recordRawEvent({
          company_id: storefrontCompanyId,
          source_type: "public_store",
          source_code: "public_store",
          event_type: "order.created",
          entity_type: "order",
          entity_id: orderData.id,
          external_id: orderNum,
          dedupe_key: `${storefrontCompanyId}:public_store:${orderNum}`,
          raw_payload: asJson({
            customer: customerInfo,
            payment_method: paymentMethod,
            cart: cart.map(item => ({
              product_id: item.product.id,
              sku: item.product.sku,
              name: item.product.name,
              quantity: item.quantity,
              pickup_warehouse_id: item.pickupWarehouse?.id || null,
            })),
            voucher_code: appliedVoucher?.code || null,
          }),
          normalized_payload: asJson({
            order_id: orderData.id,
            order_number: orderNum,
            customer_name: customerInfo.name,
            customer_phone: normalizePhone(customerInfo.phone),
            total: cartTotal,
            items_count: cart.length,
          }),
          quality_score: calculateOrderQualityScore({
            customer_name: customerInfo.name,
            customer_phone: normalizePhone(customerInfo.phone),
            customer_address: allPickupItems ? shippingAddress : `${customerInfo.address}, ${customerInfo.province}`,
            payment_method: paymentMethod === "cod" ? "cod" : "bank_transfer",
            total: cartTotal,
            items_count: cart.length,
          }),
          validation_status: "normalized",
          ingestion_status: "processed",
          processed_at: new Date().toISOString(),
        });
      }

      // Apply voucher usage
      if (appliedVoucher) {
        await applyVoucher(appliedVoucher.id);
      }

      return { orderNum, total: cartTotal, items: cart.map(item => ({
        product: item.product,
        quantity: item.quantity,
        total: (item.product.selling_price || 0) * item.quantity,
      })) };
    },
    onSuccess: (result) => {
      setOrderNumber(result.orderNum);
      setOrderTotal(result.total);
      setOrderItems(result.items);
      setStep("success");
      setCart([]);
      removeVoucher();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.sku.toLowerCase().includes(term)
      );
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    return filtered;
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product: Product, quantity: number = 1, pickupWarehouse?: WarehouseInfo) => {
    setCart(prev => {
      // If pickup, always add as new item (different warehouse = different item)
      if (pickupWarehouse) {
        const existingPickup = prev.find(
          item => item.product.id === product.id && item.pickupWarehouse?.id === pickupWarehouse.id
        );
        if (existingPickup) {
          return prev.map(item =>
            item.product.id === product.id && item.pickupWarehouse?.id === pickupWarehouse.id
              ? { ...item, quantity: Math.min(item.quantity + quantity, pickupWarehouse.quantity) }
              : item
          );
        }
        return [...prev, { product, quantity, pickupWarehouse }];
      }
      
      // Normal delivery - merge with existing
      const existing = prev.find(item => item.product.id === product.id && !item.pickupWarehouse);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && !item.pickupWarehouse
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock_quantity || 0) }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    toast({ title: "Đã thêm vào giỏ hàng" });
  };

  const updateQuantity = (productId: string, delta: number, warehouseId?: string) => {
    setCart(prev => prev.map(item => {
      const isMatch = warehouseId 
        ? (item.product.id === productId && item.pickupWarehouse?.id === warehouseId)
        : (item.product.id === productId && !item.pickupWarehouse);
      
      if (!isMatch) return item;
      
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      
      const maxQty = item.pickupWarehouse?.quantity || item.product.stock_quantity || 0;
      return { ...item, quantity: Math.min(newQty, maxQty) };
    }));
  };

  const removeFromCart = (productId: string, warehouseId?: string) => {
    setCart(prev => prev.filter(item => {
      if (warehouseId) {
        return !(item.product.id === productId && item.pickupWarehouse?.id === warehouseId);
      }
      return !(item.product.id === productId && !item.pickupWarehouse);
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const isCheckoutValid = allPickupItems 
    ? (customerInfo.name && customerInfo.phone)
    : (customerInfo.name && customerInfo.phone && customerInfo.address && customerInfo.province);

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
  };

  // Success Page
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8 px-4">
        <div className="max-w-lg mx-auto space-y-6">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Đặt hàng thành công!</CardTitle>
              <CardDescription>Cảm ơn bạn đã đặt hàng</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Mã đơn hàng của bạn:</p>
              <p className="text-3xl font-bold text-primary mt-2">{orderNumber}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chi tiết đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{customerInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{customerInfo.phone}</span>
                </div>
                {!allPickupItems && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>{customerInfo.address}, {customerInfo.province}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.product.name} x{item.quantity}</span>
                    <span className="font-medium">{formatPrice(item.total)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng:</span>
                <span className="text-primary">{formatPrice(orderTotal)}</span>
              </div>
            </CardContent>
          </Card>

          {paymentMethod === "bank" && bankInfo && bankInfo.account_number && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Thông tin chuyển khoản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p><span className="text-muted-foreground">Ngân hàng:</span> <strong>{bankInfo.bank_name}</strong></p>
                  {bankInfo.branch && <p><span className="text-muted-foreground">Chi nhánh:</span> <strong>{bankInfo.branch}</strong></p>}
                  <p><span className="text-muted-foreground">Số tài khoản:</span> <strong className="text-lg">{bankInfo.account_number}</strong></p>
                  <p><span className="text-muted-foreground">Chủ TK:</span> <strong>{bankInfo.account_holder}</strong></p>
                  <p><span className="text-muted-foreground">Số tiền:</span> <strong className="text-primary">{formatPrice(orderTotal)}</strong></p>
                  <p><span className="text-muted-foreground">Nội dung CK:</span> <strong className="text-primary">{orderNumber}</strong></p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Vui lòng chuyển khoản trong vòng 24h để xác nhận đơn hàng.
                </p>
              </CardContent>
            </Card>
          )}

          {paymentMethod === "cod" && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Chúng tôi sẽ liên hệ với bạn sớm để xác nhận đơn hàng.
                  <br />Thanh toán khi nhận hàng.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3">
            <Button className="w-full" onClick={() => {
              setStep("browse");
              setCustomerInfo({ name: "", phone: "", address: "", province: "", notes: "" });
            }}>
              Tiếp tục mua hàng
            </Button>
            <Link to="/tracking" className="w-full">
              <Button variant="outline" className="w-full">
                <FileSearch className="w-4 h-4 mr-2" />
                Tra cứu đơn hàng
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        {(shopInfo?.phone || shopInfo?.address) && (
          <div className="bg-primary/10 text-sm py-1.5">
            <div className="container mx-auto px-4 flex items-center justify-center gap-4 flex-wrap">
              {shopInfo?.phone && (
                <a href={`tel:${shopInfo.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Phone className="w-3 h-3" />
                  <span>{shopInfo.phone}</span>
                </a>
              )}
              {shopInfo?.address && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="hidden sm:inline">{shopInfo.address}</span>
                </span>
              )}
            </div>
          </div>
        )}
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">{shopInfo?.name || "Cửa hàng"}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to="/tracking">
              <Button variant="ghost" size="sm">
                <FileSearch className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Tra cứu</span>
              </Button>
            </Link>
            <Button
              variant={step === "cart" || step === "checkout" ? "default" : "outline"}
              size="sm"
              onClick={() => setStep(step === "browse" ? "cart" : "browse")}
              className="relative"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Giỏ hàng
              {cartCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {step === "browse" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {activeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || '#3B82F6' }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                Không tìm thấy sản phẩm
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredProducts.map((product) => {
                  const inCart = cart.filter(item => item.product.id === product.id);
                  const totalInCart = inCart.reduce((sum, i) => sum + i.quantity, 0);
                  return (
                    <Card 
                      key={product.id} 
                      className="overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => openProductDetail(product)}
                    >
                      <div className="aspect-square bg-muted relative">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-muted-foreground/50" />
                          </div>
                        )}
                        {totalInCart > 0 && (
                          <Badge className="absolute top-2 right-2">
                            {totalInCart}
                          </Badge>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-background/90 rounded-full p-2">
                            <Eye className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                          {product.name}
                        </h3>
                        <p className="text-primary font-bold mt-1">
                          {formatPrice(product.selling_price || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Còn {product.stock_quantity} {product.unit}
                        </p>
                      </CardContent>
                      <CardFooter className="p-3 pt-0">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          disabled={(product.stock_quantity || 0) <= 0}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm nhanh
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === "cart" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              Giỏ hàng
            </h1>

            {cart.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Giỏ hàng trống</p>
                  <Button className="mt-4" onClick={() => setStep("browse")}>
                    Tiếp tục mua hàng
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="divide-y">
                    {cart.map((item, idx) => (
                      <div key={`${item.product.id}-${item.pickupWarehouse?.id || 'delivery'}-${idx}`} className="flex items-center gap-4 py-4 first:pt-4 last:pb-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                          {item.product.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{item.product.name}</h3>
                          <p className="text-primary font-semibold">
                            {formatPrice(item.product.selling_price || 0)}
                          </p>
                          {item.pickupWarehouse && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Warehouse className="w-3 h-3" />
                              <span>Nhận tại: {item.pickupWarehouse.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, -1, item.pickupWarehouse?.id)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, 1, item.pickupWarehouse?.id)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeFromCart(item.product.id, item.pickupWarehouse?.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Tạm tính:</span>
                      <span className="text-primary">{formatPrice(cartSubtotal)}</span>
                    </div>
                    {hasPickupItems && (
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <Warehouse className="w-4 h-4" />
                        {allPickupItems ? "Miễn phí ship - Nhận tại kho" : "Một số sản phẩm nhận tại kho"}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep("browse")} className="flex-1">
                      Tiếp tục mua
                    </Button>
                    <Button onClick={() => setStep("checkout")} className="flex-1">
                      Thanh toán
                    </Button>
                  </CardFooter>
                </Card>
              </>
            )}
          </div>
        )}

        {step === "checkout" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Thanh toán
            </h1>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {allPickupItems ? "Thông tin nhận hàng" : "Thông tin giao hàng"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="w-4 h-4" /> Họ tên *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Nguyễn Văn A"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Số điện thoại *
                    </Label>
                    <Input
                      id="phone"
                      inputMode="tel"
                      placeholder="0901234567"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "") }))}
                      maxLength={15}
                    />
                  </div>
                  
                  {!allPickupItems && (
                    <>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Truck className="w-4 h-4" /> Tỉnh/Thành phố *
                        </Label>
                        <Select 
                          value={customerInfo.province} 
                          onValueChange={(v) => setCustomerInfo(prev => ({ ...prev, province: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn tỉnh/thành phố" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {PROVINCES.map(p => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> Địa chỉ chi tiết *
                        </Label>
                        <Textarea
                          id="address"
                          placeholder="Số nhà, đường, phường/xã, quận/huyện"
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                  
                  {allPickupItems && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 font-medium">
                        <Warehouse className="w-4 h-4" />
                        Nhận hàng tại kho
                      </div>
                      <div className="mt-2 text-sm text-green-600 space-y-1">
                        {[...new Map(cart.map(i => [i.pickupWarehouse?.id, i.pickupWarehouse])).values()]
                          .filter(Boolean)
                          .map(warehouse => (
                            <div key={warehouse!.id}>
                              <strong>{warehouse!.name}</strong>
                              {warehouse!.address && <span className="block text-xs">{warehouse!.address}</span>}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Ghi chú</Label>
                    <Textarea
                      id="notes"
                      placeholder="Ghi chú thêm cho đơn hàng..."
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method & Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Phương thức thanh toán</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "cod" | "bank")}>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <p className="font-medium">Thanh toán khi nhận hàng (COD)</p>
                        <p className="text-sm text-muted-foreground">Trả tiền mặt khi nhận hàng</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="bank" id="bank" />
                      <Label htmlFor="bank" className="flex-1 cursor-pointer">
                        <p className="font-medium">Chuyển khoản ngân hàng</p>
                        <p className="text-sm text-muted-foreground">Chuyển khoản trước khi giao hàng</p>
                      </Label>
                    </div>
                  </RadioGroup>

                  <Separator />

                  {/* Voucher */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Ticket className="w-4 h-4" /> Mã giảm giá
                    </Label>
                    {appliedVoucher ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-700">{appliedVoucher.code}</span>
                          <span className="text-sm text-green-600">(-{formatPrice(voucherDiscount)})</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={removeVoucher}>
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

                  <Separator />

                  {/* Order Summary */}
                  <div className="space-y-2">
                    <p className="font-medium text-muted-foreground">Đơn hàng của bạn:</p>
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="flex-1">
                          {item.product.name} x{item.quantity}
                          {item.pickupWarehouse && (
                            <span className="text-xs text-muted-foreground ml-1">(Nhận tại kho)</span>
                          )}
                        </span>
                        <span>{formatPrice((item.product.selling_price || 0) * item.quantity)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span>Tạm tính:</span>
                      <span>{formatPrice(cartSubtotal)}</span>
                    </div>
                    {voucherDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Giảm giá:</span>
                        <span>-{formatPrice(voucherDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Phí vận chuyển:
                      </span>
                      <span className={cn(allPickupItems && "text-green-600 font-medium")}>
                        {shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Tổng cộng:</span>
                      <span className="text-primary">{formatPrice(cartTotal)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => createOrderMutation.mutate()}
                    disabled={!isCheckoutValid || createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? "Đang xử lý..." : "Đặt hàng"}
                  </Button>
                  <Button variant="outline" onClick={() => setStep("cart")} className="w-full">
                    Quay lại giỏ hàng
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={selectedProduct}
        warehouses={warehousesWithStock}
        onAddToCart={addToCart}
      />
    </div>
  );
}
