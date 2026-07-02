import { useState, useMemo, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
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
  Coins,
  Store,
  Percent,
  FileSearch,
  BarChart3,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { usePartners } from "@/hooks/usePartners";
import { useSalesChannels } from "@/hooks/useSalesChannels";
import { useOrders } from "@/hooks/useOrders";
import { useMemberships, TIER_LABELS, STATUS_LABELS } from "@/hooks/useMemberships";
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
  id?: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
}

const POSNumberInput: React.FC<POSNumberInputProps> = ({
  id,
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
      id={id}
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
  const { memberships, tierConfigs = [], performTransaction } = useMemberships();
  const { vouchers, applyVoucher } = useVouchers();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Multi-tab POS State
  interface POSTab {
    id: string;
    name: string;
    cart: CartItem[];
    discount: number;
    shippingFee: number;
    notes: string;
    selectedCustomer: string;
    customerSearch: string;
    selectedChannel: string;
    selectedWarehouse: string;
    appliedPromoName: string | null;
    appliedVoucherId: string | null;
    isManualDiscount: boolean;
    customSelectedCardId: string;
    tenderedAmount: number;
  }

  const [tabs, setTabs] = useState<POSTab[]>([
    {
      id: "tab-default",
      name: "Đơn 1",
      cart: [],
      discount: 0,
      shippingFee: 0,
      notes: "",
      selectedCustomer: "walk-in",
      customerSearch: "",
      selectedChannel: "",
      selectedWarehouse: "",
      appliedPromoName: null,
      appliedVoucherId: null,
      isManualDiscount: false,
      customSelectedCardId: "",
      tenderedAmount: 0,
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("tab-default");

  const activeTab = useMemo(() => {
    return tabs.find(t => t.id === activeTabId) || tabs[0];
  }, [tabs, activeTabId]);

  // Tab State Getters
  const cart = activeTab.cart;
  const discount = activeTab.discount;
  const shippingFee = activeTab.shippingFee;
  const notes = activeTab.notes;
  const selectedCustomer = activeTab.selectedCustomer;
  const customerSearch = activeTab.customerSearch;
  const selectedChannel = activeTab.selectedChannel;
  const selectedWarehouse = activeTab.selectedWarehouse;
  const appliedPromoName = activeTab.appliedPromoName;
  const appliedVoucherId = activeTab.appliedVoucherId;
  const isManualDiscount = activeTab.isManualDiscount;
  const customSelectedCardId = activeTab.customSelectedCardId;
  const tenderedAmount = activeTab.tenderedAmount;

  // Tab State Setters
  const updateActiveTab = (updates: Partial<POSTab>) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t));
  };

  const setCart = (newCart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    if (typeof newCart === "function") {
      updateActiveTab({ cart: newCart(activeTab.cart) });
    } else {
      updateActiveTab({ cart: newCart });
    }
  };

  const setSelectedCustomer = (val: string) => updateActiveTab({ selectedCustomer: val });
  const setCustomerSearch = (val: string) => updateActiveTab({ customerSearch: val });
  const setSelectedChannel = (val: string) => updateActiveTab({ selectedChannel: val });
  const setSelectedWarehouse = (val: string) => updateActiveTab({ selectedWarehouse: val });
  const setDiscount = (val: number | ((prev: number) => number)) => {
    if (typeof val === "function") {
      updateActiveTab({ discount: val(activeTab.discount) });
    } else {
      updateActiveTab({ discount: val });
    }
  };
  const setShippingFee = (val: number) => updateActiveTab({ shippingFee: val });
  const setNotes = (val: string) => updateActiveTab({ notes: val });
  const setAppliedPromoName = (val: string | null) => updateActiveTab({ appliedPromoName: val });
  const setAppliedVoucherId = (val: string | null) => updateActiveTab({ appliedVoucherId: val });
  const setIsManualDiscount = (val: boolean) => updateActiveTab({ isManualDiscount: val });
  const setCustomSelectedCardId = (val: string) => updateActiveTab({ customSelectedCardId: val });
  const setTenderedAmount = (val: number) => updateActiveTab({ tenderedAmount: val });

  const addTab = () => {
    const nextNum = tabs.length > 0 
      ? Math.max(...tabs.map(t => {
          const num = parseInt(t.name.replace("Đơn ", ""));
          return isNaN(num) ? 0 : num;
        })) + 1 
      : 1;
    const newTab: POSTab = {
      id: `tab-${Date.now()}`,
      name: `Đơn ${nextNum}`,
      cart: [],
      discount: 0,
      shippingFee: 0,
      notes: "",
      selectedCustomer: "walk-in",
      customerSearch: "",
      selectedChannel: selectedChannel || "",
      selectedWarehouse: selectedWarehouse || "",
      appliedPromoName: null,
      appliedVoucherId: null,
      isManualDiscount: false,
      customSelectedCardId: "",
      tenderedAmount: 0,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      setTabs([{
        id: "tab-default",
        name: "Đơn 1",
        cart: [],
        discount: 0,
        shippingFee: 0,
        notes: "",
        selectedCustomer: "walk-in",
        customerSearch: "",
        selectedChannel: selectedChannel || "",
        selectedWarehouse: selectedWarehouse || "",
        appliedPromoName: null,
        appliedVoucherId: null,
        isManualDiscount: false,
        customSelectedCardId: "",
        tenderedAmount: 0,
      }]);
      setActiveTabId("tab-default");
      return;
    }
    const index = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId) {
      const nextActiveIndex = Math.max(0, index - 1);
      setActiveTabId(newTabs[nextActiveIndex]?.id || "tab-default");
    }
  };

  // Keyboard shortcuts event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F3") {
        e.preventDefault();
        const searchInput = document.getElementById("pos-product-search");
        if (searchInput) searchInput.focus();
      }
      if (e.key === "F2") {
        e.preventDefault();
        const tenderedInput = document.getElementById("pos-tendered-amount");
        if (tenderedInput) tenderedInput.focus();
      }
      if (e.key === "F6") {
        e.preventDefault();
        const discountInput = document.getElementById("pos-discount-input");
        if (discountInput) discountInput.focus();
      }
      if (e.key === "F1") {
        e.preventDefault();
        handleCheckout("cash");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, discount, shippingFee, notes, selectedCustomer, selectedWarehouse, selectedChannel, tabs, activeTabId]);

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

  const customerMemberships = useMemo(() => {
    if (!selectedCustomer || selectedCustomer === "walk-in") return [];
    return memberships.filter(m => m.partner_id === selectedCustomer);
  }, [selectedCustomer, memberships]);

  const defaultCard = useMemo(() => {
    if (customerMemberships.length === 0) return null;
    // Find first active card with sufficient balance
    const activeWithBalance = customerMemberships.find(m => m.status === "active" && m.balance >= total);
    if (activeWithBalance) return activeWithBalance;
    // Fallback to first active card
    const firstActive = customerMemberships.find(m => m.status === "active");
    if (firstActive) return firstActive;
    // Fallback to first card
    return customerMemberships[0];
  }, [customerMemberships, total]);

  const customerMembership = useMemo(() => {
    if (customSelectedCardId) {
      const found = customerMemberships.find(m => m.id === customSelectedCardId);
      if (found) return found;
    }
    return defaultCard;
  }, [customerMemberships, customSelectedCardId, defaultCard]);

  useEffect(() => {
    setCustomSelectedCardId("");
  }, [selectedCustomer]);

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

  const renderPaymentPanel = () => {
    const customer = selectedCustomer && selectedCustomer !== "walk-in"
      ? customers.find((c) => c.id === selectedCustomer)
      : null;

    const customerMemberships = selectedCustomer && selectedCustomer !== "walk-in"
      ? memberships.filter(m => m.partner_id === selectedCustomer)
      : [];

    const defaultCard = customerMemberships.length > 0
      ? (customerMemberships.find(m => m.status === "active" && m.balance >= total) ||
         customerMemberships.find(m => m.status === "active") ||
         customerMemberships[0])
      : null;

    const customerMembership = customSelectedCardId
      ? customerMemberships.find(m => m.id === customSelectedCardId)
      : defaultCard;

    const suggestedAmounts = getSuggestedAmounts(total);

    return (
      <div className="flex flex-col h-full bg-card">
        {/* Customer Selection */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="h-4 w-4 text-primary" />
              <span>Khách hàng</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleSimulateQRScan}
              className="h-7 text-xs text-primary gap-1 px-1.5 hover:bg-primary/10 cursor-pointer"
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
                className="h-9 text-xs flex-1 bg-background"
              />
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => setQuickAddOpen(true)}
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                title="Thêm khách hàng mới"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="bg-background h-9 text-xs">
                <SelectValue placeholder="Khách lẻ" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-60">
                <SelectItem value="walk-in">Khách lẻ</SelectItem>
                {filteredCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex flex-col text-left">
                      <span className="font-medium text-xs">{customer.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {customer.phone || customer.code}
                        {customer.loyalty_points > 0 && ` • ${customer.loyalty_points} điểm`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Channels & Warehouse */}
        <div className="p-4 border-b border-border space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Thiết lập xuất hàng</label>
          <div className="grid grid-cols-2 gap-2">
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="bg-background h-9 text-xs">
                <SelectValue placeholder="Kênh bán hàng *" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    <span className="text-xs">{channel.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className={cn(
                "bg-background h-9 text-xs",
                warehouseAnalysis.all_available ? "border-green-500" : warehouseAnalysis.issues.length > 0 ? "border-orange-500" : ""
              )}>
                <SelectValue placeholder="Kho xuất" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {warehouses.filter(w => w.is_active).map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    <span className="text-xs">{warehouse.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stock Status Indicator */}
          {cart.length > 0 && (
            <div className="mt-2">
              {warehouseAnalysis.all_available ? (
                <div className="flex items-center gap-1.5 text-green-600 text-[11px] font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Đủ hàng tại {warehouseAnalysis.warehouse_name}</span>
                </div>
              ) : warehouseAnalysis.issues.length > 0 && (
                <div className="p-2.5 rounded-lg border border-warning/35 bg-warning/5 text-warning backdrop-blur-sm space-y-1 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3 animate-pulse" />
                    <span>Thiếu tồn kho:</span>
                  </div>
                  <div className="text-[10px] font-medium pl-4 space-y-0.5">
                    {warehouseAnalysis.issues.map(issue => {
                      const prodName = cart.find(item => item.product.id === issue.product_id)?.product.name || issue.product_name;
                      return (
                        <div key={issue.product_id} className="flex justify-between items-center">
                          <span className="truncate max-w-[150px]">{prodName}</span>
                          <span className="font-semibold text-destructive">Thiếu {issue.shortage}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pricing & Checkout */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Discount & Shipping */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 flex-wrap mb-1">
                <span>Chiết khấu (F6)</span>
                {appliedPromoName && (
                  <span className="text-[9px] bg-green-500/10 text-green-600 font-semibold px-1 rounded">
                    {appliedPromoName}
                  </span>
                )}
              </label>
              <POSNumberInput
                id="pos-discount-input"
                value={discount}
                onChange={handleDiscountChange}
                className="h-9 text-xs bg-background"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium mb-1 block">Phí vận chuyển</label>
              <POSNumberInput
                value={shippingFee}
                onChange={setShippingFee}
                className="h-9 text-xs bg-background"
                placeholder="0"
              />
            </div>
          </div>

          {/* Bill Totals */}
          <div className="p-3 bg-secondary/20 rounded-lg space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Tạm tính ({cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
              <span>{subtotal.toLocaleString("vi-VN")}đ</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Giảm giá</span>
                <span className="text-destructive font-medium">-{discount.toLocaleString("vi-VN")}đ</span>
              </div>
            )}
            {shippingFee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Phí vận chuyển</span>
                <span>+{shippingFee.toLocaleString("vi-VN")}đ</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between text-base font-bold text-foreground">
              <span>Khách phải trả</span>
              <span className="text-primary">{total.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>

          {/* Tendered Amount (Tiền khách đưa) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Banknote className="h-3.5 w-3.5 text-primary" />
                <span>Tiền khách đưa (F2)</span>
              </label>
              <span className="text-[11px] text-muted-foreground font-medium">
                Thừa: <strong className="text-green-600">{(Math.max(0, (tenderedAmount || 0) - total)).toLocaleString("vi-VN")}đ</strong>
              </span>
            </div>
            <POSNumberInput
              id="pos-tendered-amount"
              value={tenderedAmount || 0}
              onChange={setTenderedAmount}
              className="h-9 text-sm font-semibold bg-background"
              placeholder="Nhập số tiền khách đưa..."
            />

            {/* Quick cash suggestions */}
            {suggestedAmounts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestedAmounts.map((amt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] font-medium px-2 py-0 cursor-pointer"
                    onClick={() => setTenderedAmount(amt)}
                  >
                    {amt.toLocaleString("vi-VN")}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Ghi chú đơn hàng */}
          <div>
            <label className="text-[11px] text-muted-foreground font-medium mb-1 block">Ghi chú đơn</label>
            <POSTextInput
              value={notes}
              onChange={setNotes}
              className="h-9 text-xs bg-background"
              placeholder="Ghi chú đơn hàng..."
            />
          </div>

          {/* Checkout actions */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-11 text-xs border-primary/20 hover:bg-primary/5 cursor-pointer"
                disabled={cart.length === 0 || isProcessing}
                onClick={() => handleCheckout("cash")}
              >
                <Banknote className="h-4 w-4 mr-1.5 text-green-600" />
                Tiền mặt
              </Button>
              <Button
                className="h-11 text-xs cursor-pointer"
                disabled={cart.length === 0 || isProcessing}
                onClick={() => handleCheckout("bank")}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-1.5 text-blue-400" />
                )}
                Chuyển khoản
              </Button>
            </div>

            {customerMemberships.length > 1 && (
              <div className="space-y-1 mb-2">
                <label className="text-[9px] uppercase font-semibold text-muted-foreground">Chọn thẻ thanh toán ({customerMemberships.length})</label>
                <Select value={customerMembership?.id} onValueChange={(val) => setCustomSelectedCardId(val)}>
                  <SelectTrigger className="h-8 text-[11px]">
                    <SelectValue placeholder="Chọn thẻ..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customerMemberships.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.card_number} ({tierConfigs.find(tc => tc.id === m.tier)?.name || m.tier} - Ví: {m.balance.toLocaleString("vi-VN")}đ)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {customerMembership && (
              <Button
                variant="secondary"
                className={cn(
                  "w-full h-11 text-xs border flex items-center justify-between px-3 transition-all cursor-pointer",
                  customerMembership.balance >= total
                    ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border-amber-500/20"
                    : "bg-muted text-muted-foreground border-transparent cursor-not-allowed opacity-50"
                )}
                disabled={cart.length === 0 || isProcessing || customerMembership.balance < total}
                onClick={() => handleCheckout("membership_wallet")}
              >
                <span className="flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-amber-600 animate-bounce" />
                  <span className="truncate max-w-[120px]">Ví thẻ ({customerMembership.card_number})</span>
                </span>
                <span className="font-bold shrink-0">
                  {customerMembership.balance.toLocaleString("vi-VN")}đ
                </span>
              </Button>
            )}

            <Button
              className="w-full h-12 text-sm font-bold bg-green-600 hover:bg-green-700 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer"
              disabled={cart.length === 0 || isProcessing}
              onClick={() => handleCheckout("cash")}
            >
              <span>Thanh toán (F1)</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const getSuggestedAmounts = (totalVal: number) => {
    if (totalVal <= 0) return [];
    const suggestions = new Set<number>();
    suggestions.add(totalVal);
    
    const roundTo5k = Math.ceil(totalVal / 5000) * 5000;
    const roundTo10k = Math.ceil(totalVal / 10000) * 10000;
    const roundTo50k = Math.ceil(totalVal / 50000) * 50000;
    const roundTo100k = Math.ceil(totalVal / 100000) * 100000;
    
    if (roundTo5k > totalVal) suggestions.add(roundTo5k);
    if (roundTo10k > totalVal) suggestions.add(roundTo10k);
    if (roundTo50k > totalVal) suggestions.add(roundTo50k);
    if (roundTo100k > totalVal) suggestions.add(roundTo100k);
    
    const bills = [10000, 20000, 50000, 100000, 200000, 500000];
    bills.forEach(bill => {
      if (bill >= totalVal && suggestions.size < 6) {
        suggestions.add(bill);
      }
    });
    
    return Array.from(suggestions).sort((a, b) => a - b).slice(0, 5);
  };

  const [leftTab, setLeftTab] = useState<"quick-actions" | "products">("products");

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
      <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen bg-background overflow-hidden">
        {/* Header POS Chuyên Nghiệp */}
        <header className="h-14 bg-primary text-primary-foreground border-b border-primary/20 flex items-center justify-between px-4 shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Search Barcode */}
            <div className="relative w-80 max-w-md hidden sm:block shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/60" />
              <Input
                id="pos-product-search"
                placeholder="Thêm sản phẩm vào đơn (F3)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-primary-foreground/10 text-white border-primary-foreground/20 placeholder:text-primary-foreground/60 text-xs focus-visible:bg-white focus-visible:text-foreground"
              />
            </div>

            {/* Đa tab Đơn hàng */}
            <div className="flex items-center gap-1.5 ml-2 overflow-x-auto py-1.5 scrollbar-thin">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all border select-none shrink-0 group",
                    tab.id === activeTabId
                      ? "bg-white text-primary border-white shadow-sm"
                      : "bg-primary-foreground/15 text-primary-foreground border-transparent hover:bg-primary-foreground/25"
                  )}
                >
                  <span>{tab.name}</span>
                  {tab.cart.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 py-0 min-w-[16px] text-[9px] flex items-center justify-center shrink-0">
                      {tab.cart.reduce((s, i) => s + i.quantity, 0)}
                    </Badge>
                  )}
                  <button
                    onClick={(e) => closeTab(tab.id, e)}
                    className="ml-1 p-0.5 rounded-full hover:bg-destructive/10 text-[10px] shrink-0 opacity-40 group-hover:opacity-100 hover:text-destructive transition-all"
                    title="Đóng đơn"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="icon"
                onClick={addTab}
                className="h-7 w-7 rounded-md text-primary-foreground hover:bg-primary-foreground/10 shrink-0"
                title="Mở thêm đơn hàng mới"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-primary-foreground/80 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1">
              <Store className="h-3.5 w-3.5" /> Kho: {warehouses.find(w => w.id === selectedWarehouse)?.name || "Mặc định"}
            </span>
            <span className="hidden lg:inline bg-primary-foreground/10 px-2 py-1 rounded border border-primary-foreground/15 text-[10px] tracking-wider uppercase">
              F3: Tìm kiếm • F2: Tiền khách • F1: Thanh toán
            </span>
          </div>
        </header>

        {/* Body chính POS */}
        <div className="flex-1 flex min-h-0">
          {/* Cột trái (72%): Giỏ hàng và Grid sản phẩm / Phím tắt */}
          <div className="flex-[72] flex flex-col min-w-0 border-r border-border">
            {/* 1. Phần trên: Bảng giỏ hàng ngang (Table) */}
            <div className="flex-[60] flex flex-col min-h-[250px] p-4 bg-background border-b border-border overflow-hidden">
              <ScrollArea className="flex-1">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <ShoppingCart className="h-16 w-16 mb-4 text-muted-foreground/30 stroke-[1.5]" />
                    <p className="font-semibold text-sm">Đơn hàng hiện chưa có sản phẩm nào</p>
                    <p className="text-xs">Quét mã barcode hoặc chọn nhanh ở danh mục bên dưới</p>
                  </div>
                ) : (
                  <div className="min-w-[700px]">
                    <Table>
                      <TableHeader className="bg-secondary/40 sticky top-0 z-10">
                        <TableRow className="h-9">
                          <TableHead className="w-12 text-center text-xs">STT</TableHead>
                          <TableHead className="w-14 text-xs"></TableHead>
                          <TableHead className="w-24 text-xs">Mã SKU</TableHead>
                          <TableHead className="text-xs">Tên sản phẩm</TableHead>
                          <TableHead className="w-28 text-center text-xs">Số lượng</TableHead>
                          <TableHead className="w-28 text-right text-xs">Đơn giá</TableHead>
                          <TableHead className="w-28 text-right text-xs">Thành tiền</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item, idx) => (
                          <TableRow key={item.product.id} className="hover:bg-secondary/10 group h-12">
                            <TableCell className="text-center font-medium text-xs">{idx + 1}</TableCell>
                            <TableCell className="p-1">
                              <div className="w-9 h-9 bg-secondary/50 rounded flex items-center justify-center overflow-hidden">
                                {item.product.image_url ? (
                                  <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-muted-foreground truncate">{item.product.sku}</TableCell>
                            <TableCell>
                              <div className="font-semibold text-xs text-foreground truncate max-w-[220px]" title={item.product.name}>
                                {item.product.name}
                              </div>
                              {item.unit_price > 0 && item.product.cost_price > 0 && item.unit_price < item.product.cost_price && (
                                <span className="text-[9px] bg-red-100 text-red-700 font-semibold px-1 rounded inline-block mt-0.5 leading-none">
                                  Bán dưới vốn: {item.product.cost_price.toLocaleString("vi-VN")}đ
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                >
                                  <Minus className="h-2.5 w-2.5" />
                                </Button>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  className="w-10 h-6 text-center text-xs border rounded bg-background"
                                  onChange={(e) => updateQuantity(item.product.id, Number(e.target.value))}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                >
                                  <Plus className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <input
                                type="number"
                                value={item.unit_price}
                                className="w-20 h-6 text-right text-xs border rounded bg-background px-1 focus:outline-none focus:border-primary"
                                onChange={(e) => updateItemPrice(item.product.id, Number(e.target.value))}
                              />
                            </TableCell>
                            <TableCell className="text-right font-bold text-xs text-primary">
                              {(item.quantity * item.unit_price).toLocaleString("vi-VN")}đ
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-40 group-hover:opacity-100 transition-all"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* 2. Phần dưới: Tabs điều khiển & Grid sản phẩm */}
            <div className="flex-[40] flex flex-col p-4 bg-secondary/10 overflow-hidden">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex bg-muted p-0.5 rounded-md border text-xs">
                  <button
                    onClick={() => setLeftTab("products")}
                    className={cn(
                      "px-3 py-1 rounded font-semibold transition-all cursor-pointer",
                      leftTab === "products" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    Danh sách sản phẩm
                  </button>
                  <button
                    onClick={() => setLeftTab("quick-actions")}
                    className={cn(
                      "px-3 py-1 rounded font-semibold transition-all cursor-pointer",
                      leftTab === "quick-actions" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    Thao tác nhanh
                  </button>
                </div>

                {leftTab === "products" && (
                  <div className="flex items-center gap-2">
                    {/* Category quick filter inside tab block */}
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-36 h-8 text-xs bg-background">
                        <SelectValue placeholder="Danh mục" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs">
                            {cat === "all" ? "Tất cả danh mục" : cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {leftTab === "products" ? (
                <ScrollArea className="flex-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow hover:border-primary/50 group border-border bg-card",
                          (product.stock_quantity || 0) < 1 && "opacity-50"
                        )}
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-2 flex flex-col h-full justify-between">
                          <div className="aspect-square bg-secondary/50 rounded flex items-center justify-center overflow-hidden mb-1.5 relative">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                            {(product.stock_quantity || 0) <= (product.min_stock || 0) && (
                              <Badge className="absolute top-1 right-1 text-[9px] px-1 py-0 h-4 bg-destructive hover:bg-destructive/80">
                                Sắp hết hàng
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <h3 className="font-semibold text-[11px] truncate text-foreground group-hover:text-primary transition-colors text-left" title={product.name}>
                              {product.name}
                            </h3>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-primary">
                                {Number(product.selling_price || 0).toLocaleString("vi-VN")}đ
                              </span>
                              <span className="text-muted-foreground">Kho: {product.stock_quantity || 0}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-2">
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1 items-center justify-center text-xs hover:bg-primary/5 hover:border-primary/40 cursor-pointer"
                    onClick={() => {
                      const searchInput = document.getElementById("pos-product-search");
                      if (searchInput) searchInput.focus();
                    }}
                  >
                    <Search className="h-5 w-5 text-primary" />
                    <span>Tìm sản phẩm (F3)</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1 items-center justify-center text-xs hover:bg-primary/5 hover:border-primary/40 cursor-pointer"
                    onClick={() => {
                      const discountInput = document.getElementById("pos-discount-input");
                      if (discountInput) discountInput.focus();
                    }}
                  >
                    <Percent className="h-5 w-5 text-orange-500" />
                    <span>Chiết khấu đơn (F6)</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1 items-center justify-center text-xs hover:bg-primary/5 hover:border-primary/40 cursor-pointer"
                    onClick={handleSimulateQRScan}
                  >
                    <QrCode className="h-5 w-5 text-indigo-500" />
                    <span>Quét VIP Member</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1 items-center justify-center text-xs text-destructive border-destructive/20 hover:bg-destructive/5 hover:border-destructive/40 cursor-pointer"
                    onClick={clearCart}
                  >
                    <Trash2 className="h-5 w-5" />
                    <span>Xóa toàn bộ sản phẩm</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1 items-center justify-center text-xs hover:bg-primary/5 hover:border-primary/40 cursor-pointer"
                    asChild
                  >
                    <Link to="/orders">
                      <FileSearch className="h-5 w-5 text-blue-500" />
                      <span>Xem danh sách đơn</span>
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1 items-center justify-center text-xs hover:bg-primary/5 hover:border-primary/40 cursor-pointer"
                    asChild
                  >
                    <Link to="/reports">
                      <BarChart3 className="h-5 w-5 text-success" />
                      <span>Xem báo cáo</span>
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1 items-center justify-center text-xs hover:bg-primary/5 hover:border-primary/40 cursor-pointer"
                    asChild
                  >
                    <Link to="/settings">
                      <Settings className="h-5 w-5 text-muted-foreground" />
                      <span>Thiết lập chung</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải (28%): Panel thanh toán thông minh */}
          <div className="flex-[28] hidden lg:block bg-card shrink-0 shadow-lg relative z-20">
            {renderPaymentPanel()}
          </div>
        </div>

        {/* Mobile Cart Sheet Trigger */}
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger asChild>
            <Button
              className="lg:hidden fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-40 cursor-pointer bg-primary text-white"
              size="icon"
            >
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold bg-destructive text-white animate-bounce">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[400px] p-0 z-50">
            <SheetHeader className="p-4 border-b shrink-0 bg-primary text-primary-foreground flex flex-row items-center justify-between">
              <SheetTitle className="text-white text-sm font-bold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Chi tiết đơn {activeTab.name}
              </SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100vh-56px)]">
              {renderPaymentPanel()}
            </div>
          </SheetContent>
        </Sheet>

        {/* Dialog Add Customer */}
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
