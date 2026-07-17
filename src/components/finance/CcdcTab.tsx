import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";
import { Wrench, Plus, Search, User, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInMonths, parseISO } from "date-fns";

export interface CcdcItem {
  id: string;
  code: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchaseValue: number;
  depreciationMonths: number;
  assignedToId: string;
  status: "in_use" | "in_stock" | "repairing" | "liquidated";
}

const CATEGORIES = [
  "Máy tính & Laptop",
  "Bàn ghế văn phòng",
  "Thiết bị ngoại vi",
  "Thiết bị văn phòng",
  "Khác"
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  in_use: { label: "Đang sử dụng", color: "bg-success/10 text-success" },
  in_stock: { label: "Trong kho", color: "bg-info/10 text-info" },
  repairing: { label: "Đang sửa chữa", color: "bg-warning/10 text-warning" },
  liquidated: { label: "Đã thanh lý", color: "bg-muted text-muted-foreground" },
};

const LOCAL_STORAGE_KEY = "erp-mini-local-ccdc-list";

export function CcdcTab() {
  const { members } = useCompanyMembers();
  const [ccdcList, setCcdcList] = useState<CcdcItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Máy tính & Laptop");
  const [newPurchaseDate, setNewPurchaseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newPurchaseValue, setNewPurchaseValue] = useState("");
  const [newDepreciationMonths, setNewDepreciationMonths] = useState("24");

  // Allocate State
  const [isAllocating, setIsAllocating] = useState(false);
  const [selectedCcdc, setSelectedCcdc] = useState<CcdcItem | null>(null);
  const [targetMemberId, setTargetMemberId] = useState("");

  // Load from LocalStorage or Init
  useEffect(() => {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      try {
        setCcdcList(JSON.parse(raw));
      } catch (e) {
        initDefaultCcdc();
      }
    } else {
      initDefaultCcdc();
    }
  }, []);

  const initDefaultCcdc = () => {
    const defaults: CcdcItem[] = [
      {
        id: "ccdc-1",
        code: "CCDC-001",
        name: "MacBook Pro 14 M2 (16GB/512GB)",
        category: "Máy tính & Laptop",
        purchaseDate: "2024-03-15",
        purchaseValue: 32000000,
        depreciationMonths: 24,
        assignedToId: members[0]?.id || "",
        status: members[0] ? "in_use" : "in_stock",
      },
      {
        id: "ccdc-2",
        code: "CCDC-002",
        name: "Ghế công thái học Ergonomic Office",
        category: "Bàn ghế văn phòng",
        purchaseDate: "2024-05-10",
        purchaseValue: 4500000,
        depreciationMonths: 12,
        assignedToId: "",
        status: "in_stock",
      },
      {
        id: "ccdc-3",
        code: "CCDC-003",
        name: "Màn hình Dell UltraSharp U2422H",
        category: "Thiết bị ngoại vi",
        purchaseDate: "2024-01-20",
        purchaseValue: 6500000,
        depreciationMonths: 24,
        assignedToId: members[1]?.id || "",
        status: members[1] ? "in_use" : "in_stock",
      },
      {
        id: "ccdc-4",
        code: "CCDC-004",
        name: "Máy in Epson L3250 Wifi",
        category: "Thiết bị văn phòng",
        purchaseDate: "2023-11-05",
        purchaseValue: 5200000,
        depreciationMonths: 18,
        assignedToId: "",
        status: "repairing",
      }
    ];
    setCcdcList(defaults);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaults));
  };

  const saveList = (updated: CcdcItem[]) => {
    setCcdcList(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  // Helper calculation
  const calculateDepreciation = (item: CcdcItem) => {
    try {
      const pDate = parseISO(item.purchaseDate);
      const monthsPassed = Math.max(0, differenceInMonths(new Date(), pDate));
      const activeMonths = Math.min(item.depreciationMonths, monthsPassed);
      
      const depreciatedValue = Math.round((item.purchaseValue / item.depreciationMonths) * activeMonths);
      const remainingValue = Math.max(0, item.purchaseValue - depreciatedValue);
      return { depreciatedValue, remainingValue };
    } catch (e) {
      return { depreciatedValue: 0, remainingValue: item.purchaseValue };
    }
  };

  // Filtered List
  const filteredCcdc = useMemo(() => {
    return ccdcList.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [ccdcList, searchTerm, statusFilter, categoryFilter]);

  const handleAdd = () => {
    if (!newCode.trim() || !newName.trim() || !newPurchaseValue) {
      toast.error("Vui lòng điền đầy đủ mã, tên và giá trị mua.");
      return;
    }
    
    const val = Number(newPurchaseValue);
    const months = Number(newDepreciationMonths);
    if (isNaN(val) || val <= 0 || isNaN(months) || months <= 0) {
      toast.error("Giá trị mua và số tháng khấu hao phải là số dương.");
      return;
    }

    const newItem: CcdcItem = {
      id: "ccdc-" + Date.now(),
      code: newCode.toUpperCase(),
      name: newName,
      category: newCategory,
      purchaseDate: newPurchaseDate,
      purchaseValue: val,
      depreciationMonths: months,
      assignedToId: "",
      status: "in_stock"
    };

    saveList([...ccdcList, newItem]);
    toast.success(`Đã thêm công cụ dụng cụ ${newItem.code} thành công!`);
    
    // Clear form
    setNewCode("");
    setNewName("");
    setNewPurchaseValue("");
    setIsAddOpen(false);
  };

  const handleAllocate = () => {
    if (!selectedCcdc) return;
    const updated = ccdcList.map(item => {
      if (item.id === selectedCcdc.id) {
        return {
          ...item,
          assignedToId: targetMemberId,
          status: targetMemberId ? "in_use" as const : "in_stock" as const
        };
      }
      return item;
    });
    saveList(updated);
    toast.success(targetMemberId ? "Cấp phát CCDC thành công!" : "Đã thu hồi CCDC về kho!");
    setIsAllocating(false);
    setSelectedCcdc(null);
  };

  const handleStatusChange = (itemId: string, newStatus: CcdcItem["status"]) => {
    const updated = ccdcList.map(item => {
      if (item.id === itemId) {
        const changes: Partial<CcdcItem> = { status: newStatus };
        if (newStatus === "in_stock" || newStatus === "repairing" || newStatus === "liquidated") {
          changes.assignedToId = "";
        }
        return { ...item, ...changes };
      }
      return item;
    });
    saveList(updated);
    toast.success("Cập nhật trạng thái CCDC thành công!");
  };

  const handleDelete = (itemId: string) => {
    if (confirm("Bạn có chắc chắn muốn xoá CCDC này khỏi danh mục không?")) {
      const updated = ccdcList.filter(item => item.id !== itemId);
      saveList(updated);
      toast.success("Đã xoá CCDC khỏi hệ thống!");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header filter & actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div className="flex items-center gap-2 flex-1 w-full max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm mã hoặc tên CCDC..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Phân loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="in_use">Đang sử dụng</SelectItem>
              <SelectItem value="in_stock">Trong kho</SelectItem>
              <SelectItem value="repairing">Đang sửa chữa</SelectItem>
              <SelectItem value="liquidated">Đã thanh lý</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={initDefaultCcdc} className="gap-1.5 flex-1 sm:flex-none">
            <RotateCcw className="h-4 w-4" /> Reset danh mục
          </Button>
          <Button size="sm" onClick={() => setIsAddOpen(true)} className="gap-1.5 flex-1 sm:flex-none">
            <Plus className="h-4 w-4" /> Thêm CCDC
          </Button>
        </div>
      </div>

      {/* Main List */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" /> Sổ đăng ký Công cụ Dụng cụ (CCDC)
          </CardTitle>
          <CardDescription>
            Theo dõi danh sách công cụ dụng cụ, quản lý cấp phát cho nhân sự và khấu hao chi phí tương ứng.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Mã CCDC</TableHead>
                  <TableHead>Tên tài sản</TableHead>
                  <TableHead>Phân loại</TableHead>
                  <TableHead className="text-right">Giá trị mua</TableHead>
                  <TableHead className="text-right">Giá trị còn lại</TableHead>
                  <TableHead>Ngày mua (Khấu hao)</TableHead>
                  <TableHead>Người sử dụng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[160px] text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCcdc.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      Không tìm thấy công cụ dụng cụ nào phù hợp
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCcdc.map(item => {
                    const { depreciatedValue, remainingValue } = calculateDepreciation(item);
                    const matchedMember = members.find(m => m.id === item.assignedToId);
                    const userLabel = matchedMember?.profile?.full_name || "Chưa cấp phát";
                    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.in_stock;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs font-semibold">{item.code}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{item.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.category}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{item.purchaseValue.toLocaleString("vi-VN")}đ</TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold text-primary">
                          {remainingValue.toLocaleString("vi-VN")}đ
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(parseISO(item.purchaseDate), "dd/MM/yyyy")}
                          <span className="text-[10px] text-muted-foreground block">
                            (Thời hạn: {item.depreciationMonths} thg)
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {userLabel}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={item.status === "liquidated"}
                              onClick={() => {
                                setSelectedCcdc(item);
                                setTargetMemberId(item.assignedToId || "");
                                setIsAllocating(true);
                              }}
                            >
                              Cấp phát
                            </Button>
                            <Select
                              value={item.status}
                              onValueChange={(val: any) => handleStatusChange(item.id, val)}
                            >
                              <SelectTrigger className="w-[100px] h-7 text-xs px-2">
                                <SelectValue placeholder="Trạng thái" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="in_use">Sử dụng</SelectItem>
                                <SelectItem value="in_stock">Trong kho</SelectItem>
                                <SelectItem value="repairing">Sửa chữa</SelectItem>
                                <SelectItem value="liquidated">Thanh lý</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive/80"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Add CCDC */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm Công cụ Dụng cụ mới</DialogTitle>
            <DialogDescription>
              Khai báo CCDC mới vào sổ quản lý kế toán tài sản để theo dõi khấu hao và cấp phát.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Mã CCDC</label>
                <Input
                  placeholder="VD: CCDC-009"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Phân loại</label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Tên CCDC / Tài sản</label>
              <Input
                placeholder="VD: Máy in Canon LBP 2900"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Giá trị mua (đ)</label>
                <Input
                  type="number"
                  placeholder="3.500.000"
                  value={newPurchaseValue}
                  onChange={e => setNewPurchaseValue(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Khấu hao (tháng)</label>
                <Input
                  type="number"
                  placeholder="12"
                  value={newDepreciationMonths}
                  onChange={e => setNewDepreciationMonths(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Ngày mua</label>
              <Input
                type="date"
                value={newPurchaseDate}
                onChange={e => setNewPurchaseDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>Hủy</Button>
            <Button size="sm" onClick={handleAdd}>Xác nhận thêm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Allocate */}
      <Dialog open={isAllocating} onOpenChange={setIsAllocating}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cấp phát CCDC</DialogTitle>
            <DialogDescription>
              Gán thiết bị này cho một nhân sự sử dụng hoặc thu hồi về kho.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">CCDC được chọn</label>
              <p className="font-semibold text-sm mt-1">{selectedCcdc?.code} - {selectedCcdc?.name}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Chọn nhân sự nhận cấp phát</label>
              <Select value={targetMemberId} onValueChange={setTargetMemberId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="-- Chọn nhân sự (hoặc để trống để thu hồi) --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Thu hồi về kho --</SelectItem>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.profile?.full_name || "Nhân sự"} ({m.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAllocating(false)}>Hủy</Button>
            <Button size="sm" onClick={handleAllocate}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
