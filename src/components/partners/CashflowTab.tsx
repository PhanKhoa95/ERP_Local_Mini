import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Banknote,
  Plus,
  Loader2,
  Trash2,
  Lock,
  Unlock,
  Copy,
  TrendingDown,
  TrendingUp,
  Download,
  Upload,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Scale
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LocalPaymentTransaction {
  id: string;
  partner_id: string;
  order_id: string | null;
  transaction_type: 'receivable' | 'payable' | 'payment_in' | 'payment_out';
  amount: number;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  transaction_date: string;
  created_by: string | null;
  created_at: string;
  tag?: string | null;
  hach_toan?: boolean;
  locked?: boolean;
  is_ads?: boolean;
  ads_account?: string | null;
  ads_campaign?: string | null;
}

const TRANSACTIONS_KEY = "erp-mini-local-demo-payment-transactions";
const PARTNERS_KEY = "erp-mini-local-demo-partners";

export function CashflowTab() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<LocalPaymentTransaction[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // Form State
  const [amount, setAmount] = useState("");
  const [txType, setTxType] = useState<"payment_in" | "payment_out">("payment_in");
  const [partnerId, setPartnerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("tien_mat");
  const [refNumber, setRefNumber] = useState("");
  const [tag, setTag] = useState("Tiền hàng");
  const [hachToan, setHachToan] = useState(true);
  const [locked, setLocked] = useState(false);
  const [isAds, setIsAds] = useState(false);
  const [adsAccount, setAdsAccount] = useState("");
  const [adsCampaign, setAdsCampaign] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // CSV Import state
  const [csvContent, setCsvContent] = useState("");

  const loadData = () => {
    const rawTx = localStorage.getItem(TRANSACTIONS_KEY);
    if (rawTx) {
      try {
        setTransactions(JSON.parse(rawTx));
      } catch (e) {
        setTransactions([]);
      }
    }
    const rawPartners = localStorage.getItem(PARTNERS_KEY);
    if (rawPartners) {
      try {
        setPartners(JSON.parse(rawPartners));
      } catch (e) {
        setPartners([]);
      }
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("storage", loadData);
    };
  }, []);

  const saveTransactions = (newList: LocalPaymentTransaction[]) => {
    setTransactions(newList);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newList));
    window.dispatchEvent(new Event("storage"));
  };

  // Tags list
  const availableTags = ["Tiền hàng", "Vận chuyển", "Lương nhân viên", "Mặt bằng", "Quảng cáo FB", "Quảng cáo TikTok", "Nguyên phụ liệu", "Chi phí khác"];

  // Filtered transactions
  const filteredList = useMemo(() => {
    return transactions.filter((tx) => {
      const partner = partners.find((p) => p.id === tx.partner_id);
      const partnerName = partner ? partner.name.toLowerCase() : "";
      const matchesSearch =
        (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.reference_number && tx.reference_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        partnerName.includes(searchTerm.toLowerCase());

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "in" && tx.transaction_type === "payment_in") ||
        (typeFilter === "out" && tx.transaction_type === "payment_out") ||
        (typeFilter === "ads" && tx.is_ads);

      const matchesTag = tagFilter === "all" || tx.tag === tagFilter;

      let matchesDate = true;
      if (dateRange === "today") {
        const todayStr = new Date().toDateString();
        matchesDate = new Date(tx.transaction_date).toDateString() === todayStr;
      } else if (dateRange === "week") {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        matchesDate = new Date(tx.transaction_date).getTime() >= weekAgo;
      } else if (dateRange === "month") {
        const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        matchesDate = new Date(tx.transaction_date).getTime() >= monthAgo;
      }

      return matchesSearch && matchesType && matchesTag && matchesDate;
    });
  }, [transactions, partners, searchTerm, typeFilter, tagFilter, dateRange]);

  // Statistics
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let adsOut = 0;

    transactions.forEach((tx) => {
      if (tx.hach_toan === false) return;
      if (tx.transaction_type === "payment_in") {
        totalIn += tx.amount;
      } else if (tx.transaction_type === "payment_out") {
        totalOut += tx.amount;
        if (tx.is_ads) {
          adsOut += tx.amount;
        }
      }
    });

    return {
      totalIn,
      totalOut,
      adsOut,
      balance: totalIn - totalOut,
    };
  }, [transactions]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setAmount("");
    setTxType("payment_in");
    setPartnerId(partners[0]?.id || "");
    setPaymentMethod("tien_mat");
    setRefNumber("");
    setTag("Tiền hàng");
    setHachToan(true);
    setLocked(false);
    setIsAds(false);
    setAdsAccount("");
    setAdsCampaign("");
    setNotes("");
    setCreateDialogOpen(true);
  };

  const handleEdit = (tx: LocalPaymentTransaction) => {
    if (tx.locked) {
      toast({ title: "Thông báo", description: "Phiếu đã khóa, không thể sửa đổi.", variant: "destructive" });
      return;
    }
    setEditingId(tx.id);
    setAmount(String(tx.amount));
    setTxType(tx.transaction_type === "payment_out" ? "payment_out" : "payment_in");
    setPartnerId(tx.partner_id || "");
    setPaymentMethod(tx.payment_method || "tien_mat");
    setRefNumber(tx.reference_number || "");
    setTag(tx.tag || "Tiền hàng");
    setHachToan(tx.hach_toan ?? true);
    setLocked(tx.locked ?? false);
    setIsAds(tx.is_ads ?? false);
    setAdsAccount(tx.ads_account || "");
    setAdsCampaign(tx.ads_campaign || "");
    setNotes(tx.notes || "");
    setCreateDialogOpen(true);
  };

  const handleCopy = (tx: LocalPaymentTransaction) => {
    setEditingId(null);
    setAmount(String(tx.amount));
    setTxType(tx.transaction_type === "payment_out" ? "payment_out" : "payment_in");
    setPartnerId(tx.partner_id || "");
    setPaymentMethod(tx.payment_method || "tien_mat");
    setRefNumber(`${tx.reference_number || ""}-COPY`);
    setTag(tx.tag || "Tiền hàng");
    setHachToan(tx.hach_toan ?? true);
    setLocked(false);
    setIsAds(tx.is_ads ?? false);
    setAdsAccount(tx.ads_account || "");
    setAdsCampaign(tx.ads_campaign || "");
    setNotes(`Bản sao của: ${tx.notes || ""}`);
    setCreateDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Lỗi", description: "Vui lòng nhập số tiền hợp lệ", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const updatedList = [...transactions];
      if (editingId) {
        const idx = updatedList.findIndex((t) => t.id === editingId);
        if (idx > -1) {
          updatedList[idx] = {
            ...updatedList[idx],
            partner_id: partnerId,
            transaction_type: txType,
            amount: numAmount,
            payment_method: paymentMethod,
            reference_number: refNumber || null,
            notes: notes || null,
            tag: tag,
            hach_toan: hachToan,
            locked: locked,
            is_ads: isAds,
            ads_account: isAds ? adsAccount : null,
            ads_campaign: isAds ? adsCampaign : null,
            transaction_date: new Date().toISOString(),
          };
          toast({ title: "Đã cập nhật phiếu thu chi thành công" });
        }
      } else {
        const newTx: LocalPaymentTransaction = {
          id: `tx-${Date.now()}`,
          partner_id: partnerId,
          order_id: null,
          transaction_type: txType,
          amount: numAmount,
          payment_method: paymentMethod,
          reference_number: refNumber || `REF-${Date.now().toString().slice(-6)}`,
          notes: notes || null,
          transaction_date: new Date().toISOString(),
          created_by: "admin",
          created_at: new Date().toISOString(),
          tag: tag,
          hach_toan: hachToan,
          locked: locked,
          is_ads: isAds,
          ads_account: isAds ? adsAccount : null,
          ads_campaign: isAds ? adsCampaign : null,
        };
        updatedList.unshift(newTx);
        toast({ title: "Đã tạo phiếu thu chi thành công" });
      }

      saveTransactions(updatedList);
      setCreateDialogOpen(false);
      setIsSubmitting(false);
    }, 800);
  };

  const handleBulkAction = (action: "lock" | "unlock" | "delete") => {
    if (selectedIds.length === 0) return;

    let updatedList = [...transactions];
    let affected = 0;

    if (action === "delete") {
      // Check locks first
      const hasLocked = selectedIds.some((id) => {
        const t = transactions.find((x) => x.id === id);
        return t?.locked;
      });
      if (hasLocked) {
        toast({
          title: "Lỗi",
          description: "Không thể xóa vì có chứa phiếu đã bị Khóa.",
          variant: "destructive",
        });
        return;
      }
      updatedList = updatedList.filter((tx) => !selectedIds.includes(tx.id));
      affected = selectedIds.length;
    } else {
      updatedList = updatedList.map((tx) => {
        if (selectedIds.includes(tx.id)) {
          affected++;
          return {
            ...tx,
            locked: action === "lock",
          };
        }
        return tx;
      });
    }

    saveTransactions(updatedList);
    setSelectedIds([]);
    toast({
      title: "Thao tác thành công",
      description: `Đã áp dụng thay đổi cho ${affected} phiếu thu chi.`,
    });
  };

  const loadImportDemo = () => {
    const sample = [
      `payment_out, 1200000, chuyen_khoan, Quảng cáo FB, Chi ngân sách ads tk 02`,
      `payment_in, 850000, cod, Tiền hàng, Nhận COD đối soát Kỳ 26`,
      `payment_out, 5000000, chuyen_khoan, Lương nhân viên, Trả lương phụ kho tháng 6`,
      `payment_out, 300000, tien_mat, Chi phí khác, Mua văn phòng phẩm`
    ].join("\n");
    setCsvContent(sample);
  };

  const handleImportCSV = () => {
    if (!csvContent.trim()) return;

    const lines = csvContent.split("\n");
    const newList = [...transactions];
    let count = 0;

    lines.forEach((line) => {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 2) return;

      const type = parts[0] === "payment_in" || parts[0] === "thu" ? "payment_in" : "payment_out";
      const value = parseFloat(parts[1]) || 0;
      const method = parts[2] || "tien_mat";
      const label = parts[3] || "Mặc định";
      const memo = parts[4] || "Nhập từ file Excel";

      if (value <= 0) return;

      const newTx: LocalPaymentTransaction = {
        id: `tx-import-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        partner_id: partners[0]?.id || "partner-default",
        order_id: null,
        transaction_type: type,
        amount: value,
        payment_method: method,
        reference_number: `IMP-${Math.floor(Math.random() * 100000)}`,
        notes: memo,
        transaction_date: new Date().toISOString(),
        created_by: "admin",
        created_at: new Date().toISOString(),
        tag: label,
        hach_toan: true,
        locked: false,
      };

      newList.unshift(newTx);
      count++;
    });

    saveTransactions(newList);
    setImportDialogOpen(false);
    setCsvContent("");
    toast({
      title: "Nhập dữ liệu thành công",
      description: `Đã thêm ${count} phiếu thu chi vào sổ quỹ thu chi.`,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredList.map((tx) => tx.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  return (
    <div className="space-y-6 text-foreground text-xs">
      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-none bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/15">
          <CardContent className="p-4">
            <span className="text-muted-foreground text-[10px] block font-semibold">TỔNG THU (HẠCH TOÁN)</span>
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              +{stats.totalIn.toLocaleString("vi-VN")}đ
            </span>
            <span className="text-[10px] text-emerald-600 font-medium block mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Dòng tiền thu về
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-none bg-gradient-to-br from-red-500/10 to-pink-500/5 border-red-500/15">
          <CardContent className="p-4">
            <span className="text-muted-foreground text-[10px] block font-semibold">TỔNG CHI (HẠCH TOÁN)</span>
            <span className="text-xl font-bold font-mono text-red-600 dark:text-red-400">
              -{stats.totalOut.toLocaleString("vi-VN")}đ
            </span>
            <span className="text-[10px] text-red-600 font-medium block mt-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> Chi phí vận hành
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-none bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/15">
          <CardContent className="p-4">
            <span className="text-muted-foreground text-[10px] block font-semibold">CHI QUẢNG CÁO</span>
            <span className="text-xl font-bold font-mono text-orange-600 dark:text-orange-400">
              {stats.adsOut.toLocaleString("vi-VN")}đ
            </span>
            <span className="text-[10px] text-muted-foreground block mt-1">
              Facebook / TikTok ads budget
            </span>
          </CardContent>
        </Card>
        <Card className={cn("shadow-none border-blue-500/15 bg-gradient-to-br", stats.balance >= 0 ? "from-blue-500/10 to-indigo-500/5" : "from-red-500/10 to-orange-500/5")}>
          <CardContent className="p-4">
            <span className="text-muted-foreground text-[10px] block font-semibold">SỐ DƯ QUỸ</span>
            <span className={cn("text-xl font-bold font-mono", stats.balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600")}>
              {stats.balance >= 0 ? "+" : ""}
              {stats.balance.toLocaleString("vi-VN")}đ
            </span>
            <span className="text-[10px] text-muted-foreground block mt-1">
              Số dư quỹ tiền mặt & ngân hàng
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Action bar */}
      <Card className="shadow-none">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm nội dung, mã..."
                  className="pl-8 h-8 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Loại" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="in">Phiếu thu</SelectItem>
                  <SelectItem value="out">Phiếu chi</SelectItem>
                  <SelectItem value="ads">Chi quảng cáo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Thẻ" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Tất cả thẻ</SelectItem>
                  {availableTags.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 justify-end w-full sm:w-auto">
              <Button size="sm" variant="outline" className="h-8 text-xs font-semibold" onClick={() => setImportDialogOpen(true)}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Nhập Excel
              </Button>
              <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1" onClick={handleOpenCreate}>
                <Plus className="h-3.5 w-3.5" /> Tạo phiếu thu chi
              </Button>
            </div>
          </div>

          {/* Bulk Actions display */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/15 rounded-lg">
              <span className="font-semibold text-blue-600">Đang chọn {selectedIds.length} phiếu</span>
              <div className="ml-auto flex items-center gap-1">
                <Button size="sm" variant="outline" className="h-7 text-[10px] font-semibold gap-1" onClick={() => handleBulkAction("lock")}>
                  <Lock className="h-3 w-3" /> Khóa
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[10px] font-semibold gap-1" onClick={() => handleBulkAction("unlock")}>
                  <Unlock className="h-3 w-3" /> Mở khóa
                </Button>
                <Button size="sm" variant="destructive" className="h-7 text-[10px] font-semibold gap-1" onClick={() => handleBulkAction("delete")}>
                  <Trash2 className="h-3 w-3" /> Xóa đã chọn
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground">
                  <th className="p-3 text-left w-8">
                    <Checkbox
                      checked={filteredList.length > 0 && selectedIds.length === filteredList.length}
                      onCheckedChange={(val) => handleSelectAll(!!val)}
                    />
                  </th>
                  <th className="p-3 text-left font-medium">Mã giao dịch / Ngày</th>
                  <th className="p-3 text-left font-medium">Đối tác / Phân loại</th>
                  <th className="p-3 text-right font-medium">Số tiền</th>
                  <th className="p-3 text-left font-medium">Nội dung ghi chú</th>
                  <th className="p-3 text-center font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((tx) => {
                  const partner = partners.find((p) => p.id === tx.partner_id);
                  const isIncoming = tx.transaction_type === "payment_in";

                  return (
                    <tr key={tx.id} className={cn("border-b hover:bg-secondary/15 transition-colors", tx.locked && "bg-secondary/5")}>
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.includes(tx.id)}
                          onCheckedChange={(val) => handleSelectOne(tx.id, !!val)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-bold font-mono text-foreground">{tx.reference_number}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(tx.transaction_date).toLocaleDateString("vi-VN")}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-foreground">{partner ? partner.name : "Vãng lai / Không tên"}</div>
                        <div className="flex gap-1 items-center mt-1">
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            {tx.tag || "Chưa phân loại"}
                          </Badge>
                          {tx.is_ads && (
                            <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[9px] px-1 py-0 font-bold">
                              Ads
                            </Badge>
                          )}
                          {tx.locked && (
                            <Badge className="bg-secondary text-muted-foreground text-[8px] px-1 py-0 gap-0.5">
                              <Lock className="h-2 w-2" /> Khóa
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold">
                        <span className={isIncoming ? "text-emerald-600" : "text-red-500"}>
                          {isIncoming ? "+" : "-"}
                          {tx.amount.toLocaleString("vi-VN")}đ
                        </span>
                      </td>
                      <td className="p-3 max-w-[200px] truncate" title={tx.notes || ""}>
                        <span className="text-muted-foreground">{tx.notes || "—"}</span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleEdit(tx)} disabled={tx.locked}>
                            Sửa
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => handleCopy(tx)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Không tìm thấy giao dịch thu chi nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Create/Edit Cashflow Transaction */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Banknote className="h-5 w-5 text-blue-600" />
              {editingId ? "Cập nhật phiếu thu chi" : "Tạo phiếu thu chi mới"}
            </DialogTitle>
            <DialogDescription>
              Nhập các giá trị hạch toán tài chính vào sổ quỹ.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2 text-foreground">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold">Loại giao dịch</Label>
                <Select value={txType} onValueChange={(val: any) => setTxType(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="payment_in">Phiếu thu</SelectItem>
                    <SelectItem value="payment_out">Phiếu chi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Đối tác</Label>
                <Select value={partnerId} onValueChange={setPartnerId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="txAmount" className="font-semibold">Số tiền (VNĐ)</Label>
                <Input
                  id="txAmount"
                  type="number"
                  placeholder="Ví dụ: 500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Thẻ phân loại</Label>
                <Select value={tag} onValueChange={setTag}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {availableTags.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold">Hình thức</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="tien_mat">Tiền mặt</SelectItem>
                    <SelectItem value="chuyen_khoan">Chuyển khoản</SelectItem>
                    <SelectItem value="vietqr">Mã VietQR</SelectItem>
                    <SelectItem value="momo">Ví MoMo</SelectItem>
                    <SelectItem value="vnpay">Ví VNPAY</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="txRef" className="font-semibold">Mã tham chiếu (nếu có)</Label>
                <Input
                  id="txRef"
                  placeholder="Ví dụ: MB-9908"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Ads Expense section */}
            <div className="space-y-2 border p-3 rounded-lg bg-secondary/10">
              <div className="flex items-center gap-2">
                <Checkbox id="isAdsCheck" checked={isAds} onCheckedChange={(val) => setIsAds(!!val)} />
                <Label htmlFor="isAdsCheck" className="font-bold leading-none cursor-pointer text-orange-600">
                  Dạng chi phí Quảng cáo (Facebook/TikTok ads)
                </Label>
              </div>
              {isAds && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Tài khoản QC</Label>
                    <Input className="h-7" placeholder="TK-01" value={adsAccount} onChange={(e) => setAdsAccount(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Chiến dịch</Label>
                    <Input className="h-7" placeholder="Summer-Campaign" value={adsCampaign} onChange={(e) => setAdsCampaign(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {/* Note & Action flags */}
            <div className="space-y-1">
              <Label htmlFor="txNotes" className="font-semibold">Ghi chú nội dung</Label>
              <Textarea
                id="txNotes"
                placeholder="Nội dung phát sinh thu chi..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-16"
              />
            </div>

            <div className="flex items-center gap-4 pt-1 bg-secondary/5 p-2 rounded border">
              <div className="flex items-center gap-1.5">
                <Checkbox id="flagHachToan" checked={hachToan} onCheckedChange={(val) => setHachToan(!!val)} />
                <Label htmlFor="flagHachToan" className="cursor-pointer text-[10px]">Hạch toán</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <Checkbox id="flagLocked" checked={locked} onCheckedChange={(val) => setLocked(!!val)} />
                <Label htmlFor="flagLocked" className="cursor-pointer text-[10px] text-red-500 font-semibold flex items-center gap-0.5">
                  <Lock className="h-2.5 w-2.5" /> Khóa phiếu
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isSubmitting}>
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Lưu thay đổi" : "Lưu phiếu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Import Excel CSV */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Upload className="h-5 w-5 text-blue-600" /> Nhập dữ liệu thu chi từ Excel / CSV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs text-foreground">
            <div className="flex items-center justify-between">
              <Label htmlFor="csvImportArea" className="font-semibold">Nội dung CSV</Label>
              <Button size="sm" variant="outline" className="h-6 text-[10px] border-dashed text-blue-600 hover:text-blue-700" onClick={loadImportDemo}>
                Tải mẫu thu chi
              </Button>
            </div>
            <Textarea
              id="csvImportArea"
              placeholder="Dạng: Loại, Số tiền, Hình thức, Thẻ, Ngày, Nội dung. Ví dụ:&#13;payment_out, 1200000, chuyen_khoan, Quảng cáo FB, Chi ad tk 02"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="h-48 font-mono text-[11px]"
            />
            <p className="text-[10px] text-muted-foreground italic">
              * Lưu ý: loại thu chi phải là payment_in (thu) hoặc payment_out (chi).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleImportCSV} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              Nhập dữ liệu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
