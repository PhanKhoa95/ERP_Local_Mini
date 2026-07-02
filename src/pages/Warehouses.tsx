import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Warehouse,
  Plus,
  Search,
  Loader2,
  Package,
  ArrowRightLeft,
  MapPin,
  Phone,
  User,
  Check,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useProducts } from "@/hooks/useProducts";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { WarehouseLocationsTab } from "@/components/warehouses/WarehouseLocationsTab";
import { FleetManagementTab } from "@/components/warehouses/FleetManagementTab";
import { CollaboratorWarehouseTab } from "@/components/warehouses/CollaboratorWarehouseTab";

const Warehouses = () => {
  const {
    warehouses,
    warehouseStock,
    transfers,
    isLoading,
    createWarehouse,
    updateWarehouse,
    createTransfer,
    completeTransfer,
    cancelTransfer,
  } = useWarehouses();
  const { products } = useProducts();

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "stock");

  useEffect(() => {
    const tabVal = searchParams.get("tab");
    if (tabVal && ["stock", "transfers", "locations", "fleet", "collaborator"].includes(tabVal)) {
      setActiveTab(tabVal);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);

  // Warehouse form state
  const [warehouseForm, setWarehouseForm] = useState({
    code: "",
    name: "",
    address: "",
    phone: "",
    manager_name: "",
    is_active: true,
  });

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    from_warehouse_id: "",
    to_warehouse_id: "",
    notes: "",
    items: [] as { product_id: string; quantity: number }[],
  });
  const [selectedProduct, setSelectedProduct] = useState("");
  const [transferQuantity, setTransferQuantity] = useState(1);

  // Filter stock by warehouse
  const filteredStock = useMemo(() => {
    let stock = warehouseStock;
    
    if (selectedWarehouse !== "all") {
      stock = stock.filter((s) => s.warehouse_id === selectedWarehouse);
    }
    
    if (searchTerm) {
      stock = stock.filter(
        (s) =>
          s.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.products?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return stock;
  }, [warehouseStock, selectedWarehouse, searchTerm]);

  // Calculate totals per warehouse
  const warehouseTotals = useMemo(() => {
    const totals = new Map<string, { items: number; quantity: number }>();
    
    warehouseStock.forEach((s) => {
      const existing = totals.get(s.warehouse_id) || { items: 0, quantity: 0 };
      existing.items += 1;
      existing.quantity += s.quantity ?? 0;
      totals.set(s.warehouse_id, existing);
    });
    
    return totals;
  }, [warehouseStock]);

  const handleSaveWarehouse = () => {
    if (editingWarehouse) {
      updateWarehouse.mutate(
        { id: editingWarehouse.id, ...warehouseForm },
        {
          onSuccess: () => {
            setWarehouseDialogOpen(false);
            resetWarehouseForm();
          },
        }
      );
    } else {
      createWarehouse.mutate(warehouseForm, {
        onSuccess: () => {
          setWarehouseDialogOpen(false);
          resetWarehouseForm();
        },
      });
    }
  };

  const resetWarehouseForm = () => {
    setWarehouseForm({
      code: "",
      name: "",
      address: "",
      phone: "",
      manager_name: "",
      is_active: true,
    });
    setEditingWarehouse(null);
  };

  const handleEditWarehouse = (warehouse: any) => {
    setEditingWarehouse(warehouse);
    setWarehouseForm({
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address || "",
      phone: warehouse.phone || "",
      manager_name: warehouse.manager_name || "",
      is_active: warehouse.is_active,
    });
    setWarehouseDialogOpen(true);
  };

  const handleAddTransferItem = () => {
    if (!selectedProduct || transferQuantity < 1) return;
    
    const existing = transferForm.items.find((i) => i.product_id === selectedProduct);
    if (existing) {
      setTransferForm({
        ...transferForm,
        items: transferForm.items.map((i) =>
          i.product_id === selectedProduct
            ? { ...i, quantity: i.quantity + transferQuantity }
            : i
        ),
      });
    } else {
      setTransferForm({
        ...transferForm,
        items: [...transferForm.items, { product_id: selectedProduct, quantity: transferQuantity }],
      });
    }
    
    setSelectedProduct("");
    setTransferQuantity(1);
  };

  const handleRemoveTransferItem = (productId: string) => {
    setTransferForm({
      ...transferForm,
      items: transferForm.items.filter((i) => i.product_id !== productId),
    });
  };

  const handleCreateTransfer = () => {
    if (!transferForm.from_warehouse_id || !transferForm.to_warehouse_id || transferForm.items.length === 0) {
      return;
    }
    
    createTransfer.mutate(transferForm, {
      onSuccess: () => {
        setTransferDialogOpen(false);
        setTransferForm({
          from_warehouse_id: "",
          to_warehouse_id: "",
          notes: "",
          items: [],
        });
      },
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-warning/10 text-warning",
      in_transit: "bg-info/10 text-info",
      completed: "bg-success/10 text-success",
      cancelled: "bg-destructive/10 text-destructive",
    };
    return colors[status] || "bg-secondary text-secondary-foreground";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Chờ xử lý",
      in_transit: "Đang vận chuyển",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <Header title="Quản lý kho" subtitle="Quản lý đa kho và luân chuyển" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header
        title="Quản lý kho"
        subtitle="Quản lý đa kho hàng và luân chuyển"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTransferDialogOpen(true)}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Luân chuyển
            </Button>
            <Button onClick={() => setWarehouseDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm kho
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Warehouse Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {warehouses.map((wh) => {
            const totals = warehouseTotals.get(wh.id) || { items: 0, quantity: 0 };
            return (
              <Card
                key={wh.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedWarehouse === wh.id && "ring-2 ring-primary"
                )}
                onClick={() =>
                  setSelectedWarehouse(selectedWarehouse === wh.id ? "all" : wh.id)
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Warehouse className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{wh.name}</h3>
                        <p className="text-xs text-muted-foreground">{wh.code}</p>
                      </div>
                    </div>
                    {wh.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Mặc định
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Sản phẩm</p>
                      <p className="font-semibold">{totals.items}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tổng SL</p>
                      <p className="font-semibold">{totals.quantity.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditWarehouse(wh);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="stock">Tồn kho theo kho</TabsTrigger>
            <TabsTrigger value="transfers">Phiếu luân chuyển</TabsTrigger>
            <TabsTrigger value="locations">Vị trí kệ</TabsTrigger>
            <TabsTrigger value="fleet">Quản lý Đội xe</TabsTrigger>
            <TabsTrigger value="collaborator">Kho Cộng tác viên (CTV)</TabsTrigger>
          </TabsList>

          <TabsContent value="stock" className="space-y-4">
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc mã sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Chọn kho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả kho</SelectItem>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stock Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Kho</TableHead>
                    <TableHead className="text-right">Tồn kho</TableHead>
                    <TableHead className="text-right">Tồn tối thiểu</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden">
                            {s.products?.image_url ? (
                              <img
                                src={s.products.image_url}
                                alt={s.products.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{s.products?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.products?.sku}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{s.warehouses?.name}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {(s.quantity ?? 0).toLocaleString()} {s.products?.unit || ""}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {(s.min_stock ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {s.quantity <= (s.min_stock ?? 0) ? (
                          <Badge variant="destructive">Sắp hết</Badge>
                        ) : (
                          <Badge className="bg-success/10 text-success">Đủ hàng</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredStock.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Không có dữ liệu tồn kho
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="transfers" className="space-y-4">
            <div className="flex justify-between items-center bg-card border p-3 rounded-xl shadow-xs">
              <span className="text-sm font-semibold text-foreground">Danh sách phiếu luân chuyển kho</span>
              <Button 
                onClick={() => {
                  setTransferForm({
                    from_warehouse_id: "",
                    to_warehouse_id: "",
                    notes: "",
                    items: [],
                  });
                  setTransferQuantity(1);
                  setSelectedProduct("");
                  setTransferDialogOpen(true);
                }}
                className="bg-primary hover:bg-primary/95 text-white h-9 text-xs gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Tạo phiếu chuyển kho
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã phiếu</TableHead>
                    <TableHead>Từ kho</TableHead>
                    <TableHead>Đến kho</TableHead>
                    <TableHead>Số mẫu</TableHead>
                    <TableHead>Tổng SL</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((t) => {
                    const totalQty = t.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono font-medium">
                          {t.transfer_number}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{t.from_warehouse?.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{t.to_warehouse?.name}</Badge>
                        </TableCell>
                        <TableCell>{t.items?.length || 0} mẫu mã</TableCell>
                        <TableCell className="font-semibold text-foreground">{totalQty.toLocaleString()} SP</TableCell>
                        <TableCell>
                          <Badge className={cn("status-badge px-2 py-0.5", getStatusColor(t.status))}>
                            {getStatusLabel(t.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(t.created_at), "dd/MM/yyyy HH:mm", {
                            locale: vi,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {t.status === "pending" && (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-success/15"
                                title="Xác nhận hoàn thành"
                                onClick={() => completeTransfer.mutate(t.id)}
                              >
                                <Check className="h-4 w-4 text-success" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/15"
                                title="Hủy phiếu"
                                onClick={() => cancelTransfer.mutate(t.id)}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {transfers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Chưa có phiếu luân chuyển
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            {transfers.length > 0 && (
              <div className="mt-3 flex items-center justify-between text-xs sm:text-sm text-muted-foreground bg-muted/20 border p-3 rounded-lg">
                <div>
                  Tổng số phiếu: <span className="font-bold text-foreground">{transfers.length}</span>
                </div>
                <div>
                  Tổng SL hàng chuyển kho: <span className="font-bold text-primary">{transfers.reduce((sum, t) => sum + (t.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0), 0).toLocaleString()} SP</span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="locations" className="mt-4">
            <WarehouseLocationsTab />
          </TabsContent>

          <TabsContent value="fleet" className="mt-4">
            <FleetManagementTab />
          </TabsContent>

          <TabsContent value="collaborator" className="mt-4">
            <CollaboratorWarehouseTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Warehouse Dialog */}
      <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? "Sửa kho hàng" : "Thêm kho hàng mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã kho *</Label>
                <Input
                  value={warehouseForm.code}
                  onChange={(e) =>
                    setWarehouseForm({ ...warehouseForm, code: e.target.value })
                  }
                  placeholder="VD: WH-HN01"
                  disabled={!!editingWarehouse}
                />
              </div>
              <div className="space-y-2">
                <Label>Tên kho *</Label>
                <Input
                  value={warehouseForm.name}
                  onChange={(e) =>
                    setWarehouseForm({ ...warehouseForm, name: e.target.value })
                  }
                  placeholder="VD: Kho Hà Nội"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input
                value={warehouseForm.address}
                onChange={(e) =>
                  setWarehouseForm({ ...warehouseForm, address: e.target.value })
                }
                placeholder="Nhập địa chỉ kho"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Điện thoại</Label>
                <Input
                  value={warehouseForm.phone}
                  onChange={(e) =>
                    setWarehouseForm({ ...warehouseForm, phone: e.target.value })
                  }
                  placeholder="Số điện thoại"
                />
              </div>
              <div className="space-y-2">
                <Label>Người quản lý</Label>
                <Input
                  value={warehouseForm.manager_name}
                  onChange={(e) =>
                    setWarehouseForm({ ...warehouseForm, manager_name: e.target.value })
                  }
                  placeholder="Tên người quản lý"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setWarehouseDialogOpen(false);
                  resetWarehouseForm();
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSaveWarehouse}
                disabled={!warehouseForm.code || !warehouseForm.name}
              >
                {editingWarehouse ? "Cập nhật" : "Thêm mới"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo phiếu luân chuyển kho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Từ kho *</Label>
                <Select
                  value={transferForm.from_warehouse_id}
                  onValueChange={(v) =>
                    setTransferForm({ ...transferForm, from_warehouse_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn kho xuất" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem
                        key={wh.id}
                        value={wh.id}
                        disabled={wh.id === transferForm.to_warehouse_id}
                      >
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Đến kho *</Label>
                <Select
                  value={transferForm.to_warehouse_id}
                  onValueChange={(v) =>
                    setTransferForm({ ...transferForm, to_warehouse_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn kho nhập" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem
                        key={wh.id}
                        value={wh.id}
                        disabled={wh.id === transferForm.from_warehouse_id}
                      >
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Add products */}
            <div className="space-y-2">
              <Label>Thêm sản phẩm</Label>
              <div className="flex gap-2">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(Number(e.target.value))}
                  className="w-20"
                  min={1}
                />
                <Button variant="outline" onClick={handleAddTransferItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Items list */}
            {transferForm.items.length > 0 && (
              <div className="border rounded-lg divide-y">
                {transferForm.items.map((item) => {
                  const product = products.find((p) => p.id === item.product_id);
                  return (
                    <div
                      key={item.product_id}
                      className="flex items-center justify-between p-3"
                    >
                      <div>
                        <p className="font-medium">{product?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product?.sku}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">SL: {item.quantity}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveTransferItem(item.product_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Input
                value={transferForm.notes}
                onChange={(e) =>
                  setTransferForm({ ...transferForm, notes: e.target.value })
                }
                placeholder="Ghi chú cho phiếu luân chuyển"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setTransferDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateTransfer}
                disabled={
                  !transferForm.from_warehouse_id ||
                  !transferForm.to_warehouse_id ||
                  transferForm.items.length === 0
                }
              >
                Tạo phiếu
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Warehouses;
