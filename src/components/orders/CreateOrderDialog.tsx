import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useShippingCarriers } from "@/hooks/useShippingCarriers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2, Plus, Trash2, Ticket, Check, X, Truck, AlertTriangle,
  Warehouse, CheckCircle2, Info, ScanBarcode, Search, Store, Globe,
  User, ShoppingCart, CreditCard, FileText, Package, Scale, Sparkles, Tv
} from "lucide-react";
import { useSalesChannels } from "@/hooks/useSalesChannels";
import { useProducts } from "@/hooks/useProducts";
import { usePartners } from "@/hooks/usePartners";
import { useVouchers, type Voucher } from "@/hooks/useVouchers";
import { useShippingZones } from "@/hooks/useShippingZones";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useWarehouseStock } from "@/hooks/useWarehouseStock";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { normalizePhone } from "@/lib/orderControl";
import { useToast } from "@/hooks/use-toast";
import { validateOrderPayload } from "@/lib/validation";
import type { Tables } from "@/integrations/supabase/types";
import { useProductVariants } from "@/hooks/useProductVariants";
import { useWholesaleSettings } from "@/hooks/useWholesaleSettings";
import { applyWholesalePricing, calculateCompositeVariantStock } from "@/lib/wholesaleControl";
import { POSVariantSelectDialog } from "@/components/pos/POSVariantSelectDialog";

type Product = Tables<"products">;

interface OrderItem {
  product_id: string;
  product?: Product;
  variant?: any | null;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  is_upsale?: boolean;
  is_wholesale?: boolean;
}

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{title}</h3>
    </div>
  );
}

