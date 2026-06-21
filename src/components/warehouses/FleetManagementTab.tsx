import { useState } from "react";
import { useDrivers } from "@/hooks/useDrivers";
import { useDeliveryTrips } from "@/hooks/useDeliveryTrips";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Users, Plus, Check, Play, Trash2, Calendar, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function FleetManagementTab() {
  const [fleetTab, setFleetTab] = useState("trips");
  
  // Drivers Hook
  const { drivers, isLoading: driversLoading, createDriver, deleteDriver } = useDrivers();
  const [openDriverDlg, setOpenDriverDlg] = useState(false);
  const [driverForm, setDriverForm] = useState({ name: "", phone: "", license_number: "" });

  // Trips Hook
  const { trips, isLoading: tripsLoading, createTrip, updateTrip, deleteTrip, assignShipments } = useDeliveryTrips();
  const [openTripDlg, setOpenTripDlg] = useState(false);
  const [tripForm, setTripForm] = useState({ driver_id: "", vehicle_info: "", notes: "", planned_start: "", planned_end: "" });

  // Assign shipments dialog state
  const [openAssignDlg, setOpenAssignDlg] = useState(false);
  const [targetTripId, setTargetTripId] = useState<string | null>(null);
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);

  // Fetch unassigned shipments
  const { data: unassignedShipments = [], refetch: refetchUnassigned } = useQuery({
    queryKey: ["unassigned-shipments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select(`
          id,
          tracking_code,
          cod_amount,
          orders!inner(order_number, customer_name, customer_phone, customer_address)
        ` as any)
        .is("trip_id", null);
      if (error) throw error;
      return data as any[];
    }
  });

  const handleCreateDriver = () => {
    if (!driverForm.name) return;
    createDriver.mutate({ ...driverForm, status: "active" }, {
      onSuccess: () => {
        setOpenDriverDlg(false);
        setDriverForm({ name: "", phone: "", license_number: "" });
      }
    });
  };

  const handleCreateTrip = () => {
    if (!tripForm.driver_id || !tripForm.vehicle_info) return;
    createTrip.mutate(
      {
        ...tripForm,
        status: "planned",
        planned_start: tripForm.planned_start ? new Date(tripForm.planned_start).toISOString() : null,
        planned_end: tripForm.planned_end ? new Date(tripForm.planned_end).toISOString() : null,
        actual_start: null,
        actual_end: null,
      },
      {
        onSuccess: () => {
          setOpenTripDlg(false);
          setTripForm({ driver_id: "", vehicle_info: "", notes: "", planned_start: "", planned_end: "" });
        }
      }
    );
  };

  const handleAssignShipments = () => {
    if (!targetTripId || selectedShipmentIds.length === 0) return;
    assignShipments.mutate(
      { tripId: targetTripId, shipmentIds: selectedShipmentIds },
      {
        onSuccess: () => {
          setOpenAssignDlg(false);
          setSelectedShipmentIds([]);
          setTargetTripId(null);
          refetchUnassigned();
        }
      }
    );
  };

  const handleStartTrip = (tripId: string) => {
    updateTrip.mutate({
      id: tripId,
      status: "en_route",
      actual_start: new Date().toISOString()
    }, {
      onSuccess: () => toast.success("Bắt đầu chuyến đi giao hàng!")
    });
  };

  const handleCompleteTrip = (tripId: string) => {
    updateTrip.mutate({
      id: tripId,
      status: "completed",
      actual_end: new Date().toISOString()
    }, {
      onSuccess: () => toast.success("Hoàn thành chuyến giao hàng!")
    });
  };

  const handleToggleShipmentSelection = (id: string) => {
    setSelectedShipmentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <Tabs value={fleetTab} onValueChange={setFleetTab} className="space-y-4">
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="trips" className="gap-2">
            <Truck className="h-4 w-4" />
            Chuyến xe
          </TabsTrigger>
          <TabsTrigger value="drivers" className="gap-2">
            <Users className="h-4 w-4" />
            Tài xế
          </TabsTrigger>
        </TabsList>
        {fleetTab === "drivers" ? (
          <Button onClick={() => setOpenDriverDlg(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm tài xế
          </Button>
        ) : (
          <Button onClick={() => setOpenTripDlg(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Lập chuyến đi
          </Button>
        )}
      </div>

      {/* DRIVERS TAB */}
      <TabsContent value="drivers">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên tài xế</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Số bằng lái</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driversLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Chưa có tài xế nào
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map((drv) => (
                  <TableRow key={drv.id}>
                    <TableCell className="font-semibold">{drv.name}</TableCell>
                    <TableCell>{drv.phone || "-"}</TableCell>
                    <TableCell>{drv.license_number || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={drv.status === "active" ? "default" : drv.status === "on_trip" ? "secondary" : "outline"}>
                        {drv.status === "active" && "Sẵn sàng"}
                        {drv.status === "on_trip" && "Đang đi giao"}
                        {drv.status === "inactive" && "Nghỉ"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteDriver.mutate(drv.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>

      {/* TRIPS TAB */}
      <TabsContent value="trips">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chuyến xe / Biển số</TableHead>
                <TableHead>Tài xế</TableHead>
                <TableHead>Vận đơn</TableHead>
                <TableHead>Kế hoạch</TableHead>
                <TableHead>Thực tế</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tripsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chưa có chuyến xe nào được lập kế hoạch
                  </TableCell>
                </TableRow>
              ) : (
                trips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold flex items-center gap-1.5">
                          <Truck className="h-4 w-4 text-primary" />
                          {trip.vehicle_info}
                        </p>
                        {trip.notes && <p className="text-xs text-muted-foreground">{trip.notes}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{trip.drivers?.name || "Chưa gán"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline">{trip.shipments?.length || 0} Đơn</Badge>
                        {trip.status === "planned" && (
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs text-primary block"
                            onClick={() => {
                              setTargetTripId(trip.id);
                              refetchUnassigned();
                              setOpenAssignDlg(true);
                            }}
                          >
                            + Gán vận đơn
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {trip.planned_start ? new Date(trip.planned_start).toLocaleDateString("vi-VN") : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {trip.actual_start ? `Bắt đầu: ${new Date(trip.actual_start).toLocaleTimeString("vi-VN")}` : ""}
                      {trip.actual_end ? ` - Xong: ${new Date(trip.actual_end).toLocaleTimeString("vi-VN")}` : ""}
                      {!trip.actual_start && "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          trip.status === "completed"
                            ? "default"
                            : trip.status === "en_route"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {trip.status === "planned" && "Chờ chạy"}
                        {trip.status === "loading" && "Đang xếp hàng"}
                        {trip.status === "en_route" && "Đang trên đường"}
                        {trip.status === "completed" && "Đã hoàn thành"}
                        {trip.status === "cancelled" && "Đã hủy"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {trip.status === "planned" && (
                        <Button size="sm" variant="outline" className="text-primary" onClick={() => handleStartTrip(trip.id)}>
                          <Play className="h-3 w-3 mr-1" /> Chạy
                        </Button>
                      )}
                      {trip.status === "en_route" && (
                        <Button size="sm" variant="outline" className="text-success" onClick={() => handleCompleteTrip(trip.id)}>
                          <Check className="h-3 w-3 mr-1" /> Hoàn thành
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteTrip.mutate(trip.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>

      {/* Driver Create Dialog */}
      <Dialog open={openDriverDlg} onOpenChange={setOpenDriverDlg}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm tài xế mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Họ tên tài xế *</Label>
              <Input
                value={driverForm.name}
                onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                placeholder="VD: Nguyễn Văn A"
              />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input
                value={driverForm.phone}
                onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                placeholder="0901234567"
              />
            </div>
            <div className="space-y-2">
              <Label>Số bằng lái (GPLX)</Label>
              <Input
                value={driverForm.license_number}
                onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
                placeholder="VD: Hạng C - 790123..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDriverDlg(false)}>Hủy</Button>
            <Button onClick={handleCreateDriver} disabled={!driverForm.name}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trip Create Dialog */}
      <Dialog open={openTripDlg} onOpenChange={setOpenTripDlg}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lập kế hoạch chuyến đi mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tài xế *</Label>
              <Select
                value={tripForm.driver_id}
                onValueChange={(v) => setTripForm({ ...tripForm, driver_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tài xế" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Thông tin xe (Dòng xe / Biển số) *</Label>
              <Input
                value={tripForm.vehicle_info}
                onChange={(e) => setTripForm({ ...tripForm, vehicle_info: e.target.value })}
                placeholder="VD: Xe Suzuki 500kg - 29C-567.89"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Khởi hành dự kiến</Label>
                <Input
                  type="date"
                  value={tripForm.planned_start}
                  onChange={(e) => setTripForm({ ...tripForm, planned_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Kết thúc dự kiến</Label>
                <Input
                  type="date"
                  value={tripForm.planned_end}
                  onChange={(e) => setTripForm({ ...tripForm, planned_end: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Input
                value={tripForm.notes}
                onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })}
                placeholder="VD: Tuyến giao quận Đống Đa - Ba Đình"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTripDlg(false)}>Hủy</Button>
            <Button onClick={handleCreateTrip} disabled={!tripForm.driver_id || !tripForm.vehicle_info}>Lập chuyến</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Shipments Dialog */}
      <Dialog open={openAssignDlg} onOpenChange={setOpenAssignDlg}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Gán vận đơn chưa giao vào xe</DialogTitle>
            <CardDescription>Chọn các vận đơn phù hợp để xếp lên xe giao hàng</CardDescription>
          </DialogHeader>
          <div className="py-2 space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {unassignedShipments.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">Không có vận đơn nào đang chờ gom xe</p>
            ) : (
              unassignedShipments.map((ship) => {
                const isSelected = selectedShipmentIds.includes(ship.id);
                return (
                  <div
                    key={ship.id}
                    onClick={() => handleToggleShipmentSelection(ship.id)}
                    className={`flex items-start justify-between p-3 border rounded-lg cursor-pointer transition ${
                      isSelected ? "border-primary bg-primary/5" : "hover:bg-secondary/50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-sm">Vận đơn: {ship.tracking_code || `ID: ${ship.id.substring(0,8)}`}</p>
                      <p className="text-xs text-muted-foreground">Mã đơn: {ship.orders?.order_number}</p>
                      <p className="text-xs text-foreground mt-1">Nơi giao: {ship.orders?.customer_address}</p>
                      <p className="text-xs text-muted-foreground">Khách: {ship.orders?.customer_name} ({ship.orders?.customer_phone})</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ship.cod_amount && (
                        <Badge className="bg-amber-500/10 text-amber-700">COD: {ship.cod_amount.toLocaleString()}đ</Badge>
                      )}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by div click
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAssignDlg(false)}>Hủy</Button>
            <Button onClick={handleAssignShipments} disabled={selectedShipmentIds.length === 0}>
              Xếp {selectedShipmentIds.length} vận đơn lên xe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
