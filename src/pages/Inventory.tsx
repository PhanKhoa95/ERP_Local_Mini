import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductionPlanPanel } from "@/components/inventory/ProductionPlanPanel";
import { PickingPackingTab } from "@/components/inventory/PickingPackingTab";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGlobalDateFilter } from "@/contexts/GlobalDateFilterContext";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Loader2,
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Download,
  Upload,
  Layers,
  Wrench,
  Filter,
  Factory,
  Boxes,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProducts } from "@/hooks/useProducts";
import { useProductCategories } from "@/hooks/useProductCategories";
import { usePermissions } from "@/hooks/usePermissions";
import { ProductDialog } from "@/components/products/ProductDialog";
import { StockTransactionDialog } from "@/components/inventory/StockTransactionDialog";
import { ProductImportDialog } from "@/components/inventory/ProductImportDialog";
import { BomDialog } from "@/components/products/BomDialog";
import { ProductVariantsDialog } from "@/components/products/ProductVariantsDialog";
import { UnitConversionsDialog } from "@/components/products/UnitConversionsDialog";
import { ProductStockHistoryDialog } from "@/components/inventory/ProductStockHistoryDialog";
import { exportProductsToExcel, exportInventoryToExcel } from "@/lib/exportExcel";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProductBom } from "@/hooks/useProductBom";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { StatsCardsSkeleton, InventoryTableSkeleton } from "@/components/ui/page-skeleton";
import { EmptyProductsState, EmptySearchState } from "@/components/ui/empty-state";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { getLocalInventoryTransactions } from "@/lib/localInventoryStore";

