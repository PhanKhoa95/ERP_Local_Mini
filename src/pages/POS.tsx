import { useState, useMemo, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  User,
  Loader2,
  Package,
  Receipt,
  X,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Coins
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { usePartners } from "@/hooks/usePartners";
import { useSalesChannels } from "@/hooks/useSalesChannels";
import { useOrders } from "@/hooks/useOrders";
import { useMemberships } from "@/hooks/useMemberships";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useWarehouseStock } from "@/hooks/useWarehouseStock";
import { useToast } from "@/hooks/use-toast";
import { useVouchers } from "@/hooks/useVouchers";
import { PartnerDialog } from "@/components/partners/PartnerDialog";
import { cn } from "@/lib/utils";
import { normalizePhone } from "@/lib/orderControl";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

type Product = Tables<"products">;

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
}

interface POSQuantityInputProps {
  value: number;
  maxStock: number;
  isService: boolean;
  onChange: (val: number) => void;
}

const POSQuantityInput: React.FC<POSQuantityInputProps> = ({
  value,
  maxStock,
  isService,
  onChange,
}) => {
  const [localValue, setLocalValue] = useState<string>(value.toString());
  const lastSentValue = useRef<number>(value);
  const { toast } = useToast();

  useEffect(() => {
    if (value !== lastSentValue.current) {
      setLocalValue(value.toString());
      lastSentValue.current = value;
    }
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue === "") return;
      const num = parseInt(localValue, 10);
      if (num >= 1 && num !== lastSentValue.current) {
        if (isService || num <= maxStock) {
          lastSentValue.current = num;
          onChange(num);
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localValue, onChange, maxStock, isService]);

  const handleInputChange = (valStr: string) => {
    const cleanVal = valStr.replace(/[^0-9]/g, "");
    setLocalValue(cleanVal);
  };

  const handleBlur = () => {
    if (localValue === "") {
      onChange(1);
      setLocalValue("1");
      lastSentValue.current = 1;
      return;
    }

    const num = parseInt(localValue, 10);
    if (num < 1) {
      onChange(1);
      setLocalValue("1");
      lastSentValue.current = 1;
    } else if (!isService && num > maxStock) {
      onChange(maxStock);
      setLocalValue(maxStock.toString());
      lastSentValue.current = maxStock;
      toast({
        variant: "destructive",
        title: "Vượt quá tồn kho",
        description: `Sản phẩm này chỉ còn tối đa ${maxStock} trong kho.`,
      });
    } else if (num !== lastSentValue.current) {
      onChange(num);
      lastSentValue.current = num;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={localValue}
      onChange={(e) => handleInputChange(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-14 h-8 text-center text-sm font-semibold border-border bg-background focus-visible:ring-1 focus-visible:ring-primary shadow-xs px-1"
    />
  );
};

interface POSNumberInputProps {
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
}

const POSNumberInput: React.FC<POSNumberInputProps> = ({
  value,
  onChange,
  placeholder,
  className,
}) => {
  const [localVal, setLocalVal] = useState<string>(value === 0 ? "" : value.toString());
  const lastValue = useRef<number>(value);

  useEffect(() => {
    if (value !== lastValue.current) {
      setLocalVal(value === 0 ? "" : value.toString());
      lastValue.current = value;
    }
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const num = localVal === "" ? 0 : parseInt(localVal, 10);
      if (num !== lastValue.current) {
        lastValue.current = num;
        onChange(num);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localVal, onChange]);

  const handleChange = (inputStr: string) => {
    const cleanStr = inputStr.replace(/[^0-9]/g, "");
    setLocalVal(cleanStr);
  };

  const handleBlur = () => {
    const num = localVal === "" ? 0 : parseInt(localVal, 10);
    setLocalVal(num === 0 ? "" : num.toString());
    if (num !== lastValue.current) {
      lastValue.current = num;
      onChange(num);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={localVal}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
    />
  );
};

interface POSTextInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

const POSTextInput: React.FC<POSTextInputProps> = ({
  value,
  onChange,
  placeholder,
  className,
}) => {
  const [localVal, setLocalVal] = useState<string>(value);
  const lastValue = useRef<string>(value);

  useEffect(() => {
    if (value !== lastValue.current) {
      setLocalVal(value);
      lastValue.current = value;
    }
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localVal !== lastValue.current) {
        lastValue.current = localVal;
        onChange(localVal);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localVal, onChange]);

  const handleBlur = () => {
    if (localVal !== lastValue.current) {
      lastValue.current = localVal;
      onChange(localVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Input
      type="text"
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
    />
  );
};

const POS = () => {
  const { products, isLoading: productsLoading } = useProducts();
  const { customers, updatePartner, createPartner } = usePartners();
  const { channels } = useSalesChannels();
  const { orders, createOrder } = useOrders();
  const { warehouses } = useWarehouses();
  const { autoSelectWarehouse, checkStockAvailability } = useWarehouseStock();
  const { toast } = useToast();
  const { memberships, performTransaction } = useMemberships();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const customerMembership = useMemo(() => {
    if (!selectedCustomer || selectedCustomer === "walk-in") return null;
    return memberships.find(m => m.partner_id === selectedCustomer);
  }, [selectedCustomer, memberships]);

  const handleQuickAddCustomerSubmit = async (data: any) => {
    try {
      const newCust = await createPartner.mutateAsync(data);
      setSelectedCustomer(newCust.id);
      setQuickAddOpen(false);
      toast({
        title: "Thêm đối tác thành công",
        description: `Đã chọn khách hàng "${newCust.name}" cho đơn hàng.`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Lỗi tạo đối tác",
        description: e.message || "Không thể tạo đối tác.",
      });
    }
  };
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const { vouchers, applyVoucher } = useVouchers();
  const [isManualDiscount, setIsManualDiscount] = useState(false);
  const [appliedPromoName, setAppliedPromoName] = useState<string | null>(null);
  const [appliedVoucherId, setAppliedVoucherId] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Get default warehouse
  const defaultWarehouse = useMemo(() => {
    return warehouses.find(w => w.is_default && w.is_active) || warehouses.find(w => w.is_active);
  }, [warehouses]);

  // Get default sales channel (prioritize retail, then first active channel)
  const defaultChannel = useMemo(() => {
    return (
      channels.find(c => c.code?.toLowerCase() === "retail" && c.is_active) ||
      channels.find(c => c.name?.toLowerCase().includes("bán lẻ") && c.is_active) ||
      channels.find(c => c.is_active) ||
      channels[0]
    );
  }, [channels]);

  // Auto-select default warehouse and sales channel on mount
  useEffect(() => {
    if (defaultWarehouse && !selectedWarehouse) {
      setSelectedWarehouse(defaultWarehouse.id);
    }
  }, [defaultWarehouse, selectedWarehouse]);

  // Automatically switch POS warehouse to customer's default warehouse if configured
  useEffect(() => {
    if (selectedCustomer && selectedCustomer !== "walk-in") {
      const cust = customers.find(c => c.id === selectedCustomer);
      if (cust?.warehouse_id) {
        setSelectedWarehouse(cust.warehouse_id);
      }
    }
  }, [selectedCustomer, customers]);

  const handleSimulateQRScan = () => {
    const vipCustomer = customers.find(c => c.promo_segment === "loyalty") || customers.find(c => c.promo_segment === "wholesale") || customers[0];
    if (vipCustomer) {
      setSelectedCustomer(vipCustomer.id);
      if (vipCustomer.warehouse_id) {
        setSelectedWarehouse(vipCustomer.warehouse_id);
      }
      toast({
        title: "📡 Quét thẻ thành viên thành công",
        description: `Đã nhận diện thẻ VIP của "${vipCustomer.name}". Tự động áp dụng Kho mặc định và chính sách chiết khấu.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Không tìm thấy thẻ",
        description: "Vui lòng thêm khách hàng vào hệ thống trước.",
      });
    }
  };

  useEffect(() => {
    if (defaultChannel && !selectedChannel) {
      setSelectedChannel(defaultChannel.id);
    }
  }, [defaultChannel, selectedChannel]);

  // Filter customers for quick search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 20);
    const search = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(search) ||
      c.phone?.includes(search) ||
      c.code.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [customers, customerSearch]);

  // Auto-select warehouse based on cart items
  const warehouseAnalysis = useMemo(() => {
    const items = cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity,
    }));
    return autoSelectWarehouse(items);
  }, [cart, autoSelectWarehouse]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return ["all", ...Array.from(cats)] as string[];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory && product.is_active;
    });
  }, [products, searchTerm, selectedCategory]);

  // Cart functions
  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    const isService = product.is_service === true;
    const isLimitedService = isService && ((product.stock_quantity || 0) > 0 || (product.min_stock || 0) > 0);
    const shouldCheckStock = !isService || isLimitedService;
    
    if (existingItem) {
      if (shouldCheckStock && existingItem.quantity >= (product.stock_quantity || 0)) {
        toast({
          variant: "destructive",
          title: "Hết hàng",
          description: `${product.name} chỉ còn ${product.stock_quantity} sản phẩm`,
        });
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      if (shouldCheckStock && (product.stock_quantity || 0) < 1) {
        toast({
          variant: "destructive",
          title: "Hết hàng",
          description: "Sản phẩm đã hết hàng.",
        });
        return;
      }
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          unit_price: Number(product.selling_price) || 0,
          discount: 0,
        },
      ]);
    }
    // Show cart on mobile when item added
    if (window.innerWidth < 1024) {
      setCartOpen(true);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;
    
    const isService = item.product.is_service === true;
    const isLimitedService = isService && ((item.product.stock_quantity || 0) > 0 || (item.product.min_stock || 0) > 0);
    const shouldCheckStock = !isService || isLimitedService;
    if (shouldCheckStock && newQuantity > (item.product.stock_quantity || 0)) {
      toast({
        variant: "destructive",
        title: "Vượt quá tồn kho",
        description: `Chỉ còn ${item.product.stock_quantity} sản phẩm`,
      });
      return;
    }
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, unit_price: newPrice } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer("");
    setDiscount(0);
    setShippingFee(0);
    setNotes("");
  };

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.unit_price - item.discount,
    0
  );
  const total = subtotal - discount + shippingFee;

  const handleDiscountChange = (val: number) => {
    setIsManualDiscount(true);
    setDiscount(val);
  };

  useEffect(() => {
    if (cart.length === 0) {
      setIsManualDiscount(false);
      setAppliedPromoName(null);
      setAppliedVoucherId(null);
    }
  }, [cart]);

  // Dynamically compute the usage count of each voucher from orders list to ensure perfect sync
  const computedUsedCount = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      if (o.voucher_id) {
        counts[o.voucher_id] = (counts[o.voucher_id] || 0) + 1;
      }
    });
    return counts;
  }, [orders]);

  useEffect(() => {
    if (isManualDiscount) return;

    const customerObj = selectedCustomer && selectedCustomer !== "walk-in"
      ? customers.find((c) => c.id === selectedCustomer)
      : null;
    const activeCustomerSegment = customerObj?.promo_segment || "all";

    const now = new Date();
    const eligiblePromos = vouchers.filter(v => {
      if (!v.is_active || !v.is_auto_apply) return false;
      if (v.start_date && new Date(v.start_date) > now) return false;
      if (v.end_date && new Date(v.end_date) < now) return false;
      
      const actualUsed = computedUsedCount[v.id] || 0;
      if (v.usage_limit && actualUsed >= v.usage_limit) return false;

      // Category check: If target_category is specified and not "all", cart must contain a matching product
      if (v.target_category && v.target_category !== "all") {
        const hasMatchingItem = cart.some(item => item.product.category === v.target_category);
        if (!hasMatchingItem) return false;
      }

      // Check min order value against applicable subtotal
      let applicableSubtotal = subtotal;
      if (v.target_category && v.target_category !== "all") {
        applicableSubtotal = cart
          .filter(item => item.product.category === v.target_category)
          .reduce((sum, item) => sum + item.quantity * item.unit_price - item.discount, 0);
      }
      
      if (v.min_order_value && applicableSubtotal < v.min_order_value) return false;
      
      // Synchronize with customer classification segment
      if (v.target_customer_group && v.target_customer_group !== "all") {
        if (v.target_customer_group !== activeCustomerSegment) return false;
      }
      return true;
    });

    if (eligiblePromos.length === 0) {
      setDiscount(0);
      setAppliedPromoName(null);
      setAppliedVoucherId(null);
      return;
    }

    let bestDiscount = 0;
    let bestPromoName: string | null = null;
    let bestPromoId: string | null = null;

    eligiblePromos.forEach(v => {
      let applicableSubtotal = subtotal;
      if (v.target_category && v.target_category !== "all") {
        applicableSubtotal = cart
          .filter(item => item.product.category === v.target_category)
          .reduce((sum, item) => sum + item.quantity * item.unit_price - item.discount, 0);
      }

      let currentDiscount = v.discount_type === "percentage"
        ? applicableSubtotal * (v.discount_value / 100)
        : v.discount_value;

      if (v.max_discount && currentDiscount > v.max_discount) {
        currentDiscount = v.max_discount;
      }

      if (currentDiscount > bestDiscount) {
        bestDiscount = Math.round(currentDiscount);
        bestPromoName = v.name;
        bestPromoId = v.id;
      }
    });

    setDiscount(bestDiscount);
    setAppliedPromoName(bestPromoName);
    setAppliedVoucherId(bestPromoId);
  }, [subtotal, cart, vouchers, isManualDiscount, selectedCustomer, customers, computedUsedCount]);

  // Submit order
  const handleCheckout = async (method: "cash" | "bank" | "membership_wallet" = "cash") => {
    if (!selectedChannel) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng chọn kênh bán hàng",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm vào giỏ hàng",
      });
      return;
    }

    // Check selling under cost warning
    const hasSellingUnderCost = cart.some(item => 
      item.unit_price > 0 && item.product.cost_price > 0 && item.unit_price < item.product.cost_price
    );
    if (hasSellingUnderCost) {
      const confirmLoss = window.confirm("Cảnh báo: Có sản phẩm trong giỏ hàng có giá bán THẤP hơn giá vốn. Bạn có chắc chắn muốn tiếp tục thanh toán bán lỗ?");
      if (!confirmLoss) {
        return;
      }
    }

    if (!selectedWarehouse) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng chọn kho xuất hàng",
      });
      return;
    }

    // Check membership wallet payment validity
    if (method === "membership_wallet") {
      if (!customerMembership) {
        toast({
          variant: "destructive",
          title: "Không tìm thấy thẻ",
          description: "Khách hàng này chưa có hoặc chưa liên kết thẻ thành viên",
        });
        return;
      }
      if (customerMembership.status !== "active") {
        toast({
          variant: "destructive",
          title: "Thẻ đã bị khóa hoặc hết hạn",
          description: "Thẻ thành viên của khách hàng hiện tại không khả dụng",
        });
        return;
      }
      if (customerMembership.balance < total) {
        toast({
          variant: "destructive",
          title: "Số dư ví không đủ",
          description: `Tài khoản ví hiện có ${customerMembership.balance.toLocaleString("vi-VN")}đ, thiếu ${(total - customerMembership.balance).toLocaleString("vi-VN")}đ`,
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      const orderNumber = `POS-${Date.now()}`;
      const customer = selectedCustomer && selectedCustomer !== "walk-in"
        ? customers.find((c) => c.id === selectedCustomer)
        : null;

      // Deduct balance from membership card prepaid wallet
      if (method === "membership_wallet" && customerMembership) {
        await performTransaction.mutateAsync({
          membershipId: customerMembership.id,
          type: "payment",
          amount: total,
          description: `Thanh toán mua hàng đơn POS: ${orderNumber}`,
        });
      }

      await createOrder.mutateAsync({
        order: {
          order_number: orderNumber,
          channel_id: selectedChannel,
          partner_id: selectedCustomer && selectedCustomer !== "walk-in" ? selectedCustomer : null,
          order_type: "b2c",
          source_type: "pos",
          customer_name: customer?.name || "Khách lẻ",
          customer_phone: normalizePhone(customer?.phone) || null,
          customer_email: customer?.email || null,
          customer_address: customer?.address || null,
          payment_method: method,
          warehouse_id: selectedWarehouse || null,
          priority: "normal",
          delivered_at: new Date().toISOString(),
          subtotal,
          discount,
          shipping_fee: shippingFee,
          total,
          notes: selectedWarehouse ? `[Kho: ${warehouses.find(w => w.id === selectedWarehouse)?.name || selectedWarehouse}] ${notes}`.trim() : notes,
          status: "delivered", // POS orders are delivered immediately
          payment_status: "paid", // POS orders are paid immediately
          paid_amount: total,
          voucher_id: appliedVoucherId,
        },
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          total: item.quantity * item.unit_price - item.discount,
        })),
      });

      // Increment voucher usage count if applied
      if (appliedVoucherId) {
        await applyVoucher(appliedVoucherId);
      }

      // Stock deduction is now handled by createOrder in useOrders.ts


      // Rule-based Auto-Segmentation & thăng hạng VIP
      if (customer) {
        const newTotalSpent = (customer.total_spent || 0) + total;
        const currentSegment = customer.promo_segment || "all";
        let newSegment = currentSegment;
        let didAutoUpgrade = false;
        
        if (newTotalSpent >= 10000000 && currentSegment === "all") {
          newSegment = "loyalty";
          didAutoUpgrade = true;
        }

        await updatePartner.mutateAsync({
          id: customer.id,
          total_spent: newTotalSpent,
          loyalty_points: (customer.loyalty_points || 0) + Math.floor(total / 10000),
          promo_segment: newSegment,
        });

        if (didAutoUpgrade) {
          toast({
            title: "🎉 Thăng hạng Thành viên VIP",
            description: `Đơn hàng ${orderNumber} đã được tạo. Khách hàng "${customer.name}" đã tích lũy ${newTotalSpent.toLocaleString("vi-VN")}đ và tự động thăng hạng lên tệp VIP/Loyalty!`,
          });
        } else {
          toast({
            title: "Thanh toán thành công",
            description: `Đơn hàng ${orderNumber} đã được tạo`,
          });
        }
      } else {
        toast({
          title: "Thanh toán thành công",
          description: `Đơn hàng ${orderNumber} đã được tạo`,
        });
      }

      clearCart();
      setCartOpen(false);
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const CartContent = () => (
    <div className="flex flex-col h-full">
      {/* Cart Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Giỏ hàng</h2>
            <Badge variant="secondary">{cart.length}</Badge>
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart}>
              <X className="h-4 w-4 mr-1" />
              Xóa
            </Button>
          )}
        </div>

        {/* Channel Selection */}
        <Select value={selectedChannel} onValueChange={setSelectedChannel}>
          <SelectTrigger className="bg-background mb-2">
            <SelectValue placeholder="Chọn kênh bán hàng *" />
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

        {/* Warehouse Selection - Auto Selected */}
        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
          <SelectTrigger className={cn(
            "bg-background",
            warehouseAnalysis.all_available ? "border-green-500" : warehouseAnalysis.issues.length > 0 ? "border-orange-500" : ""
          )}>
            <SelectValue placeholder="Chọn kho xuất hàng" />
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

        {/* Stock Status Indicator */}
        {cart.length > 0 && (
          <div className="mt-2">
            {warehouseAnalysis.all_available ? (
              <div className="flex items-center gap-2 text-green-600 text-xs">
                <CheckCircle2 className="h-3 w-3" />
                <span>Đủ hàng tại {warehouseAnalysis.warehouse_name}</span>
              </div>
            ) : warehouseAnalysis.issues.length > 0 && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  {warehouseAnalysis.issues.map(issue => (
                    <div key={issue.product_id}>
                      {issue.product_name}: thiếu {issue.shortage}
                    </div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {/* Customer Selection with Search */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Khách hàng</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={handleSimulateQRScan}
            className="h-7 text-xs text-primary gap-1 px-1.5 hover:bg-primary/10"
          >
            <QrCode className="h-3.5 w-3.5" /> Giả lập Quét VIP
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <POSTextInput
              placeholder="Tìm khách hàng (tên, SĐT, mã)..."
              value={customerSearch}
              onChange={setCustomerSearch}
              className="h-8 text-sm flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              title="Thêm khách hàng mới"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Khách lẻ" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50 max-h-60">
              <SelectItem value="walk-in">Khách lẻ</SelectItem>
              {filteredCustomers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {customer.phone || customer.code}
                      {customer.loyalty_points > 0 && ` • ${customer.loyalty_points} điểm`}
                    </span>
                  </div>
                </SelectItem>
              ))}
              {filteredCustomers.length === 0 && customerSearch && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  Không tìm thấy khách hàng
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Giỏ hàng trống</p>
              <p className="text-sm">Nhấn vào sản phẩm để thêm</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 p-3 bg-secondary/30 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate text-foreground">
                    {item.product.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {item.product.sku}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItemPrice(item.product.id, Number(e.target.value))
                      }
                      className="w-24 h-7 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">đ/sp</span>
                  </div>
                  {item.unit_price > 0 && item.product.cost_price > 0 && item.unit_price < item.product.cost_price && (
                    <p className="text-[10px] text-amber-500 font-medium mt-1">
                      Giá bán thấp hơn giá vốn ({item.product.cost_price.toLocaleString("vi-VN")}đ)
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <POSQuantityInput
                      value={item.quantity}
                      maxStock={item.product.stock_quantity || 0}
                      isService={item.product.is_service === true}
                      onChange={(newVal) => updateQuantity(item.product.id, newVal)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="font-semibold text-sm text-primary">
                    {(item.quantity * item.unit_price).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Cart Footer */}
      <div className="p-4 border-t border-border space-y-3 bg-secondary/20">
        {/* Discount & Shipping */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
              <span>Giảm giá</span>
              {appliedPromoName && (
                <span className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 font-semibold px-1.5 py-0.5 rounded leading-none">
                  Tự động: {appliedPromoName}
                </span>
              )}
            </label>
            <POSNumberInput
              value={discount}
              onChange={handleDiscountChange}
              className="h-9"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Phí ship</label>
            <POSNumberInput
              value={shippingFee}
              onChange={setShippingFee}
              className="h-9"
              placeholder="0"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-muted-foreground">Ghi chú</label>
          <POSTextInput
            value={notes}
            onChange={setNotes}
            className="h-9"
            placeholder="Ghi chú đơn hàng..."
          />
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Tạm tính</span>
            <span>{subtotal.toLocaleString("vi-VN")}đ</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Giảm giá</span>
              <span className="text-destructive">-{discount.toLocaleString("vi-VN")}đ</span>
            </div>
          )}
          {shippingFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Phí ship</span>
              <span>+{shippingFee.toLocaleString("vi-VN")}đ</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-foreground pt-2">
            <span>Tổng cộng</span>
            <span className="text-primary">{total.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>

        {/* Checkout Buttons */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-12 text-xs"
              disabled={cart.length === 0 || isProcessing}
              onClick={() => handleCheckout("cash")}
            >
              <Banknote className="h-4 w-4 mr-2" />
              Tiền mặt
            </Button>
            <Button
              className="h-12 text-xs"
              disabled={cart.length === 0 || isProcessing}
              onClick={() => handleCheckout("bank")}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Chuyển khoản
            </Button>
          </div>
          
          {customerMembership && (
            <Button
              variant="secondary"
              className={cn(
                "w-full h-12 text-xs border flex items-center justify-between px-4 transition-all",
                customerMembership.balance >= total
                  ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border-amber-500/20"
                  : "bg-muted text-muted-foreground border-transparent cursor-not-allowed opacity-50"
              )}
              disabled={cart.length === 0 || isProcessing || customerMembership.balance < total}
              onClick={() => handleCheckout("membership_wallet")}
            >
              <span className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-600" />
                <span>Thanh toán Ví thẻ ({customerMembership.card_number})</span>
              </span>
              <span className="font-bold">
                Ví: {customerMembership.balance.toLocaleString("vi-VN")}đ
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (productsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-56px)] lg:h-screen">
        {/* Left Side - Products */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm sản phẩm theo tên hoặc mã SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-40 bg-background">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "Tất cả" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group",
                    (product.stock_quantity || 0) < 1 && "opacity-50"
                  )}
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-2 sm:p-3">
                    <div className="aspect-square bg-secondary/50 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 sm:h-8 w-6 sm:w-8 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-medium text-xs sm:text-sm truncate text-foreground group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-1 hidden sm:block">
                      {product.sku}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-primary">
                        {Number(product.selling_price || 0).toLocaleString("vi-VN")}đ
                      </span>
                      <Badge
                        variant={
                          (product.stock_quantity || 0) > (product.min_stock || 0)
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {product.stock_quantity || 0}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Không tìm thấy sản phẩm
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side - Cart (Desktop) */}
        <div className="hidden lg:flex w-[420px] border-l border-border flex-col bg-card">
          <CartContent />
        </div>

        {/* Mobile Cart Button */}
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger asChild>
            <Button
              className="lg:hidden fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-40"
              size="icon"
            >
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {cart.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[400px] p-0">
            <CartContent />
          </SheetContent>
        </Sheet>
        <PartnerDialog
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
          onSubmit={handleQuickAddCustomerSubmit}
          isLoading={createPartner.isPending}
          defaultType="customer"
          isQuickAdd={true}
        />
      </div>
    </MainLayout>
  );
};

export default POS;
