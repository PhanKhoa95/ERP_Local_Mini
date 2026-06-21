import { useState } from "react";
import { usePriceLists, PriceList, PriceListItem } from "@/hooks/usePriceLists";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Plus,
  Edit2,
  Trash2,
  Settings2,
  Loader2,
  Tags,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function PriceListsTab() {
  const { priceLists, isLoading, createPriceList, updatePriceList, deletePriceList, savePriceListItems } = usePriceLists();
  const { products } = useProducts();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<PriceList | null>(null);

  // Form states for Create/Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Items configure state
  const [configItems, setConfigItems] = useState<Array<{ product_id: string; custom_price: number; min_quantity: number }>>([]);
  const [addProductId, setAddProductId] = useState("");
  const [addPrice, setAddPrice] = useState<number>(0);
  const [addMinQty, setAddMinQty] = useState<number>(1);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setName("");
    setDescription("");
    setIsActive(true);
    setStartDate("");
    setEndDate("");
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (list: PriceList) => {
    setIsEditing(true);
    setEditId(list.id);
    setName(list.name);
    setDescription(list.description || "");
    setIsActive(list.is_active);
    setStartDate(list.start_date ? format(new Date(list.start_date), "yyyy-MM-dd") : "");
    setEndDate(list.end_date ? format(new Date(list.end_date), "yyyy-MM-dd") : "");
    setCreateDialogOpen(true);
  };

  const handleSaveList = () => {
    if (!name) return;

    const payload = {
      name,
      description: description || null,
      is_active: isActive,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
    };

    if (isEditing) {
      updatePriceList.mutate({ id: editId, ...payload }, {
        onSuccess: () => setCreateDialogOpen(false)
      });
    } else {
      createPriceList.mutate(payload, {
        onSuccess: () => setCreateDialogOpen(false)
      });
    }
  };

  const handleOpenItemsConfig = (list: PriceList) => {
    setSelectedList(list);
    // Populate items
    const populated = (list.items || []).map(item => ({
      product_id: item.product_id,
      custom_price: item.custom_price,
      min_quantity: item.min_quantity,
    }));
    setConfigItems(populated);
    setAddProductId("");
    setAddPrice(0);
    setAddMinQty(1);
    setItemsDialogOpen(true);
  };

  const handleAddConfigItem = () => {
    if (!addProductId || addPrice < 0 || addMinQty <= 0) return;
    
    // Check if duplicate
    const existingIdx = configItems.findIndex(item => item.product_id === addProductId && item.min_quantity === addMinQty);
    if (existingIdx !== -1) {
      // Update price
      const updated = [...configItems];
      updated[existingIdx].custom_price = addPrice;
      setConfigItems(updated);
    } else {
      setConfigItems([
        ...configItems,
        {
          product_id: addProductId,
          custom_price: addPrice,
          min_quantity: addMinQty,
        }
      ]);
    }
    
    // Clear item fields
    setAddProductId("");
    setAddPrice(0);
    setAddMinQty(1);
  };

  const handleRemoveConfigItem = (index: number) => {
    setConfigItems(configItems.filter((_, i) => i !== index));
  };

  const handleSaveItems = () => {
    if (!selectedList) return;
    
    savePriceListItems.mutate({
      priceListId: selectedList.id,
      items: configItems,
    }, {
      onSuccess: () => setItemsDialogOpen(false)
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bảng giá này không?")) {
      deletePriceList.mutate(id);
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
          <h2 className="text-xl font-bold tracking-tight">Cấu Hình Bảng Giá Động</h2>
          <p className="text-sm text-muted-foreground">
            Thiết lập bảng giá sỉ, giá chiết khấu, giá khuyến mãi theo phân khúc và số lượng mua tối thiểu.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo bảng giá mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {priceLists.map((list) => {
          const itemCount = list.items?.length || 0;
          return (
            <Card key={list.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Tags className="h-4 w-4 text-primary" />
                      {list.name}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {list.description || "Không có mô tả"}
                    </CardDescription>
                  </div>
                  <Badge variant={list.is_active ? "default" : "secondary"}>
                    {list.is_active ? "Hoạt động" : "Nháp"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div className="text-xs text-muted-foreground flex flex-col gap-1.5">
                  <div className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{itemCount} Quy tắc giá sản phẩm</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {list.start_date || list.end_date ? (
                        <>
                          {list.start_date ? format(new Date(list.start_date), "dd/MM/yyyy") : "..."} 
                          {" "} <ArrowRight className="inline h-3 w-3 mx-1" /> {" "}
                          {list.end_date ? format(new Date(list.end_date), "dd/MM/yyyy") : "Vô thời hạn"}
                        </>
                      ) : (
                        "Không giới hạn thời gian"
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t mt-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleOpenItemsConfig(list)}>
                    <Settings2 className="h-3.5 w-3.5 mr-1" /> Cấu hình giá
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleOpenEdit(list)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(list.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {priceLists.length === 0 && (
          <div className="col-span-full border border-dashed rounded-lg p-12 text-center text-muted-foreground">
            Chưa có bảng giá nào được tạo. Nhấp vào "Tạo bảng giá mới" để bắt đầu.
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Chỉnh sửa bảng giá" : "Tạo bảng giá mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tên bảng giá *</Label>
              <Input
                placeholder="VD: Bảng giá bán sỉ miền Bắc, VIP 1..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả chi tiết</Label>
              <Textarea
                placeholder="Mô tả đối tượng hoặc chương trình áp dụng..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label className="cursor-pointer" htmlFor="price-list-active">Kích hoạt hoạt động</Label>
              <Switch
                id="price-list-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveList} disabled={!name}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pricing Rules Detail Config Dialog */}
      <Dialog open={itemsDialogOpen} onOpenChange={setItemsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Thiết lập quy tắc giá: <span className="text-primary">{selectedList?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add pricing rule section */}
            <div className="border p-4 rounded-lg space-y-3 bg-secondary/20">
              <h4 className="font-semibold text-sm">Thêm sản phẩm áp dụng giá riêng</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Sản phẩm *</Label>
                  <Select value={addProductId} onValueChange={setAddProductId}>
                    <SelectTrigger>
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
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Số lượng tối thiểu mua *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={addMinQty}
                    onChange={(e) => setAddMinQty(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Giá áp dụng (VND) *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={addPrice}
                    onChange={(e) => setAddPrice(Number(e.target.value))}
                  />
                </div>
              </div>
              <Button type="button" size="sm" className="w-full mt-2" onClick={handleAddConfigItem} disabled={!addProductId}>
                <Plus className="h-4 w-4 mr-2" /> Thêm quy tắc giá
              </Button>
            </div>

            {/* Rules list */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="text-center">Số lượng tối thiểu</TableHead>
                    <TableHead className="text-right">Giá gốc</TableHead>
                    <TableHead className="text-right text-primary">Giá áp dụng riêng</TableHead>
                    <TableHead className="text-center w-24">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configItems.map((item, idx) => {
                    const prod = products.find(p => p.id === item.product_id);
                    const diffPct = prod && Number(prod.selling_price) > 0 
                      ? Math.round(((Number(prod.selling_price) - item.custom_price) / Number(prod.selling_price)) * 100)
                      : 0;

                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <p className="font-semibold text-sm">{prod?.name || "Không xác định"}</p>
                          <p className="text-xs text-muted-foreground font-mono">{prod?.sku}</p>
                        </TableCell>
                        <TableCell className="text-center font-semibold">Từ {item.min_quantity} sản phẩm</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {prod ? Number(prod.selling_price).toLocaleString() : 0} đ
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                          <div className="flex flex-col items-end">
                            <span>{item.custom_price.toLocaleString()} đ</span>
                            {diffPct > 0 && (
                              <span className="text-[10px] text-orange-500 font-medium flex items-center gap-0.5">
                                <TrendingDown className="h-2.5 w-2.5" /> Giảm {diffPct}%
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveConfigItem(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {configItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Chưa cấu hình sản phẩm nào cho bảng giá này.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setItemsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveItems} disabled={savePriceListItems.isPending}>
              {savePriceListItems.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi quy tắc
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