export function CreateOrderDialog({ open, onOpenChange, onSubmit, isLoading }: CreateOrderDialogProps) {
  const { channels } = useSalesChannels();
  const { products } = useProducts();
  const { customers } = usePartners();
  const { vouchers, validateVoucher } = useVouchers();
  const { shippingZones } = useShippingZones();
  const { warehouses } = useWarehouses();
  const { autoSelectWarehouse, checkStockAvailability } = useWarehouseStock();
  const { members } = useCompanyMembers();
  const { toast } = useToast();

  const [autoSendToCarrier, setAutoSendToCarrier] = useState(false);
  const [selectedCarrierId, setSelectedCarrierId] = useState("");
  const { carriers } = useShippingCarriers();

  useEffect(() => {
    if (carriers && carriers.length > 0 && !selectedCarrierId) {
      setSelectedCarrierId(carriers[0].id);
    }
  }, [carriers, selectedCarrierId]);

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
    fulfillment_type: "online" as "online" | "at_counter",
    assigned_to_name: "",
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
    tags: [] as string[],
    shipping_zone_id: "",
    warehouse_id: "",
  });

  const [items, setItems] = useState<OrderItem[]>([]);

  // Product search
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);

  // Barcode input
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState("");
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [referrerCode, setReferrerCode] = useState("");
  const [appliedReferrer, setAppliedReferrer] = useState<any>(null);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [referrerError, setReferrerError] = useState("");
  const [isValidatingReferrer, setIsValidatingReferrer] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        channel_id: "",
        partner_id: "",
        order_type: "b2c",
        fulfillment_type: "online",
        assigned_to_name: "",
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
        tags: [],
        shipping_zone_id: "",
        warehouse_id: "",
      });
      setItems([]);
      setVoucherCode("");
      setAppliedVoucher(null);
      setVoucherDiscount(0);
      setVoucherError("");
      setProductSearchQuery("");
      setShowOnlyInStock(false);
      setBarcodeInput("");
      setUsePoints(false);
      setPointsToUse(0);
      setReferrerCode("");
      setAppliedReferrer(null);
      setReferralDiscount(0);
      setReferrerError("");
      setScaleWeight(1.0);
      setScaleConnected(false);
      setScaleOpen(false);
    }
  }, [open]);

  const [scaleWeight, setScaleWeight] = useState<number>(1.0);
  const [scaleConnected, setScaleConnected] = useState<boolean>(false);
  const [scaleOpen, setScaleOpen] = useState<boolean>(false);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  // Get shipping fee
  const selectedZone = shippingZones.find(z => z.id === formData.shipping_zone_id);
  const shippingFee = formData.fulfillment_type === "at_counter" ? 0
    : selectedZone
      ? (selectedZone.free_shipping_threshold && subtotal >= selectedZone.free_shipping_threshold ? 0 : selectedZone.base_fee)
      : 0;

  const selectedCustomer = customers.find(c => c.id === formData.partner_id);
  const pointDiscount = usePoints ? (pointsToUse * 1000) : 0;
  const grandTotal = Math.max(0, subtotal - voucherDiscount - pointDiscount - referralDiscount + shippingFee);

  useEffect(() => {
    const channel = new BroadcastChannel("erp_customer_display");
    
    const displayItems = items.map(item => ({
      name: item.product?.name || "Sản phẩm",
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total
    }));

    const messagePayload = {
      items: displayItems,
      subtotal,
      voucherDiscount,
      pointsUsed: usePoints ? pointsToUse : 0,
      pointDiscount: usePoints ? (pointsToUse * 1000) : 0,
      referralDiscount,
      total: grandTotal,
      paymentMethod: formData.payment_method
    };

    channel.postMessage(messagePayload);

    const handleRequest = (e: MessageEvent) => {
      if (e.data && e.data.type === "REQUEST_CURRENT_STATE") {
        channel.postMessage(messagePayload);
      }
    };
    channel.addEventListener("message", handleRequest);

    return () => {
      channel.removeEventListener("message", handleRequest);
      channel.close();
    };
  }, [items, subtotal, voucherDiscount, usePoints, pointsToUse, referralDiscount, grandTotal, formData.payment_method]);

  // Wholesale pricing and variants database queries
  const { settings: wholesaleSettings } = useWholesaleSettings();
  const { variants: allVariants = [] } = useProductVariants();

  const { data: allComponents = [] } = useQuery({
    queryKey: ["all-product-variant-components-dialog"],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-product-variant-components");
        return raw ? JSON.parse(raw) : [];
      }
      const { data, error } = await supabase.from("product_variant_components").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: allWholesalePrices = [] } = useQuery({
    queryKey: ["all-product-wholesale-prices-dialog"],
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-product-wholesale-prices");
        return raw ? JSON.parse(raw) : [];
      }
      const { data, error } = await supabase.from("product_wholesale_prices").select("*");
      if (error) throw error;
      return data;
    }
  });

  const [variantSelectOpen, setVariantSelectOpen] = useState(false);
  const [productForVariantSelect, setProductForVariantSelect] = useState<any>(null);
  const [activeItemIndexForVariant, setActiveItemIndexForVariant] = useState<number | null>(null);

  useEffect(() => {
    if (!wholesaleSettings) return;

    const customer = formData.partner_id
      ? customers.find(c => c.id === formData.partner_id)
      : null;

    const { updatedCart, hasWholesaleApplied } = applyWholesalePricing(
      items as any,
      customer,
      formData.tags || [],
      wholesaleSettings,
      allWholesalePrices
    );

    const isChanged = updatedCart.some((item, idx) => {
      const oldItem = items[idx];
      return !oldItem || 
             oldItem.unit_price !== item.unit_price || 
             oldItem.is_wholesale !== item.is_wholesale ||
             oldItem.variant?.id !== item.variant?.id;
    });

    if (isChanged) {
      setItems(updatedCart.map(item => ({
        ...item,
        total: (item.quantity * item.unit_price) - item.discount
      })) as any);

      if (wholesaleSettings.no_other_discounts && hasWholesaleApplied) {
        if (voucherDiscount > 0 || appliedVoucher) {
          setAppliedVoucher(null);
          setVoucherDiscount(0);
          setVoucherCode("");
          toast({
            title: "Áp dụng giá bán sỉ",
            description: "Đơn hàng đã được áp giá bán sỉ. Các mã giảm giá/voucher khác đã bị vô hiệu hóa.",
          });
        }
      }
    }
  }, [items, formData.partner_id, formData.tags, wholesaleSettings, allWholesalePrices]);

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

  // Filtered products list
  const filteredProducts = useMemo(() => {
    let list = products;
    if (productSearchQuery.trim()) {
      const q = productSearchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    if (showOnlyInStock) {
      list = list.filter(p => (p.stock_quantity ?? 0) > 0);
    }
    return list;
  }, [products, productSearchQuery, showOnlyInStock]);

  // Staff list
  const staffList = useMemo(() => {
    return members.map(m => ({
      id: m.id,
      name: m.profile?.full_name || m.email || "Nhân viên",
    }));
  }, [members]);

  const addItem = () => {
    setItems([...items, { product_id: "", variant: null, quantity: 1, unit_price: 0, discount: 0, total: 0, is_upsale: false }]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].product = product;
        newItems[index].variant = null;
        newItems[index].unit_price = Number(product.selling_price) || 0;

        if (product.has_variants) {
          setProductForVariantSelect(product);
          setActiveItemIndexForVariant(index);
          setVariantSelectOpen(true);
        }
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

  const handleVariantSelect = (variant: any) => {
    if (activeItemIndexForVariant === null || !productForVariantSelect) return;
    const newItems = [...items];
    newItems[activeItemIndexForVariant] = {
      ...newItems[activeItemIndexForVariant],
      product_id: productForVariantSelect.id,
      product: productForVariantSelect,
      variant: variant,
      unit_price: Number(variant.selling_price) || 0,
      total: (newItems[activeItemIndexForVariant].quantity * Number(variant.selling_price)) - newItems[activeItemIndexForVariant].discount
    };
    setItems(newItems);
    setVariantSelectOpen(false);
    setActiveItemIndexForVariant(null);
    setProductForVariantSelect(null);
  };

  // Barcode handler
  const handleBarcodeSubmit = () => {
    if (!barcodeInput.trim()) return;
    const q = barcodeInput.trim().toLowerCase();
    const found = products.find(p =>
      (p.sku && p.sku.toLowerCase() === q) ||
      ((p as any).barcode && (p as any).barcode.toLowerCase() === q) ||
      p.id === q
    );
    if (found) {
      if (found.has_variants) {
        setProductForVariantSelect(found);
        setActiveItemIndexForVariant(items.length);
        setVariantSelectOpen(true);
        setItems([...items, { product_id: found.id, product: found, quantity: 1, unit_price: Number(found.selling_price) || 0, discount: 0, total: Number(found.selling_price) || 0, is_upsale: false }]);
      } else {
        const existingIdx = items.findIndex(i => i.product_id === found.id && !i.variant);
        if (existingIdx >= 0) {
          const newItems = [...items];
          newItems[existingIdx].quantity += 1;
          newItems[existingIdx].total = newItems[existingIdx].quantity * newItems[existingIdx].unit_price - newItems[existingIdx].discount;
          setItems(newItems);
          toast({ title: `+1 ${found.name}`, description: `Số lượng: ${newItems[existingIdx].quantity}` });
        } else {
          const newItem: OrderItem = {
            product_id: found.id,
            product: found,
            quantity: 1,
            unit_price: Number(found.selling_price) || 0,
            discount: 0,
            total: Number(found.selling_price) || 0,
            is_upsale: false,
          };
          setItems([...items, newItem]);
          toast({ title: `Đã thêm: ${found.name}`, description: `SKU: ${found.sku}` });
        }
      }
      setBarcodeInput("");
      barcodeRef.current?.focus();
    } else {
      toast({ title: "Không tìm thấy", description: `Mã "${barcodeInput}" không khớp sản phẩm nào.`, variant: "destructive" });
    }
  };

  const suggestedProducts = useMemo(() => {
    if (!products) return [];
    const selectedIds = new Set(items.map(item => item.product_id));
    return products
      .filter(p => !selectedIds.has(p.id) && (p.stock_quantity ?? 0) > 0)
      .slice(0, 5);
  }, [products, items]);

  const addSuggestedProduct = (product: Product) => {
    if (product.has_variants) {
      setProductForVariantSelect(product);
      setActiveItemIndexForVariant(items.length);
      setVariantSelectOpen(true);
      setItems([...items, { product_id: product.id, product: product, quantity: 1, unit_price: Number(product.selling_price) || 0, discount: 0, total: Number(product.selling_price) || 0, is_upsale: true }]);
    } else {
      const newItem: OrderItem = {
        product_id: product.id,
        product: product,
        quantity: 1,
        unit_price: Number(product.selling_price) || 0,
        discount: 0,
        total: Number(product.selling_price) || 0,
        is_upsale: true,
      };
      setItems([...items, newItem]);
      toast({
        title: "Đã thêm bán kèm",
        description: `Đã thêm sản phẩm gợi ý: ${product.name}`
      });
    }
  };

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

  const handleApplyReferrer = async () => {
    if (!referrerCode.trim()) return;

    setIsValidatingReferrer(true);
    setReferrerError("");

    const code = referrerCode.trim();
    const referrer = customers.find(c => c.code === code || c.phone === code);

    if (!referrer) {
      setReferrerError("Mã giới thiệu không tồn tại trong hệ thống");
      setReferrerDiscount(0);
      setAppliedReferrer(null);
      setIsValidatingReferrer(false);
      return;
    }

    if (referrer.id === formData.partner_id) {
      setReferrerError("Không thể tự áp dụng mã giới thiệu của chính mình");
      setReferrerDiscount(0);
      setAppliedReferrer(null);
      setIsValidatingReferrer(false);
      return;
    }

    const currentCustomer = customers.find(c => c.id === formData.partner_id);
    const ltv = currentCustomer?.total_spent || 0;
    
    if (ltv > 0) {
      setReferrerError("Mã giới thiệu chỉ áp dụng cho đơn hàng đầu tiên của khách mới");
      setReferrerDiscount(0);
      setAppliedReferrer(null);
      setIsValidatingReferrer(false);
      return;
    }

    setAppliedReferrer(referrer);
    setReferrerDiscount(50000); // Giảm 50k
    setReferrerError("");
    setIsValidatingReferrer(false);
  };

  const removeReferrer = () => {
    setAppliedReferrer(null);
    setReferrerDiscount(0);
    setReferrerCode("");
    setReferrerError("");
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

    // Check selling under cost warning
    const hasSellingUnderCost = items.some(item => {
      const prod = products.find(p => p.id === item.product_id);
      return prod && item.unit_price > 0 && prod.cost_price > 0 && item.unit_price < prod.cost_price;
    });
    if (hasSellingUnderCost) {
      const confirmLoss = window.confirm("Cảnh báo: Có sản phẩm trong đơn hàng có giá bán THẤP hơn giá vốn. Bạn có chắc chắn muốn tiếp tục tạo đơn hàng bán lỗ?");
      if (!confirmLoss) {
        return;
      }
    }

    const orderNumber = `ORD-${Date.now()}`;
    const needsApproval = voucherDiscount > 0 || formData.payment_method === "bank";
    const initialStatus = needsApproval ? "pending_approval" : (autoSendToCarrier ? "shipping" : "pending");

    onSubmit({
      order: {
        order_number: orderNumber,
        platform_order_id: autoSendToCarrier
          ? `SHIP-${orderNumber}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
          : (formData.platform_order_id || null),
        channel_id: formData.channel_id,
        partner_id: formData.partner_id || null,
        order_type: formData.order_type,
        source_type: formData.fulfillment_type === "at_counter" ? "pos" : "manual",
        fulfillment_type: formData.fulfillment_type,
        assigned_to_name: formData.assigned_to_name || null,
        customer_name: formData.customer_name || null,
        customer_phone: normalizePhone(formData.customer_phone) || null,
        customer_email: formData.customer_email || null,
        customer_address: formData.customer_address || formData.shipping_address || null,
        shipping_address: formData.fulfillment_type === "at_counter" ? null : (formData.shipping_address || formData.customer_address),
        payment_method: formData.payment_method,
        payment_reference: formData.payment_reference || null,
        priority: formData.priority,
        internal_notes: formData.internal_notes || null,
        warehouse_id: formData.warehouse_id || null,
        shipping_zone_id: formData.fulfillment_type === "at_counter" ? null : (formData.shipping_zone_id || null),
        notes: formData.notes,
        subtotal,
        shipping_fee: shippingFee,
        voucher_id: appliedVoucher?.id || null,
        voucher_discount: voucherDiscount,
        referrer_id: appliedReferrer?.id || null,
        referral_discount: referralDiscount,
        discount: voucherDiscount + pointDiscount + referralDiscount,
        total: grandTotal,
        status: initialStatus,
        used_points: usePoints ? pointsToUse : 0,
        tags: formData.tags || [],
      },
      autoSendToCarrier,
      carrierId: selectedCarrierId,
      items: items.map(({ product_id, variant, quantity, unit_price, discount, total, is_upsale }) => ({
        product_id,
        variant_id: variant?.id || null,
        quantity,
        unit_price,
        discount,
        total,
        is_upsale: !!is_upsale,
      })),
    });
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat("vi-VN").format(v) + "đ";

  const isOnline = formData.fulfillment_type === "online";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] overflow-y-auto bg-white dark:bg-slate-900 shadow-xl rounded-xl animate-fade-in flex flex-col p-6">
        <DialogHeader className="border-b pb-3 flex flex-row items-center justify-between flex-wrap gap-2">
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Tạo đơn hàng mới (POS)
          </DialogTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              window.open("/customer-display", "CustomerDisplay", "width=1024,height=768");
            }}
            className="h-8 text-xs font-semibold gap-1.5 border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-100/50 cursor-pointer"
          >
            <Tv className="h-4 w-4" />
            Mở màn hình phụ (Khách)
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4 pt-4">
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ── LEFT COLUMN: lg:col-span-8 ── */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Product Section */}
              <div className="bg-[#F8FAFC] dark:bg-slate-955 p-4 border rounded-xl shadow-sm space-y-4">
                <SectionHeader icon={Package} title="Sản phẩm" />

                {/* Fulfillment Type Selector (Online / Counter) */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.fulfillment_type === "online" ? "default" : "outline"}
                    className={cn("flex-1 h-10 gap-2 font-bold", formData.fulfillment_type === "online" && "bg-blue-600 hover:bg-blue-700")}
                    onClick={() => setFormData({ ...formData, fulfillment_type: "online", payment_method: "cod" })}
                  >
                    <Globe className="h-4 w-4" /> Bán Online
                  </Button>
                  <Button
                    type="button"
                    variant={formData.fulfillment_type === "at_counter" ? "default" : "outline"}
                    className={cn("flex-1 h-10 gap-2 font-bold", formData.fulfillment_type === "at_counter" && "bg-emerald-600 hover:bg-emerald-700")}
                    onClick={() => setFormData({ ...formData, fulfillment_type: "at_counter", payment_method: "cash" })}
                  >
                    <Store className="h-4 w-4" /> Tại quầy
                  </Button>
                </div>

                {/* Barcode & Search Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={barcodeRef}
                        className="pl-10 bg-background h-9 text-xs"
                        placeholder="Quét mã / nhập SKU rồi nhấn Enter..."
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleBarcodeSubmit(); } }}
                      />
                    </div>
                    <Button type="button" size="sm" variant="secondary" onClick={handleBarcodeSubmit} className="gap-1.5 h-9">
                      <ScanBarcode className="h-4 w-4" /> Quét
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 flex gap-1.5 items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-10 bg-background h-9 text-xs"
                          placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                        />
                      </div>
                      <Popover open={scaleOpen} onOpenChange={setScaleOpen}>
                        <PopoverTrigger asChild>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            className={cn("h-9 w-9 shrink-0 cursor-pointer transition-all", scaleConnected ? "border-emerald-500 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/50" : "text-muted-foreground")}
                            title="Kết nối Cân điện tử RS232"
                          >
                            <Scale className="h-4.5 w-4.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 bg-popover z-[160] border shadow-md space-y-3 font-sans rounded-lg">
                          <div className="flex items-center justify-between border-b pb-1.5">
                            <span className="text-xs font-extrabold flex items-center gap-1.5 text-foreground">
                              <Scale className="h-4 w-4 text-blue-500" />
                              CÂN ĐIỆN TỬ GIẢ LẬP
                            </span>
                            <Badge variant={scaleConnected ? "success" : "secondary"} className="text-[9px] px-1 py-0 font-extrabold uppercase">
                              {scaleConnected ? "COM3 (9600)" : "OFFLINE"}
                            </Badge>
                          </div>
                          
                          {/* Simulated LED Display */}
                          <div className="bg-slate-900 dark:bg-black p-3 rounded-lg border border-slate-800 text-center font-mono relative overflow-hidden select-none">
                            <div className="absolute top-1 left-2 text-[8px] text-slate-500 font-sans">WEIGHT (KG)</div>
                            <span className={cn("text-2xl font-bold tracking-widest", scaleConnected ? "text-emerald-400 animate-pulse" : "text-slate-600")}>
                              {scaleWeight.toFixed(3)}
                            </span>
                          </div>

                          {/* Connection Toggle */}
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-muted-foreground font-semibold">Cổng COM3:</span>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setScaleConnected(!scaleConnected);
                                toast({
                                  title: !scaleConnected ? "Đã kết nối COM3" : "Đã ngắt kết nối cân",
                                  description: !scaleConnected ? "Baudrate 9600. Đã sẵn sàng nhận khối lượng." : "Cân đã offline."
                                });
                              }}
                              className={cn("h-6 text-[10px] px-2.5 font-bold cursor-pointer text-white", scaleConnected ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700")}
                            >
                              {scaleConnected ? "Ngắt" : "Kết nối"}
                            </Button>
                          </div>

                          {/* Weight controls */}
                          {scaleConnected && (
                            <div className="space-y-2 pt-1.5 border-t">
                              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                                <span>Trọng lượng đặt:</span>
                                <span className="font-bold text-foreground">{scaleWeight.toFixed(2)} kg</span>
                              </div>
                              <Slider 
                                value={[scaleWeight]}
                                min={0.05}
                                max={10.0}
                                step={0.05}
                                onValueChange={(val) => setScaleWeight(val[0])}
                                className="py-1 cursor-pointer"
                              />
                              <div className="grid grid-cols-4 gap-1">
                                {[0.5, 1.0, 2.0, 5.0].map((w) => (
                                  <Button
                                    key={w}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setScaleWeight(w)}
                                    className="h-6 text-[9px] p-0 font-bold hover:border-blue-500 cursor-pointer"
                                  >
                                    {w}kg
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer select-none font-medium text-muted-foreground">
                      <Checkbox
                        checked={showOnlyInStock}
                        onCheckedChange={(checked) => setShowOnlyInStock(checked === true)}
                      />
                      Còn hàng
                    </label>
                  </div>
                </div>

                {/* Selected Products Table / List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                    <span>Danh sách sản phẩm ({items.length})</span>
                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs px-2.5">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Thêm dòng
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {items.map((item, index) => {
                      const selectedProd = products.find(p => p.id === item.product_id);
                      const displayStock = item.variant
                        ? calculateCompositeVariantStock(item.variant, allComponents, allVariants)
                        : selectedProd?.stock_quantity ?? 0;

                      return (
                        <div key={index} className="flex flex-col gap-1 p-2 bg-background border rounded-lg shadow-sm animate-fade-in">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-[200px]">
                              <Select
                                value={item.product_id}
                                onValueChange={(value) => updateItem(index, "product_id", value)}
                              >
                                <SelectTrigger className="bg-background h-8 text-xs border-none shadow-none">
                                  <SelectValue placeholder="Chọn sản phẩm" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover z-50 max-h-60">
                                  {filteredProducts.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className={cn(
                                          (product.stock_quantity ?? 0) <= 0 && "text-muted-foreground line-through"
                                        )}>
                                          {product.sku} - {product.name}
                                        </span>
                                        <Badge variant={(product.stock_quantity ?? 0) > 0 ? "secondary" : "destructive"} className="text-[9px] ml-auto">
                                          Tồn: {product.stock_quantity ?? 0}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                className="w-16 h-8 text-xs text-center"
                                placeholder="SL"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                                step="any"
                                min={0.001}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (!scaleConnected) {
                                    toast({
                                      title: "Cân chưa kết nối",
                                      description: "Vui lòng click biểu tượng cái cân bên cạnh ô tìm kiếm sản phẩm để kết nối cân điện tử.",
                                      variant: "destructive"
                                    });
                                    return;
                                  }
                                  updateItem(index, "quantity", Number(scaleWeight.toFixed(3)));
                                  toast({
                                    title: "Đã nhận khối lượng",
                                    description: `Đã nhập ${scaleWeight.toFixed(3)} kg từ Cân điện tử.`
                                  });
                                }}
                                className={cn("h-8 w-8 shrink-0 cursor-pointer", scaleConnected ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted")}
                                title="Lấy khối lượng từ Cân điện tử"
                              >
                                <Scale className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <Input
                              type="number"
                              className="w-24 h-8 text-xs text-right"
                              placeholder="Đơn giá"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, "unit_price", Number(e.target.value))}
                            />
                            <div className="flex items-center gap-1.5 min-w-[70px]">
                              <Checkbox
                                id={`upsale-create-${index}`}
                                checked={!!item.is_upsale}
                                onCheckedChange={(checked) => updateItem(index, "is_upsale", checked === true)}
                              />
                              <Label htmlFor={`upsale-create-${index}`} className="text-[10px] text-muted-foreground select-none cursor-pointer font-semibold">
                                Upsale
                              </Label>
                            </div>
                            <div className="w-24 text-right font-bold text-xs text-foreground pr-2">
                              {item.total.toLocaleString("vi-VN")}đ
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {item.variant && (
                            <div className="text-[10px] text-muted-foreground px-3 font-semibold flex items-center gap-2">
                              Phân loại: {item.variant.name} (Tồn khả dụng: {displayStock})
                              {item.is_wholesale && (
                                <Badge className="text-[8px] h-3.5 px-1 bg-green-100 text-green-700 hover:bg-green-100 border-none font-semibold">
                                  Giá sỉ
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {items.length === 0 && (
                      <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                        Giỏ hàng trống. Nhập mã barcode hoặc chọn sản phẩm để bắt đầu.
                      </div>
                    )}
                  </div>

                  {suggestedProducts.length > 0 && (
                    <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-950 p-2.5 rounded-lg space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-orange-500 animate-pulse" />
                          Gợi ý bán kèm (Cross-sell)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestedProducts.map((p) => (
                          <div 
                            key={p.id} 
                            onClick={() => addSuggestedProduct(p)}
                            className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-slate-900 border border-orange-200/50 dark:border-orange-900/30 rounded-md hover:border-orange-500 hover:shadow-sm cursor-pointer transition-all text-[11px] group"
                          >
                            <span className="font-medium text-foreground truncate max-w-[120px]">{p.name}</span>
                            <span className="font-bold text-orange-600 dark:text-orange-400 shrink-0">
                              {Number(p.selling_price).toLocaleString("vi-VN")}đ
                            </span>
                            <span className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center font-bold text-[10px] group-hover:bg-orange-600 group-hover:text-white transition-colors">
                              +
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Material shortage error alert */}
                  {materialShortages.length > 0 && (
                    <Alert variant="destructive" className="py-2.5">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong className="block mb-1">Cảnh báo: Thiếu nguyên vật liệu (BOM)</strong>
                        <ul className="space-y-0.5">
                          {materialShortages.map((shortage, idx) => (
                            <li key={idx}>
                              • <span className="font-semibold">{shortage.materialName}</span>: Thiếu <span className="font-bold">{shortage.shortage}</span> {shortage.unit}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Warehouse Selection */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                      <Warehouse className="h-3.5 w-3.5" /> Kho xuất hàng
                    </Label>
                    {warehouseAnalysis.warehouse_name && (
                      <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Gợi ý: {warehouseAnalysis.warehouse_name}
                      </span>
                    )}
                  </div>
                  <Select
                    value={formData.warehouse_id}
                    onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
                  >
                    <SelectTrigger className={cn(
                      "bg-background h-9 text-xs",
                      warehouseAnalysis.all_available ? "border-green-500" : warehouseAnalysis.issues.length > 0 ? "border-orange-500" : ""
                    )}>
                      <SelectValue placeholder="Tự động chọn kho có hàng" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {warehouses.filter(w => w.is_active).map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          <div className="flex items-center gap-2 text-xs">
                            <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                            {warehouse.name}
                            {warehouse.is_default && <Badge variant="secondary" className="text-[10px] ml-1.5">Mặc định</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Stock Warnings details */}
                  {items.length > 0 && items.some(i => i.product_id) && warehouseAnalysis.issues.length > 0 && (
                    <div className="text-[11px] bg-orange-50 text-orange-800 p-2.5 rounded-lg border border-orange-200 mt-2 space-y-1">
                      <strong className="block">Cảnh báo thiếu hàng:</strong>
                      {warehouseAnalysis.issues.map(issue => (
                        <div key={issue.product_id}>
                          • {products.find(p => p.id === issue.product_id)?.name}: cần {issue.required}, thiếu {issue.shortage}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment details */}
              <div className="bg-[#F8FAFC] dark:bg-slate-950 p-4 border rounded-xl shadow-sm space-y-3">
                <SectionHeader icon={CreditCard} title="Thanh toán & Chiết khấu" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground font-semibold">Phương thức thanh toán</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                    >
                      <SelectTrigger className="bg-background h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {formData.fulfillment_type === "at_counter" ? (
                          <>
                            <SelectItem value="cash">Tiền mặt</SelectItem>
                            <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                            <SelectItem value="card">Thẻ</SelectItem>
                            <SelectItem value="ewallet">Ví điện tử</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="cod">COD</SelectItem>
                            <SelectItem value="cash">Tiền mặt</SelectItem>
                            <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                            <SelectItem value="card">Thẻ</SelectItem>
                            <SelectItem value="ewallet">Ví điện tử</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground font-semibold">Mã giảm giá</Label>
                    {appliedVoucher ? (
                      <div className="flex items-center justify-between h-8 px-2 bg-green-50 border border-green-200 rounded-md">
                        <span className="text-xs font-bold text-green-700">{appliedVoucher.code} (-{formatCurrency(voucherDiscount)})</span>
                        <button type="button" onClick={removeVoucher} className="text-red-500 hover:text-red-700 font-bold text-xs">×</button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Input
                          placeholder="Nhập mã..."
                          className="h-8 text-xs bg-background"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyVoucher}
                          disabled={isValidatingVoucher || !voucherCode}
                          className="h-8 text-xs px-2.5"
                        >
                          Áp dụng
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground font-semibold">Mã giới thiệu (SĐT/Mã khách cũ)</Label>
                    {appliedReferrer ? (
                      <div className="flex items-center justify-between h-8 px-2 bg-pink-50 border border-pink-200 rounded-md animate-in fade-in zoom-in-95 duration-200">
                        <span className="text-xs font-bold text-pink-700">{appliedReferrer.name} (-50,000đ)</span>
                        <button type="button" onClick={removeReferrer} className="text-red-500 hover:text-red-700 font-bold text-xs">×</button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1">
                          <Input
                            placeholder="Nhập SĐT hoặc Mã khách..."
                            className="h-8 text-xs bg-background"
                            value={referrerCode}
                            onChange={(e) => setReferrerCode(e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleApplyReferrer}
                            disabled={isValidatingReferrer || !referrerCode}
                            className="h-8 text-xs px-2.5"
                          >
                            Áp dụng
                          </Button>
                        </div>
                        {referrerError && (
                          <span className="text-[10px] text-destructive font-medium">{referrerError}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Loyalty Points Redemption Widget */}
                  {selectedCustomer && (selectedCustomer.loyalty_points || 0) > 0 && (
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-900/50 p-2 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                          ✨ Tiêu điểm tích lũy:
                        </Label>
                        <span className="text-[10px] text-indigo-600 font-bold">
                          Có {selectedCustomer.loyalty_points} điểm ({(selectedCustomer.loyalty_points * 1000).toLocaleString()}đ)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="checkbox"
                          id="use-loyalty-points-cb"
                          className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                          checked={usePoints}
                          onChange={(e) => {
                            setUsePoints(e.target.checked);
                            if (e.target.checked) {
                              const maxAffordablePoints = Math.floor((subtotal - voucherDiscount + shippingFee) / 1000);
                              setPointsToUse(Math.min(selectedCustomer.loyalty_points || 0, maxAffordablePoints));
                            } else {
                              setPointsToUse(0);
                            }
                          }}
                        />
                        <label htmlFor="use-loyalty-points-cb" className="text-[10px] font-medium text-foreground cursor-pointer select-none">
                          Sử dụng điểm cho đơn này
                        </label>
                      </div>
                      {usePoints && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Input
                            type="number"
                            min={0}
                            max={selectedCustomer.loyalty_points}
                            value={pointsToUse}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              const maxAffordablePoints = Math.floor((subtotal - voucherDiscount + shippingFee) / 1000);
                              const limit = Math.min(selectedCustomer.loyalty_points || 0, maxAffordablePoints);
                              setPointsToUse(Math.min(val, limit));
                            }}
                            className="h-7 text-xs w-20 px-1.5"
                          />
                          <span className="text-[10px] text-muted-foreground">
                            điểm ➜ Giảm <strong>-{(pointsToUse * 1000).toLocaleString()}đ</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground font-semibold">Vùng vận chuyển</Label>
                    <Select
                      value={formData.shipping_zone_id}
                      onValueChange={(value) => setFormData({ ...formData, shipping_zone_id: value })}
                      disabled={!isOnline}
                    >
                      <SelectTrigger className="bg-background h-8 text-xs">
                        <SelectValue placeholder={isOnline ? "Chọn vùng" : "Không áp dụng"} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {shippingZones.filter(z => z.is_active).map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name} - {formatCurrency(zone.base_fee)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Final receipt calculator list */}
                <div className="bg-background p-3 rounded-lg border text-xs space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính:</span>
                    <span className="font-bold text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Mã giảm giá:</span>
                      <span>-{formatCurrency(voucherDiscount)}</span>
                    </div>
                  )}
                  {pointDiscount > 0 && (
                    <div className="flex justify-between text-indigo-600">
                      <span>Điểm tích lũy:</span>
                      <span>-{formatCurrency(pointDiscount)}</span>
                    </div>
                  )}
                  {referralDiscount > 0 && (
                    <div className="flex justify-between text-pink-600">
                      <span>Chiết khấu mã giới thiệu:</span>
                      <span>-{formatCurrency(referralDiscount)}</span>
                    </div>
                  )}
                  {isOnline && shippingFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phí ship:</span>
                      <span>{formatCurrency(shippingFee)}</span>
                    </div>
                  )}
                  {formData.fulfillment_type === "at_counter" && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Vận chuyển:</span>
                      <span>Tại quầy — Miễn phí</span>
                    </div>
                  )}
                  <Separator className="my-1" />
                  <div className="flex justify-between text-sm font-extrabold">
                    <span>Tổng số tiền:</span>
                    <span className="text-primary text-base">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <SectionHeader icon={FileText} title="Ghi chú & Thẻ đơn hàng" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-semibold">Ghi chú in hóa đơn</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ghi chú hiển thị trên hóa đơn in..."
                    className="min-h-[60px] text-xs bg-background"
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-semibold">Ghi chú nội bộ</Label>
                  <Textarea
                    value={formData.internal_notes}
                    onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                    placeholder="Ghi chú bảo mật chỉ quản lý/kho thấy..."
                    className="min-h-[60px] text-xs bg-background"
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-semibold">Thẻ đơn hàng (Tags)</Label>
                  <Input
                    value={(formData.tags || []).join(", ")}
                    onChange={(e) => {
                      const tagsArray = e.target.value
                        .split(",")
                        .map(t => t.trim())
                        .filter(t => t.length > 0);
                      setFormData({ ...formData, tags: tagsArray });
                    }}
                    placeholder="VD: sỉ, đại lý (phân tách bằng dấu phẩy)..."
                    className="min-h-[60px] text-xs bg-background"
                  />
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN: lg:col-span-4 ── */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Order Info */}
              <div className="bg-[#F8FAFC] dark:bg-slate-955 p-4 border rounded-xl shadow-sm space-y-3">
                <SectionHeader icon={FileText} title="Thông tin chung" />
                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <Label className="font-semibold text-muted-foreground">Kênh bán hàng *</Label>
                    <Select
                      value={formData.channel_id}
                      onValueChange={(value) => setFormData({ ...formData, channel_id: value })}
                    >
                      <SelectTrigger className="bg-background h-8 text-xs">
                        <SelectValue placeholder="Chọn kênh bán" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {channels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: channel.color || "#3B82F6" }}
                              />
                              {channel.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="font-semibold text-muted-foreground">Loại đơn</Label>
                      <Select
                        value={formData.order_type}
                        onValueChange={(value: "b2b" | "b2c") => setFormData({ ...formData, order_type: value })}
                      >
                        <SelectTrigger className="bg-background h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="b2c">B2C</SelectItem>
                          <SelectItem value="b2b">B2B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="font-semibold text-muted-foreground">Ưu tiên</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger className="bg-background h-8 text-xs">
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

                  <div className="space-y-1">
                    <Label className="font-semibold text-muted-foreground">Nhân viên phụ trách</Label>
                    <Select
                      value={formData.assigned_to_name}
                      onValueChange={(value) => setFormData({ ...formData, assigned_to_name: value })}
                    >
                      <SelectTrigger className="bg-background h-8 text-xs">
                        <SelectValue placeholder="Chọn nhân viên" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {staffList.map((staff) => (
                          <SelectItem key={staff.id} value={staff.name}>
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Customer Profile Card */}
              <div className="bg-[#F8FAFC] dark:bg-slate-955 p-4 border rounded-xl shadow-sm space-y-3">
                <SectionHeader icon={User} title="Khách hàng" />
                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <Label className="font-semibold text-muted-foreground">Chọn khách hàng mẫu</Label>
                    <Select
                      value={formData.partner_id}
                      onValueChange={handleCustomerSelect}
                    >
                      <SelectTrigger className="bg-background h-8 text-xs">
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

                  <div className="space-y-1">
                    <Label className="font-semibold text-muted-foreground">Họ tên người nhận</Label>
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="font-semibold text-muted-foreground">SĐT</Label>
                      <Input
                        inputMode="tel"
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({ ...formData, customer_phone: normalizePhone(e.target.value) })}
                        placeholder="0901234567"
                        maxLength={15}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-semibold text-muted-foreground">Email</Label>
                      <Input
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                        placeholder="email@example.com"
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-muted-foreground">Địa chỉ liên hệ</Label>
                    <Input
                      value={formData.customer_address}
                      onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                      placeholder="Địa chỉ liên hệ"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery info & shipping */}
              {isOnline && (
                <div className="bg-[#F8FAFC] dark:bg-slate-955 p-4 border rounded-xl shadow-sm space-y-3">
                  <SectionHeader icon={Truck} title="Vận chuyển & Giao hàng" />
                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <Label className="font-semibold text-muted-foreground">Địa chỉ giao hàng</Label>
                      <Textarea
                        value={formData.shipping_address}
                        onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                        placeholder="Nhập địa chỉ nhận hàng..."
                        className="min-h-[40px] text-xs bg-background"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="font-semibold text-muted-foreground">Mã đơn sàn</Label>
                        <Input
                          value={formData.platform_order_id}
                          onChange={(e) => setFormData({ ...formData, platform_order_id: e.target.value })}
                          placeholder="SP-12345"
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="font-semibold text-muted-foreground">Mã tham chiếu CK</Label>
                        <Input
                          value={formData.payment_reference}
                          onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                          placeholder="Mã CK"
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                    </div>

                    {/* Auto push to carrier config */}
                    <div className="border-t pt-3 mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-semibold">Tự động gửi đơn sang ĐVVC</Label>
                          <p className="text-[10px] text-muted-foreground">Đẩy đơn sang hãng vận chuyển ngay khi bấm lưu</p>
                        </div>
                        <Switch
                          checked={autoSendToCarrier}
                          onCheckedChange={setAutoSendToCarrier}
                        />
                      </div>

                      {autoSendToCarrier && (
                        <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-semibold text-muted-foreground">Đơn vị vận chuyển</Label>
                            <select
                              value={selectedCarrierId}
                              onChange={(e) => setSelectedCarrierId(e.target.value)}
                              className="w-full text-xs h-8 border rounded-md px-2 bg-background outline-none focus:ring-1 focus:ring-orange-500"
                            >
                              {carriers && carriers.length > 0 ? (
                                carriers.map((c: any) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))
                              ) : (
                                <>
                                  <option value="carrier-ghtk">Giao Hàng Tiết Kiệm (Mock)</option>
                                  <option value="carrier-ghn">Giao Hàng Nhanh (Mock)</option>
                                  <option value="carrier-vtp">Viettel Post (Mock)</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Bottom actions sticky bar */}
          <div className="border-t pt-4 flex justify-end gap-2 bg-white dark:bg-slate-900 sticky bottom-0 z-10 pb-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6">
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || validationErrors.length > 0}
              className={cn("h-10 px-8 font-bold", formData.fulfillment_type === "at_counter" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white")}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formData.fulfillment_type === "at_counter" ? "🏪 Tạo đơn tại quầy (F2)" : "📦 Tạo đơn bán online (F2)"}
            </Button>
          </div>
        </form>
        <POSVariantSelectDialog 
          open={variantSelectOpen}
          onOpenChange={setVariantSelectOpen}
          product={productForVariantSelect}
          variants={allVariants.filter(v => v.product_id === productForVariantSelect?.id)}
          allComponents={allComponents}
          allVariants={allVariants}
          onSelect={handleVariantSelect}
        />
      </DialogContent>
    </Dialog>
  );
}
