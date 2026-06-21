import { useState } from "react";
import { useWarehouseLocations } from "@/hooks/useWarehouseLocations";
import { useWarehouses } from "@/hooks/useWarehouses";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Search, Trash2, Loader2 } from "lucide-react";

export function WarehouseLocationsTab() {
  const { warehouses } = useWarehouses();
  const [selectedWh, setSelectedWh] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { locations, isLoading, createLocation, deleteLocation } = useWarehouseLocations(
    selectedWh === "all" ? undefined : selectedWh
  );

  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    warehouse_id: "",
    name: "",
    zone: "",
    aisle: "",
    shelf: "",
    bin: "",
  });

  const handleCreate = () => {
    if (!form.warehouse_id || !form.name) return;
    createLocation.mutate(
      {
        ...form,
        is_active: true,
      },
      {
        onSuccess: () => {
          setOpenCreate(false);
          setForm({ warehouse_id: "", name: "", zone: "", aisle: "", shelf: "", bin: "" });
        },
      }
    );
  };

  const filtered = locations.filter((loc) =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.zone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm vị trí giá kệ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedWh} onValueChange={setSelectedWh}>
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
        <Button onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm vị trí
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vị trí</TableHead>
              <TableHead>Kho hàng</TableHead>
              <TableHead>Khu vực (Zone)</TableHead>
              <TableHead>Dãy (Aisle)</TableHead>
              <TableHead>Kệ (Shelf)</TableHead>
              <TableHead>Hộp/Ô (Bin)</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Không tìm thấy vị trí nào
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {loc.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{loc.warehouses?.name}</Badge>
                  </TableCell>
                  <TableCell>{loc.zone || "-"}</TableCell>
                  <TableCell>{loc.aisle || "-"}</TableCell>
                  <TableCell>{loc.shelf || "-"}</TableCell>
                  <TableCell>{loc.bin || "-"}</TableCell>
                  <TableCell>
                    <Badge className="bg-success/10 text-success">Hoạt động</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Xóa vị trí này?")) deleteLocation.mutate(loc.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm vị trí kho chi tiết</DialogTitle>
            <CardDescription>Cấu hình vị trí nhặt hàng phụ vụ Picking/Packing</CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Kho hàng *</Label>
              <Select
                value={form.warehouse_id}
                onValueChange={(v) => setForm({ ...form, warehouse_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kho chứa" />
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
              <Label>Tên vị trí *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Kệ A-1-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Khu vực (Zone)</Label>
                <Input
                  value={form.zone}
                  onChange={(e) => setForm({ ...form, zone: e.target.value })}
                  placeholder="Khu A"
                />
              </div>
              <div className="space-y-2">
                <Label>Dãy (Aisle)</Label>
                <Input
                  value={form.aisle}
                  onChange={(e) => setForm({ ...form, aisle: e.target.value })}
                  placeholder="Dãy 1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tầng kệ (Shelf)</Label>
                <Input
                  value={form.shelf}
                  onChange={(e) => setForm({ ...form, shelf: e.target.value })}
                  placeholder="Tầng 2"
                />
              </div>
              <div className="space-y-2">
                <Label>Ô/Hộp (Bin)</Label>
                <Input
                  value={form.bin}
                  onChange={(e) => setForm({ ...form, bin: e.target.value })}
                  placeholder="Ô 3"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={!form.warehouse_id || !form.name}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
