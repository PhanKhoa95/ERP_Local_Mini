import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Link2,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
  Search,
  ExternalLink,
  Loader2,
  FileCheck,
  CheckCircle2,
  XCircle,
  Inbox,
  Sparkles,
  Layers,
  ShieldAlert,
  ArrowRightLeft,
  Eye,
  ShoppingCart,
  Zap,
  Building2,
  Copy,
  Users,
  Key,
  DollarSign,
  Package,
  Store,
  MapPin,
  ClipboardList
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CTVWarehouse {
  id: string;
  ctv_code: string; // e.g. jR4Z5kXtiL
  ctv_name: string; // Collaborator partner name (e.g. Levera)
  ctv_shop_name: string; // Partner's shop name (e.g. Kho test)
  linked_warehouse_id: string; // Local warehouse linked (e.g. Kho mặc định)
  phone: string;
  address_detail: string;
  province: string;
  district: string;
  ward: string;
  country: string;
  auto_sync_stock: boolean;
  auto_sync_orders: boolean;
  status: "connected" | "disconnected" | "pending";
  connected_at: string;
}

interface ProductSyncItem {
  id: string;
  sku: string;
  name: string;
  image?: string;
  ctv_price: number; // Giá CTV
  discount_price: number; // Giá sau giảm
  incoming_qty: number; // Sắp về
  local_stock: number; // Tổng tồn kho gốc
  ctv_stock: number; // Có thể bán
  variants_count: number; // Số mẫu mã
  selling_price: number; // Giá bán
  is_active: boolean; // Toggle SP active
  sync_mode: "dropship" | "consignment"; // dropship (đồng bộ gương) hoặc consignment (ký gửi phân bổ)
  allocated_qty?: number;
  sync_status: "synced" | "out_of_sync";
  last_synced_at: string;
}