const Inventory = () => {
  const queryClient = useQueryClient();
  const { hasPermission, hasFieldPermission, canCreate, canEdit, canDelete } = usePermissions();
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { activeCategories } = useProductCategories();
  const { productsWithBom } = useProductBom();
  const { companyId } = useCompanyContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockDialogType, setStockDialogType] = useState<"in" | "out">("in");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [bomDialogOpen, setBomDialogOpen] = useState(false);
  const [bomProduct, setBomProduct] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [variantsDialogOpen, setVariantsDialogOpen] = useState(false);
  const [variantsProduct, setVariantsProduct] = useState<any>(null);
  const [uomDialogOpen, setUomDialogOpen] = useState(false);
  const [uomProduct, setUomProduct] = useState<any>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<any>(null);

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "products");
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "all");
  const [stockFilter, setStockFilter] = useState<string>(searchParams.get("stock") || "all");

  useEffect(() => {
    const searchVal = searchParams.get("search");
    if (searchVal !== null) setSearchQuery(searchVal);
    
    const tabVal = searchParams.get("tab");
    if (tabVal !== null) setActiveTab(tabVal);
    
    const catVal = searchParams.get("category");
    if (catVal !== null) setSelectedCategory(catVal);
    
    const stockVal = searchParams.get("stock");
    if (stockVal !== null) setStockFilter(stockVal);
  }, [searchParams]);

  // Fetch inventory transactions (filtered by company products)
  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["inventory-transactions", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalInventoryTransactions(companyId);
      }

      const { data, error } = await supabase
        .from("inventory_transactions")
        .select(`*, products!inner(name, sku, company_id)`)
        .eq("products.company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { startDate, endDate } = useGlobalDateFilter();

  const filteredTransactions = useMemo(() => {
    const typeFilter = searchParams.get("type");
    return transactions.filter((tx: any) => {
      if (!tx.created_at) return true;
      const txDateStr = tx.created_at.split("T")[0];
      if (startDate && txDateStr < startDate) return false;
      if (endDate && txDateStr > endDate) return false;

      if (typeFilter === "in") {
        return tx.quantity > 0;
      }
      if (typeFilter === "out") {
        return tx.quantity < 0;
      }
      if (typeFilter === "damaged") {
        const notes = (tx.notes || "").toLowerCase();
        return tx.quantity < 0 && (
          notes.includes("hỏng") || 
          notes.includes("lỗi") || 
          notes.includes("hao hụt") || 
          notes.includes("damaged") || 
          notes.includes("hủy")
        );
      }
      return true;
    });
  }, [transactions, startDate, endDate, searchParams]);

  // Filter products - exclude service items from stock calculations
  const physicalProducts = products.filter(p => p.is_service !== true);
  const serviceProducts = products.filter(p => p.is_service === true);

  const getStockStatus = (stock: number, minStock: number, isService?: boolean) => {
    if (isService) return "service";
    if (stock <= 0) return "critical";
    if (stock <= minStock) return "low";
    return "normal";
  };

  const filteredProducts = useMemo(() => {
    const filterParam = searchParams.get("filter");
    return products.filter((p) => {
      // Search filter
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      
      // Stock status filter
      const status = getStockStatus(p.stock_quantity || 0, p.min_stock || 0, p.is_service);
      const matchesStock = 
        stockFilter === "all" || 
        stockFilter === status ||
        (stockFilter === "physical" && !p.is_service) ||
        (stockFilter === "service" && p.is_service);

      if (filterParam === "combo") {
        const nameLower = p.name.toLowerCase();
        const isComboName = nameLower.includes("combo") || nameLower.includes("bộ") || nameLower.includes("set");
        // Giả lập/check thêm nếu sản phẩm có định mức BOM
        return matchesSearch && matchesCategory && matchesStock && isComboName;
      }

      if (filterParam === "bom") {
        return matchesSearch && matchesCategory && matchesStock && productsWithBom.includes(p.id);
      }
      
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter, searchParams]);

  const normalCount = physicalProducts.filter((p) => getStockStatus(p.stock_quantity || 0, p.min_stock || 0) === "normal").length;
  const lowCount = physicalProducts.filter((p) => getStockStatus(p.stock_quantity || 0, p.min_stock || 0) === "low").length;
  const criticalCount = physicalProducts.filter((p) => getStockStatus(p.stock_quantity || 0, p.min_stock || 0) === "critical").length;

  const totalStockValue = physicalProducts.reduce(
    (sum, p) => sum + (p.stock_quantity || 0) * (Number(p.cost_price) || 0),
    0
  );

  const handleOpenDialog = (product?: any) => {
    setEditingProduct(product || null);
    setDialogOpen(true);
  };

  const handleOpenStockDialog = (type: "in" | "out") => {
    setStockDialogType(type);
    setStockDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    const { conversions, is_combo, combo_items, ...productData } = data;
    let savedProduct;
    if (editingProduct) {
      savedProduct = await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
    } else {
      savedProduct = await createProduct.mutateAsync(productData);
      if (savedProduct && conversions && conversions.length > 0) {
        const LOCAL_CONVERSIONS_KEY = "erp-mini-local-unit-conversions";
        const allConversions = JSON.parse(localStorage.getItem(LOCAL_CONVERSIONS_KEY) || "[]");
        conversions.forEach((c: any) => {
          allConversions.push({
            id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            product_id: savedProduct.id,
            from_unit: c.from_unit,
            to_unit: savedProduct.unit || "cái",
            factor: Number(c.factor),
            is_active: true
          });
        });
        localStorage.setItem(LOCAL_CONVERSIONS_KEY, JSON.stringify(allConversions));
        queryClient.invalidateQueries({ queryKey: ["unit-conversions"] });
      }
    }

    if (savedProduct || editingProduct) {
      const targetId = editingProduct ? editingProduct.id : savedProduct.id;
      const rawCombos = localStorage.getItem("erp-mini-local-demo-combos");
      const combos = rawCombos ? JSON.parse(rawCombos) : [];
      const filtered = combos.filter((c: any) => c.id !== targetId);
      if (is_combo) {
        filtered.push({
          id: targetId,
          items: combo_items || []
        });
      }
      localStorage.setItem("erp-mini-local-demo-combos", JSON.stringify(filtered));
    }

    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteClick = (product: any) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingProduct) {
      await deleteProduct.mutateAsync(deletingProduct.id);
      setDeleteDialogOpen(false);
      setDeletingProduct(null);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <Header title="Quản lý kho" subtitle="Theo dõi tồn kho và nhập xuất hàng" />
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <StatsCardsSkeleton count={5} />
          <InventoryTableSkeleton />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header title="Quản lý kho" subtitle="Theo dõi tồn kho và nhập xuất hàng" />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
                <p className="text-2xl font-bold text-foreground">{products.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đủ hàng</p>
                <p className="text-2xl font-bold text-success">{normalCount}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sắp hết</p>
                <p className="text-2xl font-bold text-warning">{lowCount}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hết hàng</p>
                <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
              </div>
            </div>
          </Card>
          {hasFieldPermission("inventory", "cost_price") && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Package className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giá trị tồn kho</p>
                  <p className="text-xl font-bold text-info">
                    {(totalStockValue / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList className="w-full sm:w-auto flex flex-wrap h-auto p-1 gap-1">
              <TabsTrigger value="products" className="gap-2 px-4 py-2 text-xs flex-1 sm:flex-none">
                <Package className="h-4 w-4" />
                <span>Sản phẩm</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="gap-2 px-4 py-2 text-xs flex-1 sm:flex-none">
                <History className="h-4 w-4" />
                <span>Lịch sử nhập xuất</span>
              </TabsTrigger>
              <TabsTrigger value="production" className="gap-2 px-4 py-2 text-xs flex-1 sm:flex-none">
                <Factory className="h-4 w-4" />
                <span>Sản xuất</span>
              </TabsTrigger>
              <TabsTrigger value="picking" className="gap-2 px-4 py-2 text-xs flex-1 sm:flex-none">
                <Layers className="h-4 w-4" />
                <span>Nhặt & Đóng gói</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {(activeTab === "products" || activeTab === "transactions") && (
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-3 mb-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm transition-all duration-300">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {activeTab === "products" && (
                  <>
                    <div className="relative w-full sm:w-56">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo tên, SKU, barcode..."
                        className="pl-9 h-9 text-xs"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
                        <SelectValue placeholder="Danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả danh mục</SelectItem>
                        {activeCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2.5 h-2.5 rounded-full" 
                                style={{ backgroundColor: cat.color || '#3B82F6' }} 
                              />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={stockFilter} onValueChange={setStockFilter}>
                      <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="normal">Đủ hàng</SelectItem>
                        <SelectItem value="low">Sắp hết</SelectItem>
                        <SelectItem value="critical">Hết hàng</SelectItem>
                        <SelectItem value="service">Dịch vụ</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
                {activeTab === "transactions" && (
                  <div className="text-xs font-medium text-muted-foreground py-2 px-1">
                    Bộ lọc ngày báo cáo áp dụng từ thanh điều khiển trên cùng
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeTab === "products" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-success border-success/30 hover:border-success hover:bg-success/10 h-9 text-xs gap-1.5"
                      onClick={() => handleOpenStockDialog("in")}
                    >
                      <ArrowDownLeft className="h-4 w-4" />
                      Nhập kho
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:border-destructive hover:bg-destructive/10 h-9 text-xs gap-1.5"
                      onClick={() => handleOpenStockDialog("out")}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Xuất kho
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 text-xs gap-1.5"
                  onClick={() => activeTab === "products" ? exportProductsToExcel(products) : exportInventoryToExcel(transactions)}
                >
                  <Download className="h-4 w-4" />
                  Xuất Excel
                </Button>
                {activeTab === "products" && canCreate("inventory") && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 text-xs gap-1.5"
                      onClick={() => setImportDialogOpen(true)}
                    >
                      <Upload className="h-4 w-4" />
                      Import
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-9 text-xs gap-1.5 bg-primary hover:bg-primary/90"
                      onClick={() => handleOpenDialog()}
                    >
                      <Plus className="h-4 w-4" />
                      Thêm sản phẩm
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          <TabsContent value="products" className="space-y-4">
            {searchParams.get("filter") === "combo" && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Combo sản phẩm</h3>
                  <p className="text-xs text-muted-foreground">Quản lý các gói sản phẩm, bộ sản phẩm ghép combo bán chung</p>
                </div>
                <Button
                  onClick={() => handleOpenDialog()}
                  className="h-9 text-xs gap-1.5 bg-primary hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Thêm combo mới
                </Button>
              </div>
            )}
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm">SKU</th>
                      <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm">Sản phẩm</th>
                      <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm hidden lg:table-cell">Danh mục</th>
                      {hasFieldPermission("inventory", "cost_price") && (
                        <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm hidden md:table-cell">Giá nhập</th>
                      )}
                      <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm">Giá bán</th>
                      <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm">Tồn kho</th>
                      <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm hidden sm:table-cell">Trạng thái</th>
                      <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-sm">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const isService = product.is_service === true;
                      const status = getStockStatus(product.stock_quantity || 0, product.min_stock || 0, isService);
                      return (
                        <tr
                          key={product.id}
                          className="border-b border-border hover:bg-secondary/30 transition-colors"
                        >
                          <td className="p-3 sm:p-4 font-mono text-xs sm:text-sm text-muted-foreground">{product.sku}</td>
                          <td className="p-3 sm:p-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setHistoryProduct(product);
                                  setHistoryDialogOpen(true);
                                }}
                                className="font-medium text-sm text-foreground hover:text-primary hover:underline text-left transition-colors"
                                title="Xem biến động kho"
                              >
                                {product.name}
                              </button>
                              {isService && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                  <Wrench className="h-3 w-3 mr-1" />
                                  Dịch vụ
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3 sm:p-4 text-sm text-muted-foreground hidden lg:table-cell">{product.category || "-"}</td>
                          {hasFieldPermission("inventory", "cost_price") && (
                            <td className="p-3 sm:p-4 text-sm text-muted-foreground hidden md:table-cell">
                              {Number(product.cost_price || 0).toLocaleString("vi-VN")}đ
                            </td>
                          )}
                          <td className="p-3 sm:p-4 font-semibold text-sm text-foreground">
                            {Number(product.selling_price || 0).toLocaleString("vi-VN")}đ
                          </td>
                          <td className="p-3 sm:p-4">
                            {isService ? (
                              <span className="text-muted-foreground text-sm">-</span>
                            ) : (
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span
                                  className={cn(
                                    "font-semibold text-sm",
                                    status === "normal" && "text-success",
                                    status === "low" && "text-warning",
                                    status === "critical" && "text-destructive"
                                  )}
                                >
                                  {product.stock_quantity || 0}
                                </span>
                                <span className="text-muted-foreground text-xs hidden sm:inline">/ {product.min_stock || 0}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3 sm:p-4 hidden sm:table-cell">
                            {isService ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs">
                                Dịch vụ
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "status-badge text-xs",
                                  status === "normal" && "bg-success/10 text-success border-success/20",
                                  status === "low" && "bg-warning/10 text-warning border-warning/20",
                                  status === "critical" && "bg-destructive/10 text-destructive border-destructive/20"
                                )}
                              >
                                {status === "normal" && "Đủ hàng"}
                                {status === "low" && "Sắp hết"}
                                {status === "critical" && "Hết hàng"}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 sm:p-4">
                            <div className="flex items-center gap-1">
                              {!isService && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  title="Định mức NVL (BOM)"
                                  onClick={() => {
                                    setBomProduct(product);
                                    setBomDialogOpen(true);
                                  }}
                                >
                                  <Layers className={cn(
                                    "h-4 w-4",
                                    productsWithBom.includes(product.id) && "text-primary"
                                  )} />
                                </Button>
                              )}
                              {!isService && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  title="Quản lý biến thể"
                                  onClick={() => {
                                    setVariantsProduct(product);
                                    setVariantsDialogOpen(true);
                                  }}
                                >
                                  <Boxes className={cn(
                                    "h-4 w-4",
                                    product.has_variants && "text-purple-600 fill-purple-600/10"
                                  )} />
                                </Button>
                              )}
                              {!isService && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  title="Quy cách & Xé lẻ"
                                  onClick={() => {
                                    setUomProduct(product);
                                    setUomDialogOpen(true);
                                  }}
                                >
                                  <Scale className="h-4 w-4 text-emerald-600" />
                                </Button>
                              )}
                              {!isService && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  title="Biến động kho"
                                  onClick={() => {
                                    setHistoryProduct(product);
                                    setHistoryDialogOpen(true);
                                  }}
                                >
                                  <History className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}
                              {canEdit("inventory") && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(product)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete("inventory") && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteClick(product)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProducts.length > 0 && (
                      <tr className="border-t-2 border-border bg-muted/40 font-semibold">
                        <td className="p-3 sm:p-4 text-xs sm:text-sm text-foreground">Tổng cộng</td>
                        <td className="p-3 sm:p-4 text-xs sm:text-sm text-foreground">
                          {filteredProducts.length} sản phẩm
                        </td>
                        <td className="p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground hidden lg:table-cell">—</td>
                        {hasFieldPermission("inventory", "cost_price") && (
                          <td className="p-3 sm:p-4 text-xs sm:text-sm text-foreground">
                            {filteredProducts.reduce((sum, p) => sum + (p.stock_quantity || 0) * (Number(p.cost_price) || 0), 0).toLocaleString("vi-VN")}đ
                          </td>
                        )}
                        <td className="p-3 sm:p-4 text-xs sm:text-sm text-foreground">
                          {filteredProducts.reduce((sum, p) => sum + (p.stock_quantity || 0) * (Number(p.selling_price) || 0), 0).toLocaleString("vi-VN")}đ
                        </td>
                        <td className="p-3 sm:p-4 text-xs sm:text-sm text-foreground">
                          {filteredProducts.reduce((sum, p) => sum + (p.stock_quantity || 0), 0).toLocaleString("vi-VN")}
                        </td>
                        <td className="p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">—</td>
                        <td className="p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground">—</td>
                      </tr>
                    )}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-0">
                          {searchQuery ? (
                            <EmptySearchState searchTerm={searchQuery} />
                          ) : (
                            <EmptyProductsState onAddProduct={() => handleOpenDialog()} />
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {filteredProducts.length > 0 && (
              <div className="mt-3 flex items-center justify-between flex-wrap gap-4 text-xs sm:text-sm text-muted-foreground bg-muted/20 border p-3 rounded-lg">
                <div>
                  Tổng số dòng sản phẩm: <span className="font-bold text-foreground">{filteredProducts.length}</span>
                </div>
                <div className="flex gap-4 sm:gap-6 flex-wrap">
                  <div>
                    Tổng số có thể bán: <span className="font-bold text-success">{filteredProducts.reduce((sum, p) => sum + (p.is_service ? 0 : (p.stock_quantity || 0)), 0).toLocaleString("vi-VN")}</span>
                  </div>
                  {hasFieldPermission("inventory", "cost_price") && (
                    <div>
                      Tổng tiền vốn tồn kho: <span className="font-bold text-foreground">{filteredProducts.reduce((sum, p) => sum + (p.is_service ? 0 : (p.stock_quantity || 0) * (Number(p.cost_price) || 0)), 0).toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                  <div>
                    Tổng tiền có thể bán: <span className="font-bold text-primary">{filteredProducts.reduce((sum, p) => sum + (p.is_service ? 0 : (p.stock_quantity || 0) * (Number(p.selling_price) || 0)), 0).toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {searchParams.get("type") === "in" && "Lịch sử Nhập hàng"}
                  {searchParams.get("type") === "out" && "Lịch sử Xuất hàng"}
                  {searchParams.get("type") === "damaged" && "Danh sách Hàng lỗi / Hỏng"}
                  {!searchParams.get("type") && "Lịch sử Nhập xuất kho"}
                </h3>
                <p className="text-xs text-muted-foreground">Theo dõi và cân đối biến động số lượng tồn kho</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {(searchParams.get("type") === "in" || !searchParams.get("type")) && (
                  <Button
                    onClick={() => {
                      setStockDialogType("in");
                      setStockDialogOpen(true);
                    }}
                    className="flex-1 sm:flex-none h-9 text-xs gap-1.5 bg-success hover:bg-success/90 cursor-pointer"
                  >
                    <ArrowDownLeft className="h-4 w-4" />
                    Tạo phiếu nhập
                  </Button>
                )}
                {(searchParams.get("type") === "out" || !searchParams.get("type")) && (
                  <Button
                    onClick={() => {
                      setStockDialogType("out");
                      setStockDialogOpen(true);
                    }}
                    className="flex-1 sm:flex-none h-9 text-xs gap-1.5 bg-destructive hover:bg-destructive/90 cursor-pointer"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Tạo phiếu xuất
                  </Button>
                )}
                {searchParams.get("type") === "damaged" && (
                  <Button
                    onClick={() => {
                      setStockDialogType("out");
                      setStockDialogOpen(true);
                    }}
                    className="flex-1 sm:flex-none h-9 text-xs gap-1.5 bg-warning hover:bg-warning/90 cursor-pointer text-warning-foreground"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Báo lỗi / Hỏng
                  </Button>
                )}
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium text-muted-foreground">Loại</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Sản phẩm</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Số lượng</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Ghi chú</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txLoading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx: any) => (
                        <tr key={tx.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                          <td className="p-4">
                            <Badge
                              className={cn(
                                tx.quantity > 0
                                  ? "bg-success/10 text-success border-success/20"
                                  : "bg-destructive/10 text-destructive border-destructive/20"
                              )}
                            >
                              {tx.quantity > 0 ? (
                                <ArrowDownLeft className="h-3 w-3 mr-1" />
                              ) : (
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                              )}
                              {tx.quantity > 0 ? "Nhập" : "Xuất"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{tx.products?.name}</p>
                              <p className="text-xs text-muted-foreground">{tx.products?.sku}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                "font-semibold",
                                tx.quantity > 0 ? "text-success" : "text-destructive"
                              )}
                            >
                              {tx.quantity > 0 ? "+" : ""}
                              {tx.quantity}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">{tx.notes || "-"}</td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(tx.created_at).toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      ))
                    )}
                    {!txLoading && filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          Chưa có giao dịch nhập xuất nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="production">
            <ProductionPlanPanel />
          </TabsContent>

          <TabsContent value="picking">
            <PickingPackingTab />
          </TabsContent>
        </Tabs>
      </div>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSubmit={handleSubmit}
        isLoading={createProduct.isPending || updateProduct.isPending}
      />

      <StockTransactionDialog
        open={stockDialogOpen}
        onOpenChange={setStockDialogOpen}
        defaultType={stockDialogType}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa sản phẩm "{deletingProduct?.name}"? Hành động này không thể hoàn tác.
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

      <ProductImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      <BomDialog
        open={bomDialogOpen}
        onOpenChange={setBomDialogOpen}
        product={bomProduct}
      />

      <ProductVariantsDialog
        open={variantsDialogOpen}
        onOpenChange={setVariantsDialogOpen}
        product={variantsProduct}
      />

      <UnitConversionsDialog
        open={uomDialogOpen}
        onOpenChange={setUomDialogOpen}
        product={uomProduct}
      />

      <ProductStockHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        product={historyProduct}
      />
    </MainLayout>
  );
};

export default Inventory;
