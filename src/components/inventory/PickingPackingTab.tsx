import { useState } from "react";
import { usePickingLists, PickingList, PickingListItem } from "@/hooks/usePickingLists";
import { useWarehouseLocations } from "@/hooks/useWarehouseLocations";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";
import { useWarehouses } from "@/hooks/useWarehouses";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Plus,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Truck,
  Box,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function PickingPackingTab() {
  const { pickingLists, isLoading, createPickingList, updateItemPicked, updateStatus } = usePickingLists();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();
  const { members } = useCompanyMembers();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<PickingList | null>(null);
  
  // Create state
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Array<{ product_id: string; quantity_requested: number; location_id: string }>>([]);
  
  // Add item state
  const [currentProductId, setCurrentProductId] = useState("");
  const [currentQty, setCurrentQty] = useState(1);
  const [currentLocationId, setCurrentLocationId] = useState("");

  // Fetch locations for selected warehouse
  const { locations } = useWarehouseLocations(selectedWarehouseId);

  const handleOpenDetail = (list: PickingList) => {
    setSelectedList(list);
    setDetailDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!currentProductId || currentQty <= 0) return;
    
    // Add to items list
    setItems([
      ...items,
      {
        product_id: currentProductId,
        quantity_requested: currentQty,
        location_id: currentLocationId || "",
      },
    ]);
    
    // Reset item input
    setCurrentProductId("");
    setCurrentQty(1);
    setCurrentLocationId("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    if (!selectedWarehouseId || items.length === 0) return;
    
    createPickingList.mutate({
      warehouse_id: selectedWarehouseId,
      assigned_to: assignedTo || undefined,
      notes: notes || undefined,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity_requested: item.quantity_requested,
        location_id: item.location_id || undefined,
      })),
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        // Reset form
        setSelectedWarehouseId("");
        setAssignedTo("");
        setNotes("");
        setItems([]);
      }
    });
  };

  const handleUpdateItem = (item: PickingListItem, qty: number, status: "pending" | "picked" | "short") => {
    updateItemPicked.mutate({
      itemId: item.id,
      quantity_picked: qty,
      status: status,
    }, {
      onSuccess: () => {
        // Refresh local selected list detail
        if (selectedList) {
          const updatedItems = selectedList.items?.map(i => 
            i.id === item.id 
              ? { ...i, quantity_picked: qty, status } 
              : i
          );
          setSelectedList({
            ...selectedList,
            items: updatedItems,
          });
        }
      }
    });
  };

  const handleStatusChange = (status: PickingList["status"]) => {
    if (!selectedList) return;
    updateStatus.mutate({
      id: selectedList.id,
      status,
    }, {
      onSuccess: () => {
        setSelectedList({
          ...selectedList,
          status,
        });
      }
    });
  };

  const getStatusBadge = (status: PickingList["status"]) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Chờ xử lý</Badge>;
      case "picking":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Đang nhặt hàng</Badge>;
      case "packed":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Đã đóng gói</Badge>;
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Hoàn thành</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Phiếu Nhặt Hàng & Đóng Gói</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý việc soạn hàng từ kệ kho phục vụ đóng gói và giao hàng.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo phiếu nhặt
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã phiếu</TableHead>
              <TableHead>Kho hàng</TableHead>
              <TableHead>Người thực hiện</TableHead>
              <TableHead>Số sản phẩm</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pickingLists.map((list) => {
              const itemCount = list.items?.length || 0;
              return (
                <TableRow key={list.id} className="cursor-pointer" onClick={() => handleOpenDetail(list)}>
                  <TableCell className="font-mono font-medium">
                    {list.id.substring(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>{list.warehouses?.name || "Không xác định"}</TableCell>
                  <TableCell>
                    {list.assignee_profile?.full_name ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{list.assignee_profile.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Chưa phân công</span>
                    )}
                  </TableCell>
                  <TableCell>{itemCount} sản phẩm</TableCell>
                  <TableCell>{getStatusBadge(list.status)}</TableCell>
                  <TableCell>
                    {format(new Date(list.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenDetail(list); }}>
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {pickingLists.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Chưa có phiếu nhặt hàng nào được tạo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo phiếu nhặt hàng mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kho xuất hàng *</Label>
                <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn kho" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nhân viên soạn hàng</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhân viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.profile?.full_name || member.email || member.user_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                placeholder="Nhập ghi chú cho phiếu soạn hàng..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="border p-4 rounded-lg space-y-3 bg-secondary/20">
              <h4 className="font-semibold text-sm">Thêm sản phẩm cần nhặt</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Sản phẩm *</Label>
                  <Select value={currentProductId} onValueChange={setCurrentProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Số lượng *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={currentQty}
                    onChange={(e) => setCurrentQty(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vị trí kệ</Label>
                  <Select value={currentLocationId} onValueChange={setCurrentLocationId} disabled={!selectedWarehouseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn kệ" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name} {loc.zone ? `(Khu ${loc.zone})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="button" variant="outline" className="w-full mt-2" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" /> Thêm vào danh sách
              </Button>
            </div>

            {/* Added Items List */}
            {items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Kệ nhặt hàng</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => {
                      const prod = products.find(p => p.id === item.product_id);
                      const loc = locations.find(l => l.id === item.location_id);
                      return (
                        <TableRow key={idx}>
                          <TableCell>
                            <p className="font-medium">{prod?.name}</p>
                            <p className="text-xs text-muted-foreground">{prod?.sku}</p>
                          </TableCell>
                          <TableCell className="font-semibold">{item.quantity_requested}</TableCell>
                          <TableCell>{loc ? `${loc.name} (${loc.zone || ""})` : "Mặc định"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRemoveItem(idx)}>
                              Xóa
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleCreate} disabled={!selectedWarehouseId || items.length === 0}>
                Tạo phiếu soạn hàng
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Chi tiết phiếu nhặt hàng: <span className="font-mono">{selectedList?.id.substring(0, 8).toUpperCase()}</span></span>
              <span>{selectedList && getStatusBadge(selectedList.status)}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedList && (
            <div className="space-y-6">
              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-secondary/10 p-4 rounded-lg text-sm">
                <div>
                  <span className="text-muted-foreground block">Kho xuất hàng:</span>
                  <span className="font-semibold">{selectedList.warehouses?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Người thực hiện:</span>
                  <span className="font-semibold">{selectedList.assignee_profile?.full_name || "Chưa phân công"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Ngày tạo:</span>
                  <span className="font-semibold">
                    {format(new Date(selectedList.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Ghi chú:</span>
                  <span className="font-semibold text-xs italic">{selectedList.notes || "Không có"}</span>
                </div>
              </div>

              {/* Status workflow actions */}
              <div className="flex flex-wrap items-center gap-2 p-3 border rounded-lg bg-background">
                <span className="text-sm font-semibold mr-2">Quy trình soạn hàng:</span>
                
                {selectedList.status === "pending" && (
                  <Button size="sm" onClick={() => handleStatusChange("picking")}>
                    <Layers className="h-4 w-4 mr-2" /> Bắt đầu soạn hàng
                  </Button>
                )}

                {selectedList.status === "picking" && (
                  <Button size="sm" variant="secondary" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleStatusChange("packed")}>
                    <Box className="h-4 w-4 mr-2" /> Đóng gói hoàn tất
                  </Button>
                )}

                {selectedList.status === "packed" && (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleStatusChange("completed")}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Hoàn thành xuất kho
                  </Button>
                )}

                {selectedList.status !== "completed" && selectedList.status !== "cancelled" && (
                  <Button size="sm" variant="destructive" onClick={() => handleStatusChange("cancelled")}>
                    <XCircle className="h-4 w-4 mr-2" /> Hủy phiếu nhặt
                  </Button>
                )}

                {(selectedList.status === "completed" || selectedList.status === "cancelled") && (
                  <span className="text-muted-foreground text-xs italic">Phiếu đã ở trạng thái cuối cùng, không thể cập nhật thêm.</span>
                )}
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Kệ nhặt</TableHead>
                      <TableHead className="text-center">Số lượng cần</TableHead>
                      <TableHead className="text-center w-32">Số lượng nhặt</TableHead>
                      <TableHead className="text-center">Trạng thái dòng</TableHead>
                      {selectedList.status !== "completed" && selectedList.status !== "cancelled" && (
                        <TableHead className="text-right">Cập nhật</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedList.items?.map((item) => {
                      const isReadOnly = selectedList.status === "completed" || selectedList.status === "cancelled";
                      return (
                        <ItemRow
                          key={item.id}
                          item={item}
                          isReadOnly={isReadOnly}
                          onUpdate={(qty, status) => handleUpdateItem(item, qty, status)}
                        />
                      );
                    })}
                    {(!selectedList.items || selectedList.items.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          Không có sản phẩm nào trong phiếu nhặt này.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inner helper component for each item row
interface ItemRowProps {
  item: PickingListItem;
  isReadOnly: boolean;
  onUpdate: (qty: number, status: "pending" | "picked" | "short") => void;
}

function ItemRow({ item, isReadOnly, onUpdate }: ItemRowProps) {
  const [pickedQty, setPickedQty] = useState(item.quantity_picked);
  const [lineStatus, setLineStatus] = useState<"pending" | "picked" | "short">(item.status);

  const handleQuickComplete = () => {
    setPickedQty(item.quantity_requested);
    setLineStatus("picked");
    onUpdate(item.quantity_requested, "picked");
  };

  const handleSave = () => {
    onUpdate(pickedQty, lineStatus);
  };

  const getLineStatusBadge = (status: PickingListItem["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Chờ nhặt</Badge>;
      case "picked":
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Đã nhặt đủ</Badge>;
      case "short":
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">Thiếu hàng</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <TableRow>
      <TableCell>
        <p className="font-semibold text-sm">{item.products?.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{item.products?.sku}</p>
      </TableCell>
      <TableCell>
        {item.warehouse_locations?.name ? (
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-xs">
              {item.warehouse_locations.name}
              {item.warehouse_locations.zone ? ` (Khu ${item.warehouse_locations.zone})` : ""}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs italic">Chưa chỉ định</span>
        )}
      </TableCell>
      <TableCell className="text-center font-bold">{item.quantity_requested} {item.products?.unit || "Cái"}</TableCell>
      <TableCell className="text-center">
        {isReadOnly ? (
          <span className="font-semibold">{item.quantity_picked}</span>
        ) : (
          <Input
            type="number"
            min={0}
            max={item.quantity_requested}
            value={pickedQty}
            onChange={(e) => setPickedQty(Number(e.target.value))}
            className="w-20 mx-auto text-center"
          />
        )}
      </TableCell>
      <TableCell className="text-center">
        {isReadOnly ? (
          getLineStatusBadge(item.status)
        ) : (
          <Select value={lineStatus} onValueChange={(val: any) => setLineStatus(val)}>
            <SelectTrigger className="w-28 mx-auto h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Chờ nhặt</SelectItem>
              <SelectItem value="picked">Đã nhặt</SelectItem>
              <SelectItem value="short">Thiếu hàng</SelectItem>
            </SelectContent>
          </Select>
        )}
      </TableCell>
      {!isReadOnly && (
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" onClick={handleQuickComplete}>
              Xong nhanh
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSave}>
              Lưu
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