interface CTVInboundRequest {
  id: string;
  ctv_code: string;
  ctv_name: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  report_type: "stock_update" | "return_goods";
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface CTVProductProposal {
  id: string;
  ctv_code: string;
  ctv_name: string;
  suggested_name: string;
  suggested_sku: string;
  suggested_price: number;
  initial_stock: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  stock_update: "CTV báo có hàng sẵn (Nhập thêm)",
  return_goods: "CTV trả lại hàng về kho chính",
};

export function CollaboratorWarehouseTab() {
  const { toast } = useToast();
  const { products = [] } = useProducts();
  const { warehouses = [] } = useWarehouses();

  const [activeSubTab, setActiveSubTab] = useState("warehouse_config");
  const [ctvWarehouses, setCtvWarehouses] = useState<CTVWarehouse[]>([]);
  const [syncItems, setSyncItems] = useState<ProductSyncItem[]>([]);
  const [ctvInboundRequests, setCtvInboundRequests] = useState<CTVInboundRequest[]>([]);
  const [ctvProductProposals, setCtvProductProposals] = useState<CTVProductProposal[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  
  const [isReporting, setIsReporting] = useState(false);
  const [isProposing, setIsProposing] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Selected warehouse for split-pane editing (Screenshot 1 style)
  const [selectedCtvWarehouseId, setSelectedCtvWarehouseId] = useState<string>("");

  // Allocation state
  const [selectedItemForAllocation, setSelectedItemForAllocation] = useState<ProductSyncItem | null>(null);
  const [allocationQty, setAllocationQty] = useState(5);

  // Mock report form
  const [newReport, setNewReport] = useState({
    ctv_id: "",
    product_id: "",
    quantity: 10,
    report_type: "stock_update" as const,
  });

  // Mock product proposal form
  const [newProposal, setNewProposal] = useState({
    ctv_id: "",
    suggested_name: "",
    suggested_sku: "",
    suggested_price: 120000,
    initial_stock: 30,
  });

  // Load and seed initial states
  useEffect(() => {
    const rawCTV = localStorage.getItem("erp-mini-local-demo-ctv-warehouses");
    if (rawCTV) {
      try {
        const parsed = JSON.parse(rawCTV);
        setCtvWarehouses(parsed);
        if (parsed.length > 0 && !selectedCtvWarehouseId) {
          setSelectedCtvWarehouseId(parsed[0].id);
        }
      } catch (e) {
        setCtvWarehouses([]);
      }
    } else {
      const defaultCTV: CTVWarehouse[] = [
        {
          id: "ctv-wh-1",
          ctv_code: "jR4Z5kXtiL",
          ctv_name: "Levera",
          ctv_shop_name: "Kho test",
          linked_warehouse_id: warehouses[0]?.id || "wh-1",
          phone: "0375839473",
          address_detail: "58 tố hữu, Phường Trung Văn",
          province: "Hà Nội",
          district: "Quận Nam Từ Liêm",
          ward: "Phường Trung Văn",
          country: "Việt Nam",
          auto_sync_stock: true,
          auto_sync_orders: true,
          status: "connected",
          connected_at: "2026-07-01T14:30:00Z"
        },
        {
          id: "ctv-wh-2",
          ctv_code: "kP3Y2mNvaQ",
          ctv_name: "Nguyễn Văn A",
          ctv_shop_name: "A-Affiliate Store",
          linked_warehouse_id: warehouses[0]?.id || "wh-1",
          phone: "0854137594",
          address_detail: "125 Đường Quảng Hàm",
          province: "Hà Nội",
          district: "Quận Cầu Giấy",
          ward: "Phường Trung Hoà",
          country: "Việt Nam",
          auto_sync_stock: true,
          auto_sync_orders: false,
          status: "connected",
          connected_at: "2026-07-02T08:15:00Z"
        }
      ];
      setCtvWarehouses(defaultCTV);
      setSelectedCtvWarehouseId(defaultCTV[0].id);
      localStorage.setItem("erp-mini-local-demo-ctv-warehouses", JSON.stringify(defaultCTV));
    }

    const rawSync = localStorage.getItem("erp-mini-local-demo-ctv-sync-items");
    if (rawSync) {
      try {
        const parsed = JSON.parse(rawSync);
        const validated = parsed.map((item: any) => ({
          ...item,
          is_active: item.is_active !== undefined ? item.is_active : true,
          ctv_price: item.ctv_price !== undefined ? item.ctv_price : (item.selling_price ? item.selling_price * 0.85 : 120000),
          discount_price: item.discount_price !== undefined ? item.discount_price : 0,
          incoming_qty: item.incoming_qty !== undefined ? item.incoming_qty : 0,
          variants_count: item.variants_count !== undefined ? item.variants_count : 1,
          selling_price: item.selling_price !== undefined ? item.selling_price : 150000,
        }));
        setSyncItems(validated);
        localStorage.setItem("erp-mini-local-demo-ctv-sync-items", JSON.stringify(validated));
      } catch (e) {
        setSyncItems([]);
      }
    } else {
      const defaultSync: ProductSyncItem[] = [
        {
          id: "prod-ctv-1",
          sku: "NT20",
          name: "Túi Ngọc",
          image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=80&q=80",
          ctv_price: 189000,
          discount_price: 0,
          incoming_qty: 20,
          local_stock: 45,
          ctv_stock: -11, // Available to sell
          variants_count: 2,
          selling_price: 189000,
          is_active: true,
          sync_mode: "dropship",
          sync_status: "synced",
          last_synced_at: "2026-07-02T09:00:00Z"
        },
        {
          id: "prod-ctv-2",
          sku: "VC20",
          name: "Túi Trắng",
          image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=80&q=80",
          ctv_price: 225000,
          discount_price: 0,
          incoming_qty: 19,
          local_stock: 30,
          ctv_stock: -7,
          variants_count: 3,
          selling_price: 225000,
          is_active: true,
          sync_mode: "consignment",
          allocated_qty: 15,
          sync_status: "out_of_sync",
          last_synced_at: "2026-07-02T09:00:00Z"
        },
        {
          id: "prod-ctv-3",
          sku: "ZL18",
          name: "Túi Xách",
          image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=80&q=80",
          ctv_price: 99000,
          discount_price: 0,
          incoming_qty: 10,
          local_stock: 25,
          ctv_stock: -2,
          variants_count: 4,
          selling_price: 99000,
          is_active: true,
          sync_mode: "dropship",
          sync_status: "synced",
          last_synced_at: "2026-07-02T09:00:00Z"
        },
        {
          id: "prod-ctv-4",
          sku: "MY01",
          name: "Túi Xách 1",
          image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=80&q=80",
          ctv_price: 350000,
          discount_price: 0,
          incoming_qty: 0,
          local_stock: 98,
          ctv_stock: 96,
          variants_count: 1,
          selling_price: 350000,
          is_active: true,
          sync_mode: "consignment",
          allocated_qty: 96,
          sync_status: "synced",
          last_synced_at: "2026-07-02T09:00:00Z"
        }
      ];
      setSyncItems(defaultSync);
      localStorage.setItem("erp-mini-local-demo-ctv-sync-items", JSON.stringify(defaultSync));
    }

    const rawReq = localStorage.getItem("erp-mini-local-demo-ctv-inbound-requests");
    if (rawReq) {
      try { setCtvInboundRequests(JSON.parse(rawReq)); } catch (e) { setCtvInboundRequests([]); }
    } else {
      const defaultRequests: CTVInboundRequest[] = [
        {
          id: "ctv-req-1",
          ctv_code: "jR4Z5kXtiL",
          ctv_name: "Levera",
          product_id: "prod-ctv-1",
          product_name: "Túi Ngọc",
          sku: "NT20",
          quantity: 20,
          report_type: "stock_update",
          status: "pending",
          created_at: "2026-07-02T10:00:00Z"
        }
      ];
      setCtvInboundRequests(defaultRequests);
      localStorage.setItem("erp-mini-local-demo-ctv-inbound-requests", JSON.stringify(defaultRequests));
    }

    const rawProp = localStorage.getItem("erp-mini-local-demo-ctv-product-proposals");
    if (rawProp) {
      try {
        const parsed = JSON.parse(rawProp);
        const validated = parsed.map((prop: any) => ({
          ...prop,
          suggested_price: prop.suggested_price !== undefined ? prop.suggested_price : 150000,
          initial_stock: prop.initial_stock !== undefined ? prop.initial_stock : 10,
        }));
        setCtvProductProposals(validated);
        localStorage.setItem("erp-mini-local-demo-ctv-product-proposals", JSON.stringify(validated));
      } catch (e) {
        setCtvProductProposals([]);
      }
    } else {
      const defaultProposals: CTVProductProposal[] = [
        {
          id: "ctv-prop-1",
          ctv_code: "jR4Z5kXtiL",
          ctv_name: "Levera",
          suggested_name: "Giày dép LVR002",
          suggested_sku: "LVR002",
          suggested_price: 1200000,
          initial_stock: 50,
          status: "pending",
          created_at: "2026-07-02T10:15:00Z"
        }
      ];
      setCtvProductProposals(defaultProposals);
      localStorage.setItem("erp-mini-local-demo-ctv-product-proposals", JSON.stringify(defaultProposals));
    }
  }, [warehouses]);

  // ----------------------------------------------------------------------
  // UNIFIED BACKGROUND EVENT SCHEDULER (Chạy ngầm tối ưu hóa hiệu năng)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (ctvWarehouses.length === 0 || syncItems.length === 0) return;

    const interval = setInterval(() => {
      // 1. Tự động nhận biết lệch tồn kho Dropship
      const syncEnabled = ctvWarehouses.some(w => w.auto_sync_stock);
      if (syncEnabled) {
        let changed = false;
        const updated = syncItems.map(item => {
          if (item.sync_mode === "dropship" && item.ctv_stock !== item.local_stock) {
            changed = true;
            return {
              ...item,
              ctv_stock: item.local_stock,
              sync_status: "synced" as const,
              last_synced_at: new Date().toISOString()
            };
          }
          return item;
        });

        if (changed) {
          saveSyncItems(updated);
          toast({
            title: "Tự động đồng bộ tồn kho",
            description: "Hệ thống tự động phát hiện thay đổi kho gốc và đồng bộ tồn kho CTV (Dropship) thành công."
          });
        }
      }

      // 2. Tự động phát hiện sản phẩm mới của CTV (Tỷ lệ ngẫu nhiên 8% mỗi chu kỳ)
      if (Math.random() < 0.08) {
        const randomCTV = ctvWarehouses[Math.floor(Math.random() * ctvWarehouses.length)];
        const mockSku = `CTV-NEW-${Math.floor(100 + Math.random() * 900)}`;
        const mockName = `Sản phẩm CTV ${Math.floor(1 + Math.random() * 100)}`;
        
        const newProposalItem: CTVProductProposal = {
          id: `ctv-prop-auto-${Date.now()}`,
          ctv_code: randomCTV.ctv_code,
          ctv_name: randomCTV.ctv_name,
          suggested_name: mockName,
          suggested_sku: mockSku,
          suggested_price: 180000,
          initial_stock: 25,
          status: "pending",
          created_at: new Date().toISOString()
        };

        setCtvProductProposals(prev => {
          const updated = [newProposalItem, ...prev];
          localStorage.setItem("erp-mini-local-demo-ctv-product-proposals", JSON.stringify(updated));
          return updated;
        });

        toast({
          title: "Tự động phát hiện sản phẩm mới",
          description: `Quét thấy sản phẩm [${mockSku}] tại shop CTV ${randomCTV.ctv_name}. Đã lập yêu cầu duyệt.`,
          duration: 4000
        });
      }

      // 3. Tự động nhận biết đơn hàng và khấu trừ kho (Tỷ lệ ngẫu nhiên 12% mỗi chu kỳ)
      const ordersEnabled = ctvWarehouses.some(w => w.auto_sync_orders);
      if (ordersEnabled && Math.random() < 0.12) {
        const activeWarehousesWithAutoOrders = ctvWarehouses.filter(w => w.auto_sync_orders);
        if (activeWarehousesWithAutoOrders.length > 0) {
          const randomCTV = activeWarehousesWithAutoOrders[Math.floor(Math.random() * activeWarehousesWithAutoOrders.length)];
          const randomProductIndex = Math.floor(Math.random() * syncItems.length);
          const targetProduct = syncItems[randomProductIndex];

          const isDropship = targetProduct.sync_mode === "dropship";
          const canSell = isDropship ? targetProduct.local_stock > 0 : targetProduct.ctv_stock > 0;

          if (canSell) {
            const orderId = `ĐH-CTV-${Math.floor(100000 + Math.random() * 900000)}`;
            let nextLocalStock = targetProduct.local_stock;
            let nextCtvStock = targetProduct.ctv_stock;
            let nextAllocated = targetProduct.allocated_qty;

            if (isDropship) {
              nextLocalStock = Math.max(0, targetProduct.local_stock - 1);
              nextCtvStock = nextLocalStock;
            } else {
              nextCtvStock = Math.max(0, targetProduct.ctv_stock - 1);
              if (nextAllocated !== undefined) {
                nextAllocated = Math.max(0, nextAllocated - 1);
              }
            }

            const updatedSync = syncItems.map((item, idx) => {
              if (idx === randomProductIndex) {
                return {
                  ...item,
                  local_stock: nextLocalStock,
                  ctv_stock: nextCtvStock,
                  allocated_qty: nextAllocated,
                  sync_status: "synced" as const,
                  last_synced_at: new Date().toISOString()
                };
              }
              return item;
            });
            saveSyncItems(updatedSync);

            toast({
              title: "Tự động trừ tồn đơn hàng CTV",
              description: `Phát hiện đơn hàng [${orderId}] từ shop ${randomCTV.ctv_name}. Đã tự động trừ tồn kho!`,
              duration: 4000
            });
          }
        }
      }

    }, 8000);

    return () => clearInterval(interval);
  }, [ctvWarehouses, syncItems]);

  const saveCTVWarehouses = (list: CTVWarehouse[]) => {
    setCtvWarehouses(list);
    localStorage.setItem("erp-mini-local-demo-ctv-warehouses", JSON.stringify(list));
  };

  const saveSyncItems = (list: ProductSyncItem[]) => {
    setSyncItems(list);
    localStorage.setItem("erp-mini-local-demo-ctv-sync-items", JSON.stringify(list));
  };

  const saveInboundRequests = (list: CTVInboundRequest[]) => {
    setCtvInboundRequests(list);
    localStorage.setItem("erp-mini-local-demo-ctv-inbound-requests", JSON.stringify(list));
  };

  const saveProductProposals = (list: CTVProductProposal[]) => {
    setCtvProductProposals(list);
    localStorage.setItem("erp-mini-local-demo-ctv-product-proposals", JSON.stringify(list));
  };

  // Generate CTV code (Copy to clipboard action)
  const handleGenerateCTVCode = (warehouseId: string) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Update warehouse form code
    const updated = ctvWarehouses.map(w => {
      if (w.id === warehouseId) {
        return { ...w, ctv_code: code };
      }
      return w;
    });
    saveCTVWarehouses(updated);

    navigator.clipboard.writeText(code);
    toast({
      title: `Copied: ${code}`,
      description: "Đã tạo mã cộng tác viên và sao chép vào bộ nhớ tạm thành công.",
      duration: 3000
    });
  };

  const handleUpdateWarehouseField = (warehouseId: string, fields: Partial<CTVWarehouse>) => {
    const updated = ctvWarehouses.map(w => {
      if (w.id === warehouseId) {
        return { ...w, ...fields };
      }
      return w;
    });
    saveCTVWarehouses(updated);
  };

  const handleAddNewWarehouse = () => {
    const newId = `ctv-wh-${Date.now()}`;
    const newWh: CTVWarehouse = {
      id: newId,
      ctv_code: "Chưa tạo",
      ctv_name: "Cộng tác viên mới",
      ctv_shop_name: "Kho CTV mới",
      linked_warehouse_id: warehouses[0]?.id || "wh-1",
      phone: "",
      address_detail: "",
      province: "Hà Nội",
      district: "Quận Cầu Giấy",
      ward: "Phường Dịch Vọng",
      country: "Việt Nam",
      auto_sync_stock: true,
      auto_sync_orders: true,
      status: "connected",
      connected_at: new Date().toISOString()
    };
    saveCTVWarehouses([...ctvWarehouses, newWh]);
    setSelectedCtvWarehouseId(newId);
    toast({ title: "Đã tạo kho CTV mới" });
  };

  const handleSaveWarehouseForm = () => {
    toast({ title: "Đã lưu thông tin kho CTV thành công!" });
  };

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    setTimeout(() => {
      const updated = syncItems.map(item => {
        if (item.sync_mode === "dropship") {
          return {
            ...item,
            ctv_stock: item.local_stock,
            sync_status: "synced" as const,
            last_synced_at: new Date().toISOString()
          };
        } else {
          return {
            ...item,
            ctv_stock: item.allocated_qty || item.ctv_stock,
            sync_status: "synced" as const,
            last_synced_at: new Date().toISOString()
          };
        }
      });
      saveSyncItems(updated);
      setIsSyncingAll(false);
      toast({ title: "Đồng bộ hoàn tất", description: "Đã đồng bộ lại toàn bộ trạng thái tồn kho CTV." });
    }, 1500);
  };

  const handleSyncSingle = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      const updated = syncItems.map(it => {
        if (it.id === id) {
          if (it.sync_mode === "dropship") {
            return { ...it, ctv_stock: it.local_stock, sync_status: "synced" as const, last_synced_at: new Date().toISOString() };
          } else {
            return { ...it, ctv_stock: it.allocated_qty || it.ctv_stock, sync_status: "synced" as const, last_synced_at: new Date().toISOString() };
          }
        }
        return it;
      });
      saveSyncItems(updated);
      setSyncingId(null);
      toast({ title: "Đã đồng bộ sản phẩm" });
    }, 800);
  };

  const handleChangeSyncMode = (itemId: string, mode: "dropship" | "consignment") => {
    const updated = syncItems.map(item => {
      if (item.id === itemId) {
        const isDropship = mode === "dropship";
        return {
          ...item,
          sync_mode: mode,
          ctv_stock: isDropship ? item.local_stock : (item.allocated_qty || 0),
          sync_status: isDropship ? ("synced" as const) : (item.ctv_stock === (item.allocated_qty || 0) ? ("synced" as const) : ("out_of_sync" as const)),
          last_synced_at: new Date().toISOString()
        };
      }
      return item;
    });
    saveSyncItems(updated);
    toast({
      title: "Đổi chế độ thành công",
      description: `Sản phẩm chuyển sang ${mode === "dropship" ? "Dropship (Đồng bộ gương)" : "Ký gửi (Phân bổ số lượng)"}.`
    });
  };

  const handleOpenAllocation = (item: ProductSyncItem) => {
    setSelectedItemForAllocation(item);
    setAllocationQty(5);
    setAllocationDialogOpen(true);
  };

  const handleAllocateStock = () => {
    if (!selectedItemForAllocation) return;
    if (allocationQty <= 0 || allocationQty > selectedItemForAllocation.local_stock) {
      toast({ variant: "destructive", title: "Số lượng không hợp lệ hoặc không đủ kho gốc." });
      return;
    }

    const updated = syncItems.map(item => {
      if (item.id === selectedItemForAllocation.id) {
        const nextLocal = item.local_stock - allocationQty;
        const nextCtv = item.ctv_stock + allocationQty;
        return {
          ...item,
          local_stock: nextLocal,
          ctv_stock: nextCtv,
          allocated_qty: nextCtv,
          sync_status: "synced" as const,
          last_synced_at: new Date().toISOString()
        };
      }
      return item;
    });

    saveSyncItems(updated);
    setAllocationDialogOpen(false);
    toast({
      title: "Phân bổ thành công",
      description: `Đã cắt ${allocationQty} sản phẩm ký gửi sang kho CTV.`
    });
  };

  // Toggle active product row switch
  const handleToggleProductActive = (itemId: string, current: boolean) => {
    const updated = syncItems.map(item =>
      item.id === itemId ? { ...item, is_active: !current } : item
    );
    saveSyncItems(updated);
    toast({ title: "Đã cập nhật trạng thái hoạt động sản phẩm" });
  };

  // Inbound requests approve/reject
  const handleApproveRequest = (reqId: string) => {
    const req = ctvInboundRequests.find(r => r.id === reqId);
    if (!req) return;

    const updatedRequests = ctvInboundRequests.map(r =>
      r.id === reqId ? { ...r, status: "approved" as const } : r
    );
    saveInboundRequests(updatedRequests);

    const updatedSyncItems = syncItems.map(item => {
      if (item.id === req.product_id) {
        if (req.report_type === "stock_update") {
          const nextLocalStock = item.local_stock + req.quantity;
          return {
            ...item,
            local_stock: nextLocalStock,
            sync_status: item.sync_mode === "dropship" ? ("synced" as const) : ("out_of_sync" as const),
            last_synced_at: new Date().toISOString()
          };
        } else {
          const nextCtv = Math.max(0, item.ctv_stock - req.quantity);
          const nextLocal = item.local_stock + req.quantity;
          return {
            ...item,
            local_stock: nextLocal,
            ctv_stock: nextCtv,
            allocated_qty: nextCtv,
            sync_status: "synced" as const,
            last_synced_at: new Date().toISOString()
          };
        }
      }
      return item;
    });
    saveSyncItems(updatedSyncItems);

    toast({
      title: "Đã duyệt đề xuất",
      description: req.report_type === "stock_update" 
        ? `Đã cộng thêm ${req.quantity} sản phẩm vào tồn gốc.`
        : `Đã thu hồi ${req.quantity} sản phẩm nhập lại về kho gốc.`
    });
  };

  const handleRejectRequest = (reqId: string) => {
    const updatedRequests = ctvInboundRequests.map(r =>
      r.id === reqId ? { ...r, status: "rejected" as const } : r
    );
    saveInboundRequests(updatedRequests);
    toast({ title: "Đã từ chối đề xuất" });
  };

  // Product proposal approve/reject
  const handleApproveProposal = (propId: string) => {
    const prop = ctvProductProposals.find(p => p.id === propId);
    if (!prop) return;

    const updatedProposals = ctvProductProposals.map(p =>
      p.id === propId ? { ...p, status: "approved" as const } : p
    );
    saveProductProposals(updatedProposals);

    const newProductItem: ProductSyncItem = {
      id: `prod-${Date.now()}`,
      sku: prop.suggested_sku,
      name: prop.suggested_name,
      ctv_price: prop.suggested_price * 0.85,
      discount_price: 0,
      incoming_qty: 0,
      local_stock: 0, 
      ctv_stock: prop.initial_stock,
      variants_count: 1,
      selling_price: prop.suggested_price,
      is_active: true,
      sync_mode: "consignment",
      allocated_qty: prop.initial_stock,
      sync_status: "synced",
      last_synced_at: new Date().toISOString(),
    };

    saveSyncItems([newProductItem, ...syncItems]);
    toast({
      title: "Đã duyệt & Tạo sản phẩm",
      description: `Tạo sản phẩm ${prop.suggested_name} (SKU: ${prop.suggested_sku}) và liên kết thành công với Kho CTV.`,
    });
  };

  const handleRejectProposal = (propId: string) => {
    const updatedProposals = ctvProductProposals.map(p =>
      p.id === propId ? { ...p, status: "rejected" as const } : p
    );
    saveProductProposals(updatedProposals);
    toast({ title: "Đã từ chối sản phẩm" });
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    const ctv = ctvWarehouses.find(w => w.id === newReport.ctv_id);
    const prod = products.find(p => p.id === newReport.product_id);
    if (!ctv || !prod) return;

    setIsReporting(true);
    setTimeout(() => {
      const created: CTVInboundRequest = {
        id: `ctv-req-${Date.now()}`,
        ctv_code: ctv.ctv_code,
        ctv_name: ctv.ctv_name,
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku || "SKU-MOCK",
        quantity: Number(newReport.quantity),
        report_type: newReport.report_type,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      saveInboundRequests([created, ...ctvInboundRequests]);
      setIsReporting(false);
      setReportDialogOpen(false);
      toast({ title: "Báo cáo của CTV đã gửi chờ duyệt!" });
    }, 1000);
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    const ctv = ctvWarehouses.find(w => w.id === newProposal.ctv_id);
    if (!ctv) return;

    setIsProposing(true);
    setTimeout(() => {
      const created: CTVProductProposal = {
        id: `ctv-prop-${Date.now()}`,
        ctv_code: ctv.ctv_code,
        ctv_name: ctv.ctv_name,
        suggested_name: newProposal.suggested_name,
        suggested_sku: newProposal.suggested_sku.toUpperCase(),
        suggested_price: Number(newProposal.suggested_price),
        initial_stock: Number(newProposal.initial_stock),
        status: "pending",
        created_at: new Date().toISOString(),
      };

      saveProductProposals([created, ...ctvProductProposals]);
      setIsProposing(false);
      setProposalDialogOpen(false);
      toast({ title: "Đề xuất sản phẩm mới gửi thành công!" });
    }, 1000);
  };

  // Search filtered sync products
  const filteredProducts = useMemo(() => {
    return syncItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [syncItems, searchTerm]);

  // Selected CTV warehouse details for split-pane form
  const selectedWarehouse = useMemo(() => {
    return ctvWarehouses.find(w => w.id === selectedCtvWarehouseId) || ctvWarehouses[0];
  }, [ctvWarehouses, selectedCtvWarehouseId]);

  return (
    <div className="space-y-6 text-xs text-foreground">
      {/* Tab Navigation header */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <div className="flex justify-between items-center border-b pb-2">
          <TabsList className="bg-muted/40 p-1">
            <TabsTrigger value="warehouse_config" className="text-xs font-semibold gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Cấu hình & Liên kết kho CTV (Pancake POS)
            </TabsTrigger>
            <TabsTrigger value="product_sync" className="text-xs font-semibold gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Bảng đồng bộ hàng hóa CTV
            </TabsTrigger>
            <TabsTrigger value="approvals" className="text-xs font-semibold gap-1.5">
              <Inbox className="h-3.5 w-3.5" />
              Yêu cầu duyệt từ CTV
              {(ctvInboundRequests.filter(r => r.status === "pending").length + ctvProductProposals.filter(p => p.status === "pending").length) > 0 && (
                <Badge className="ml-1 bg-red-500 text-[8px] font-bold text-white px-1.5 h-4.5 rounded-full shrink-0">
                  {ctvInboundRequests.filter(r => r.status === "pending").length + ctvProductProposals.filter(p => p.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setReportDialogOpen(true)}>
              <Inbox className="h-3 w-3 mr-1" /> CTV báo hàng
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setProposalDialogOpen(true)}>
              <Sparkles className="h-3 w-3 mr-1" /> CTV đề xuất SP
            </Button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: KHO HÀNG CONFIG / SPLIT-PANE (Mirrors Screenshot 1) */}
        {/* ============================================================== */}
        <TabsContent value="warehouse_config" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left panel: Danh sách kho hàng */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="border border-border shadow-none">
                <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Danh sách kho hàng</h3>
                  </div>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={handleAddNewWarehouse}>
                    <Plus className="h-4.5 w-4.5" />
                  </Button>
                </CardHeader>
                <CardContent className="p-3 space-y-2.5 max-h-[500px] overflow-y-auto">
                  {ctvWarehouses.map(wh => {
                    const localWh = warehouses.find(l => l.id === wh.linked_warehouse_id);
                    const isSelected = wh.id === selectedWarehouse?.id;
                    return (
                      <div
                        key={wh.id}
                        onClick={() => setSelectedCtvWarehouseId(wh.id)}
                        className={cn(
                          "p-3.5 border rounded-lg cursor-pointer transition-all relative flex flex-col gap-1.5 hover:bg-secondary/15",
                          isSelected ? "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/30" : "border-border"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-foreground text-xs">{wh.ctv_shop_name}</span>
                          <Badge variant="outline" className="text-[8px] bg-slate-100 font-bold dark:bg-slate-900">
                            {wh.ctv_name}
                          </Badge>
                        </div>
                        {wh.ctv_code && wh.ctv_code !== "Chưa tạo" && (
                          <div className="text-[10px] font-medium text-slate-500">
                            Kho CTV: <span className="text-foreground font-semibold">{wh.ctv_name}/{wh.ctv_shop_name}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          Số điện thoại: <span className="text-foreground font-semibold">{wh.phone || "—"}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Địa chỉ: <span className="text-foreground font-medium">{wh.address_detail ? `${wh.address_detail}, ${wh.ward}, ${wh.district}, ${wh.province}` : "Không có địa chỉ"}</span>
                        </div>
                        <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
                          {wh.auto_sync_orders && <Badge className="text-[8px] bg-purple-100 text-purple-700 dark:bg-purple-950/20 border-purple-200">Đơn</Badge>}
                          {wh.auto_sync_stock && <Badge className="text-[8px] bg-green-100 text-green-700 dark:bg-green-950/20 border-green-200">Kho</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Right panel: Chỉnh sửa kho detail view */}
            <div className="lg:col-span-8">
              {selectedWarehouse ? (
                <Card className="border border-border shadow-none">
                  <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider">Chỉnh sửa kho</CardTitle>
                      <Button
                        variant="link"
                        onClick={() => handleGenerateCTVCode(selectedWarehouse.id)}
                        className="text-blue-600 hover:text-blue-700 h-auto p-0 text-[10px] flex items-center gap-1 font-semibold"
                      >
                        Tạo mã cộng tác viên
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-[10px] text-muted-foreground font-semibold">Cho phép tạo đơn</Label>
                        <Switch
                          checked={selectedWarehouse.auto_sync_orders}
                          onCheckedChange={(checked) => handleUpdateWarehouseField(selectedWarehouse.id, { auto_sync_orders: checked })}
                        />
                      </div>
                      <Button size="sm" onClick={handleSaveWarehouseForm} className="h-7 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                        Lưu
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 text-foreground text-xs">
                    {/* Thông tin kho */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs border-b pb-1 text-muted-foreground">Thông tin kho</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="font-semibold text-muted-foreground">Tên kho *</Label>
                          <Input
                            value={selectedWarehouse.ctv_shop_name}
                            onChange={(e) => handleUpdateWarehouseField(selectedWarehouse.id, { ctv_shop_name: e.target.value })}
                            className="h-8 text-xs font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-muted-foreground">Số điện thoại</Label>
                          <Input
                            value={selectedWarehouse.phone}
                            onChange={(e) => handleUpdateWarehouseField(selectedWarehouse.id, { phone: e.target.value })}
                            placeholder="Số điện thoại liên hệ"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-muted-foreground">Mã tùy chỉnh / Mã CTV</Label>
                          <div className="relative">
                            <Input
                              value={selectedWarehouse.ctv_code}
                              onChange={(e) => handleUpdateWarehouseField(selectedWarehouse.id, { ctv_code: e.target.value })}
                              className="h-8 text-xs font-mono font-bold pr-7"
                            />
                            <Copy className="h-3.5 w-3.5 absolute right-2 top-2.5 text-muted-foreground/60 cursor-pointer" onClick={() => {
                              navigator.clipboard.writeText(selectedWarehouse.ctv_code);
                              toast({ title: "Đã sao chép mã CTV" });
                            }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Địa chỉ */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs border-b pb-1 text-muted-foreground">Địa chỉ</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="font-semibold text-muted-foreground">Tỉnh/Thành phố</Label>
                          <Select value={selectedWarehouse.province} onValueChange={(val) => handleUpdateWarehouseField(selectedWarehouse.id, { province: val })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-popover text-foreground z-[140]">
                              <SelectItem value="Hà Nội">Hà Nội</SelectItem>
                              <SelectItem value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</SelectItem>
                              <SelectItem value="Đà Nẵng">Đà Nẵng</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-muted-foreground">Quận/Huyện</Label>
                          <Select value={selectedWarehouse.district} onValueChange={(val) => handleUpdateWarehouseField(selectedWarehouse.id, { district: val })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-popover text-foreground z-[140]">
                              <SelectItem value="Quận Nam Từ Liêm">Quận Nam Từ Liêm</SelectItem>
                              <SelectItem value="Quận Cầu Giấy">Quận Cầu Giấy</SelectItem>
                              <SelectItem value="Quận 1">Quận 1</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-muted-foreground">Phường/Xã</Label>
                          <Select value={selectedWarehouse.ward} onValueChange={(val) => handleUpdateWarehouseField(selectedWarehouse.id, { ward: val })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-popover text-foreground z-[140]">
                              <SelectItem value="Phường Trung Văn">Phường Trung Văn</SelectItem>
                              <SelectItem value="Phường Trung Hoà">Phường Trung Hoà</SelectItem>
                              <SelectItem value="Phường Bến Nghé">Phường Bến Nghé</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="space-y-1">
                          <Label className="font-semibold text-muted-foreground">Địa chỉ chi tiết</Label>
                          <Input
                            value={selectedWarehouse.address_detail}
                            onChange={(e) => handleUpdateWarehouseField(selectedWarehouse.id, { address_detail: e.target.value })}
                            placeholder="Số nhà, đường..."
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-muted-foreground">Quốc gia</Label>
                          <Select value={selectedWarehouse.country} onValueChange={(val) => handleUpdateWarehouseField(selectedWarehouse.id, { country: val })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-popover text-foreground z-[140]">
                              <SelectItem value="Việt Nam">Việt Nam</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Cấu hình mặc định */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs border-b pb-1 text-muted-foreground">Cấu hình kho mặc định của page</h4>
                      <div className="space-y-1 max-w-sm">
                        <Label className="font-semibold text-muted-foreground">Chọn page</Label>
                        <Select defaultValue="page-demo">
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Chọn page..." /></SelectTrigger>
                          <SelectContent className="bg-popover text-foreground z-[140]">
                            <SelectItem value="page-demo">Pancake test page</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Widgets: Nhân viên & Quyền */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-xs text-muted-foreground flex items-center gap-1.5">
                          <Users className="h-4 w-4" /> Nhân viên thuộc kho
                        </Label>
                        <div className="p-3 border rounded-lg bg-secondary/10 space-y-2 min-h-[100px]">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-[10px]">OK</div>
                            <span className="font-medium text-foreground">Dương Kim Oanh</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center font-bold text-[10px]">LP</div>
                            <span className="font-medium text-foreground">Lan Phương</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs text-muted-foreground flex items-center gap-1.5">
                          <Key className="h-4 w-4" /> Quyền trên kho
                        </Label>
                        <div className="p-3 border rounded-lg bg-secondary/10 flex items-center justify-center text-muted-foreground min-h-[100px]">
                          Đã cấp toàn quyền truy xuất & duyệt đóng gói đơn hàng.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full border border-dashed rounded-lg flex items-center justify-center text-muted-foreground py-16">
                  Vui lòng chọn hoặc thêm kho cộng tác viên ở bảng bên trái.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: PRODUCT SYNC / PRICING & STOCK (Mirrors Screenshot 2) */}
        {/* ============================================================== */}
        <TabsContent value="product_sync" className="mt-4 space-y-4">
          <Card className="border border-border shadow-none">
            <CardHeader className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider">Danh sách liên kết sản phẩm CTV</CardTitle>
                <CardDescription className="text-[10px] mt-0.5">Giá CTV và cơ chế đồng bộ tồn kho được điều phối trực quan</CardDescription>
              </div>
              <div className="flex w-full sm:w-auto items-center gap-2">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Tìm sản phẩm, SKU..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <Button size="sm" variant="outline" className="h-8 font-semibold text-xs gap-1.5" onClick={handleSyncAll} disabled={isSyncingAll}>
                  {isSyncingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Đồng bộ tồn kho
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-muted/15">
                    <th className="p-3 font-medium text-muted-foreground w-12 text-center">Bật</th>
                    <th className="p-3 font-medium text-muted-foreground">Mã SP (SKU)</th>
                    <th className="p-3 font-medium text-muted-foreground">Tên sản phẩm</th>
                    <th className="p-3 font-medium text-muted-foreground">Hình ảnh</th>
                    <th className="p-3 font-medium text-muted-foreground text-right">Giá CTV</th>
                    <th className="p-3 font-medium text-muted-foreground text-right">Giá sau giảm</th>
                    <th className="p-3 font-medium text-muted-foreground text-center">Sắp về</th>
                    <th className="p-3 font-medium text-muted-foreground text-center">Tổng tồn kho</th>
                    <th className="p-3 font-medium text-muted-foreground text-center">Có thể bán</th>
                    <th className="p-3 font-medium text-muted-foreground text-center">Số mẫu mã</th>
                    <th className="p-3 font-medium text-muted-foreground text-right">Giá bán</th>
                    <th className="p-3 font-medium text-muted-foreground">Cơ chế đồng bộ</th>
                    <th className="p-3 font-medium text-muted-foreground text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(item => (
                    <tr key={item.id} className="border-b hover:bg-secondary/15 transition-colors">
                      <td className="p-3 text-center">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleProductActive(item.id, item.is_active)}
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-foreground">{item.sku}</td>
                      <td className="p-3 font-semibold text-foreground">{item.name}</td>
                      <td className="p-3">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-8 w-8 object-cover rounded-md border" />
                        ) : (
                          <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center font-bold text-[9px] text-muted-foreground">SP</div>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">
                        {(item.ctv_price ?? 0).toLocaleString("vi-VN")}đ
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {(item.discount_price ?? 0) > 0 ? `${(item.discount_price ?? 0).toLocaleString("vi-VN")}đ` : "0đ"}
                      </td>
                      <td className="p-3 text-center text-slate-500 font-bold">{item.incoming_qty}</td>
                      <td className="p-3 text-center font-bold text-foreground">{item.local_stock}</td>
                      <td className="p-3 text-center font-bold text-amber-600 dark:text-amber-400">
                        {item.ctv_stock}
                        {item.sync_mode === "consignment" && item.allocated_qty !== undefined && (
                          <span className="text-[9px] text-slate-400 block font-normal">(Alloc: {item.allocated_qty})</span>
                        )}
                      </td>
                      <td className="p-3 text-center text-slate-500">{item.variants_count}</td>
                      <td className="p-3 text-right font-bold">{(item.selling_price ?? 0).toLocaleString("vi-VN")}đ</td>
                      <td className="p-3">
                        <Select 
                          value={item.sync_mode} 
                          onValueChange={(val: "dropship" | "consignment") => handleChangeSyncMode(item.id, val)}
                        >
                          <SelectTrigger className="h-7 text-[10px] w-28 bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover text-foreground z-[140]">
                            <SelectItem value="dropship">Dropship (Gương)</SelectItem>
                            <SelectItem value="consignment">Ký gửi (Phân bổ)</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {item.sync_mode === "consignment" && (
                            <Button
                              size="sm"
                              className="h-6 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                              onClick={() => handleOpenAllocation(item)}
                            >
                              Phân bổ
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] text-blue-600 hover:text-blue-700 font-semibold gap-1"
                            onClick={() => handleSyncSingle(item.id)}
                            disabled={syncingId === item.id}
                          >
                            {syncingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            Đồng bộ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={13} className="p-8 text-center text-muted-foreground">
                        Không tìm thấy sản phẩm liên kết nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 3: APPROVALS & PROPOSALS BOARD */}
        {/* ============================================================== */}
        <TabsContent value="approvals" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Collaborator Stock Inbound Requests Section */}
            <Card className="border border-border shadow-none">
              <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Inbox className="h-4 w-4 text-blue-500" />
                    Đề xuất nhận hàng / Báo cáo hàng hóa từ CTV
                  </CardTitle>
                  <CardDescription className="text-[10px] mt-0.5">Xử lý yêu cầu CTV báo cáo tăng kho hoặc đề xuất trả hàng về kho gốc</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b bg-muted/15">
                      <th className="p-3 font-medium text-muted-foreground">Cộng tác viên</th>
                      <th className="p-3 font-medium text-muted-foreground">Sản phẩm báo cáo</th>
                      <th className="p-3 font-medium text-muted-foreground text-center">Số lượng</th>
                      <th className="p-3 font-medium text-muted-foreground">Loại đề xuất</th>
                      <th className="p-3 font-medium text-muted-foreground">Trạng thái</th>
                      <th className="p-3 font-medium text-muted-foreground text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ctvInboundRequests.map(req => (
                      <tr key={req.id} className="border-b hover:bg-secondary/15 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-foreground">{req.ctv_name}</div>
                          <div className="text-[9px] text-muted-foreground">{req.ctv_code}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold">{req.product_name}</div>
                          <div className="text-[9px] font-mono text-muted-foreground">{req.sku}</div>
                        </td>
                        <td className="p-3 text-center font-bold text-base">{req.quantity}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={req.report_type === "stock_update" ? "text-[8px] bg-blue-50 text-blue-700 border-blue-200" : "text-[8px] bg-orange-50 text-orange-700 border-orange-200"}>
                            {REPORT_TYPE_LABELS[req.report_type]}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 font-bold", 
                            req.status === "approved" && "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20",
                            req.status === "rejected" && "bg-red-50 text-red-700 border-red-200",
                            req.status === "pending" && "bg-amber-50 text-amber-700 border-amber-200"
                          )}>
                            {req.status === "approved" && "Đã duyệt"}
                            {req.status === "rejected" && "Đã từ chối"}
                            {req.status === "pending" && "Chờ duyệt"}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          {req.status === "pending" ? (
                            <div className="flex gap-1 justify-center">
                              <Button size="sm" className="h-6 px-1.5 text-[9px] bg-green-600 hover:bg-green-700 text-white font-semibold" onClick={() => handleApproveRequest(req.id)}>
                                Duyệt
                              </Button>
                              <Button size="sm" variant="outline" className="h-6 px-1.5 text-[9px] text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleRejectRequest(req.id)}>
                                Từ chối
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Đã xử lý</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {ctvInboundRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          Chưa có đề xuất báo hàng nào từ Cộng tác viên.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Collaborator New Product Approval Proposals Section */}
            <Card className="border border-border shadow-none">
              <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Đề xuất duyệt sản phẩm mới từ CTV
                  </CardTitle>
                  <CardDescription className="text-[10px] mt-0.5">Duyệt sản phẩm mới do CTV tự đăng tải muốn liên kết bán hàng</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b bg-muted/15">
                      <th className="p-3 font-medium text-muted-foreground">CTV gửi</th>
                      <th className="p-3 font-medium text-muted-foreground">Sản phẩm đề xuất</th>
                      <th className="p-3 font-medium text-muted-foreground">SKU / Giá bán</th>
                      <th className="p-3 font-medium text-muted-foreground text-center">Tồn ban đầu</th>
                      <th className="p-3 font-medium text-muted-foreground">Trạng thái</th>
                      <th className="p-3 font-medium text-muted-foreground text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ctvProductProposals.map(prop => (
                      <tr key={prop.id} className="border-b hover:bg-secondary/15 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-foreground">{prop.ctv_name}</div>
                          <div className="text-[9px] text-muted-foreground">{prop.ctv_code}</div>
                        </td>
                        <td className="p-3 font-semibold">{prop.suggested_name}</td>
                        <td className="p-3">
                          <div className="font-mono text-[9px] text-muted-foreground font-bold">{prop.suggested_sku}</div>
                          <div className="text-[10px] text-foreground font-semibold">{(prop.suggested_price ?? 0).toLocaleString("vi-VN")}đ</div>
                        </td>
                        <td className="p-3 text-center font-bold">{prop.initial_stock}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 font-bold", 
                            prop.status === "approved" && "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20",
                            prop.status === "rejected" && "bg-red-50 text-red-700 border-red-200",
                            prop.status === "pending" && "bg-amber-50 text-amber-700 border-amber-200"
                          )}>
                            {prop.status === "approved" && "Đã duyệt"}
                            {prop.status === "rejected" && "Đã từ chối"}
                            {prop.status === "pending" && "Chờ duyệt"}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          {prop.status === "pending" ? (
                            <div className="flex gap-1 justify-center">
                              <Button size="sm" className="h-6 px-1.5 text-[9px] bg-green-600 hover:bg-green-700 text-white font-semibold" onClick={() => handleApproveProposal(prop.id)}>
                                Duyệt & Tạo
                              </Button>
                              <Button size="sm" variant="outline" className="h-6 px-1.5 text-[9px] text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleRejectProposal(prop.id)}>
                                Từ chối
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Đã xử lý</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {ctvProductProposals.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          Chưa có đề xuất sản phẩm mới nào từ Cộng tác viên.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Simulate Collaborator Stock Report */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-sm font-bold">
              <FileCheck className="h-4.5 w-4.5 text-blue-600" />
              Giả lập CTV Báo cáo hàng hóa / Đề xuất hoàn hàng
            </DialogTitle>
            <DialogDescription className="text-xs">
              Giả lập hành động một Cộng tác viên gửi báo cáo số lượng hàng hóa sẵn có từ shop của họ lên hệ thống của bạn.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitReport} className="space-y-4 text-foreground text-xs">
            <div className="space-y-1">
              <Label className="font-semibold">Chọn Cộng tác viên gửi báo cáo</Label>
              <Select value={newReport.ctv_id} onValueChange={val => setNewReport({ ...newReport, ctv_id: val })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Chọn CTV..." /></SelectTrigger>
                <SelectContent className="bg-popover text-foreground z-[140]">
                  {ctvWarehouses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.ctv_name} ({c.ctv_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="font-semibold">Sản phẩm báo cáo</Label>
              <Select value={newReport.product_id} onValueChange={val => setNewReport({ ...newReport, product_id: val })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Chọn sản phẩm..." /></SelectTrigger>
                <SelectContent className="bg-popover text-foreground z-[140] max-h-[180px] overflow-y-auto">
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="font-semibold">Số lượng hàng báo cáo</Label>
                <Input
                  type="number"
                  min="1"
                  value={newReport.quantity}
                  onChange={e => setNewReport({ ...newReport, quantity: Number(e.target.value) })}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Loại đề xuất</Label>
                <Select value={newReport.report_type} onValueChange={(val: any) => setNewReport({ ...newReport, report_type: val })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover text-foreground z-[140]">
                    <SelectItem value="stock_update">Báo có hàng sẵn (Nhập thêm)</SelectItem>
                    <SelectItem value="return_goods">Trả lại hàng về kho chính</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setReportDialogOpen(false)} disabled={isReporting}>Hủy</Button>
              <Button type="submit" disabled={isReporting} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {isReporting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Gửi báo cáo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Simulate Collaborator Product Proposal */}
      <Dialog open={proposalDialogOpen} onOpenChange={setProposalDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-sm font-bold">
              <Sparkles className="h-4.5 w-4.5 text-purple-600" />
              Giả lập CTV đề xuất sản phẩm mới
            </DialogTitle>
            <DialogDescription className="text-xs">
              Giả lập hành động một Cộng tác viên tạo sản phẩm mới ở shop con của họ và gửi yêu cầu duyệt liên kết sản phẩm lên shop chính.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitProposal} className="space-y-4 text-foreground text-xs">
            <div className="space-y-1">
              <Label className="font-semibold">Chọn Cộng tác viên đề xuất</Label>
              <Select value={newProposal.ctv_id} onValueChange={val => setNewProposal({ ...newProposal, ctv_id: val })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Chọn CTV..." /></SelectTrigger>
                <SelectContent className="bg-popover text-foreground z-[140]">
                  {ctvWarehouses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.ctv_name} ({c.ctv_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="font-semibold">Tên sản phẩm đề xuất</Label>
              <Input
                placeholder="Ví dụ: Giày Sneaker thể thao RunFast"
                value={newProposal.suggested_name}
                onChange={e => setNewProposal({ ...newProposal, suggested_name: e.target.value })}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-semibold">Mã SKU đề xuất</Label>
              <Input
                placeholder="Ví dụ: GSN-RF-40"
                value={newProposal.suggested_sku}
                onChange={e => setNewProposal({ ...newProposal, suggested_sku: e.target.value })}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="font-semibold">Giá bán đề xuất (VNĐ)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newProposal.suggested_price}
                  onChange={e => setNewProposal({ ...newProposal, suggested_price: Number(e.target.value) })}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Tồn kho ban đầu của CTV</Label>
                <Input
                  type="number"
                  min="0"
                  value={newProposal.initial_stock}
                  onChange={e => setNewProposal({ ...newProposal, initial_stock: Number(e.target.value) })}
                  className="h-8"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setProposalDialogOpen(false)} disabled={isProposing}>Hủy</Button>
              <Button type="submit" disabled={isProposing} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
                {isProposing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Gửi đề xuất
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Consignment Stock Allocation */}
      <Dialog open={allocationDialogOpen} onOpenChange={setAllocationDialogOpen}>
        <DialogContent className="max-w-sm bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-sm font-bold">
              <ArrowRightLeft className="h-4.5 w-4.5 text-blue-600" />
              Phân bổ hàng ký gửi sang CTV
            </DialogTitle>
            <DialogDescription className="text-xs">
              Trừ bớt tồn kho gốc để chuyển quyền sở hữu/phân bổ sang kho độc lập của cộng tác viên.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-foreground text-xs pt-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Sản phẩm phân bổ</Label>
              <div className="font-bold text-foreground text-sm">{selectedItemForAllocation?.name}</div>
              <div className="text-[10px] text-muted-foreground font-mono">SKU: {selectedItemForAllocation?.sku}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 p-3 bg-secondary/20 rounded-lg">
              <div>
                <Label className="text-muted-foreground block text-[10px]">Tồn kho gốc hiện tại</Label>
                <span className="text-base font-bold text-foreground">{selectedItemForAllocation?.local_stock}</span>
              </div>
              <div>
                <Label className="text-muted-foreground block text-[10px]">CTV đang nắm giữ</Label>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400">{selectedItemForAllocation?.ctv_stock}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold">Số lượng chuyển phân bổ (Ký gửi)</Label>
              <Input
                type="number"
                min="1"
                max={selectedItemForAllocation?.local_stock}
                value={allocationQty}
                onChange={e => setAllocationQty(Number(e.target.value))}
                className="h-8"
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setAllocationDialogOpen(false)}>Hủy</Button>
              <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold" onClick={handleAllocateStock}>
                Xác nhận phân bổ
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
