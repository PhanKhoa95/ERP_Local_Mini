import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard, Search, Plus, Loader2, Coins, ArrowUpRight, ArrowDownLeft, ShieldCheck,
  ShieldAlert, Settings, Calendar, RefreshCw, Layers, CheckCircle2, UserCheck, AlertTriangle
} from "lucide-react";
import {
  useMemberships,
  TIER_LABELS,
  TIER_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  TRANSACTION_LABELS,
  type Membership,
  type MembershipTier,
  type MembershipStatus,
  type TransactionType,
} from "@/hooks/useMemberships";
import { usePartners } from "@/hooks/usePartners";
import { useAccounting } from "@/hooks/useAccounting";
import { useToast } from "@/hooks/use-toast";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export default function Memberships() {
  const {
    memberships,
    transactions,
    tierConfigs,
    isLoading,
    createMembership,
    updateMembershipStatus,
    updateMembershipTier,
    performTransaction,
    createMembershipTier,
    updateMembershipTierConfig,
    deleteMembershipTier,
  } = useMemberships();

  const { customers } = usePartners();
  const { toast } = useToast();
  const { role } = useCompanyContext();
  const { logAction } = useAuditLogs();
  const { accounts: accountingAccounts = [] } = useAccounting();
  const isManagerOrAdmin = role === "admin" || role === "manager" || isLocalDemoAuthEnabled();

  const [newCardImage, setNewCardImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [offsetAccountCode, setOffsetAccountCode] = useState(() => {
    return localStorage.getItem("erp-mini-membership-offset-account") || "3387";
  });

  // Dynamic Tiers Editor State
  const [tierEditorOpen, setTierEditorOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<any>(null);
  const [tierId, setTierId] = useState("");
  const [tierName, setTierName] = useState("");
  const [tierColor, setTierColor] = useState("");
  const [tierBgGradient, setTierBgGradient] = useState("");
  const [tierDiscountRate, setTierDiscountRate] = useState(0);
  const [tierMinSpent, setTierMinSpent] = useState(0);
  const [tierDesc, setTierDesc] = useState("");

  const getTierName = (tId: string) => {
    const config = tierConfigs.find(tc => tc.id === tId);
    return config?.name || tId;
  };

  const getTierColor = (tId: string) => {
    const config = tierConfigs.find(tc => tc.id === tId);
    return config?.color || "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getCardBg = (tId: string) => {
    const config = tierConfigs.find(tc => tc.id === tId);
    return config?.bg_gradient || "from-slate-700 to-slate-900 text-slate-50";
  };

  const handleOpenTierEditor = (config: any = null) => {
    if (config) {
      setEditingTier(config);
      setTierId(config.id);
      setTierName(config.name);
      setTierColor(config.color);
      setTierBgGradient(config.bg_gradient);
      setTierDiscountRate(config.discount_rate);
      setTierMinSpent(config.min_spent);
      setTierDesc(config.description || "");
    } else {
      setEditingTier(null);
      setTierId("");
      setTierName("");
      setTierColor("bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900");
      setTierBgGradient("from-purple-600 via-pink-600 to-indigo-800 text-purple-50 shadow-purple-800/20");
      setTierDiscountRate(0);
      setTierMinSpent(0);
      setTierDesc("");
    }
    setTierEditorOpen(true);
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierId || !tierName) return;
    const payload = {
      id: tierId,
      name: tierName,
      color: tierColor,
      bg_gradient: tierBgGradient,
      discount_rate: tierDiscountRate,
      min_spent: tierMinSpent,
      description: tierDesc,
    };
    if (editingTier) {
      await updateMembershipTierConfig.mutateAsync(payload);
    } else {
      await createMembershipTier.mutateAsync(payload);
    }
    setTierEditorOpen(false);
  };

  // Selected state
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionType>("deposit");
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txDesc, setTxDesc] = useState<string>("");

  // Create form state
  const [newPartnerId, setNewPartnerId] = useState<string>("");
  const [newCardNumber, setNewCardNumber] = useState<string>("");
  const [newTier, setNewTier] = useState<string>("bronze");
  const [newNotes, setNewNotes] = useState<string>("Phát hành thẻ thành viên");

  // Find active card list and current selected membership
  const currentMembership = useMemo(() => {
    if (!selectedMembershipId && memberships.length > 0) {
      return memberships[0];
    }
    return memberships.find(m => m.id === selectedMembershipId) || memberships[0] || null;
  }, [memberships, selectedMembershipId]);

  // Find partner details for memberships
  const membershipsWithPartner = useMemo(() => {
    return memberships.map(m => {
      const partner = customers.find(c => c.id === m.partner_id);
      return {
        ...m,
        partnerName: partner?.name || "Khách hàng ẩn danh",
        partnerPhone: partner?.phone || "Chưa có SĐT",
        partnerEmail: partner?.email || "",
      };
    });
  }, [memberships, customers]);

  // Selectable customers for new cards (all customers)
  const availableCustomers = useMemo(() => {
    return customers;
  }, [customers]);

  // Auto-generate card number when partner changes
  const handlePartnerSelect = (pid: string) => {
    setNewPartnerId(pid);
    const partner = customers.find(c => c.id === pid);
    if (partner) {
      const suffix = partner.phone ? partner.phone.slice(-6) : Math.floor(100000 + Math.random() * 900000).toString();
      setNewCardNumber(`MEM-${suffix}`);
    }
  };

  // Filtered list
  const filteredMemberships = useMemo(() => {
    return membershipsWithPartner.filter(m => {
      const matchesSearch =
        m.card_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.partnerPhone.includes(searchQuery);

      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      const matchesTier = tierFilter === "all" || m.tier === tierFilter;

      return matchesSearch && matchesStatus && matchesTier;
    });
  }, [membershipsWithPartner, searchQuery, statusFilter, tierFilter]);

  const handleCardImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Lỗi file",
        description: "Vui lòng chọn file hình ảnh",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Lỗi file",
        description: "Kích thước file không được vượt quá 5MB",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      if (isLocalDemoAuthEnabled()) {
        const LOCAL_IMAGE_MAX_DIMENSION = 900;
        const LOCAL_IMAGE_QUALITY = 0.72;

        const readFileAsDataUrl = (f: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error ?? new Error("Không thể đọc file ảnh"));
            reader.readAsDataURL(f);
          });
        };

        const loadImage = (src: string): Promise<HTMLImageElement> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Không thể xử lý file ảnh"));
            img.src = src;
          });
        };

        const dataUrl = await readFileAsDataUrl(file);
        if (file.type === "image/svg+xml") {
          setNewCardImage(dataUrl);
        } else {
          const img = await loadImage(dataUrl);
          const scale = Math.min(
            1,
            LOCAL_IMAGE_MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight)
          );
          const width = Math.max(1, Math.round(img.naturalWidth * scale));
          const height = Math.max(1, Math.round(img.naturalHeight * scale));

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (context) {
            context.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", LOCAL_IMAGE_QUALITY);
            setNewCardImage(compressed);
          } else {
            setNewCardImage(dataUrl);
          }
        }
        toast({ title: "Đã nạp hình ảnh local thành công" });
      } else {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `cards/${fileName}`;

        let uploadBucket = "membership-cards";
        let uploadResult = await supabase.storage.from(uploadBucket).upload(filePath, file);

        if (uploadResult.error) {
          uploadBucket = "member-cards";
          uploadResult = await supabase.storage.from(uploadBucket).upload(filePath, file);
        }

        if (uploadResult.error) throw uploadResult.error;

        const { data } = supabase.storage.from(uploadBucket).getPublicUrl(filePath);
        setNewCardImage(data.publicUrl);
        toast({ title: "Upload hình ảnh thẻ thành công" });
      }
    } catch (err: any) {
      console.error("Card image upload failed:", err);
      toast({
        variant: "destructive",
        title: "Lỗi tải ảnh",
        description: err.message || "Không thể tải hình ảnh lên",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleOffsetAccountChange = async (newCode: string) => {
    const oldCode = offsetAccountCode;
    setOffsetAccountCode(newCode);
    localStorage.setItem("erp-mini-membership-offset-account", newCode);
    toast({
      title: "Cấu hình thành công",
      description: `Đã đổi tài khoản đối ứng từ ${oldCode} sang ${newCode}`,
    });

    try {
      await logAction(
        "Thay đổi tài khoản đối ứng ví thành viên",
        "shop_settings",
        "wallet_offset_account_id",
        { accountId: oldCode },
        { accountId: newCode }
      );
    } catch (e) {
      console.error("Failed to log setting change to audit logs", e);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.map(tx => {
      const m = membershipsWithPartner.find(mem => mem.id === tx.membership_id);
      return {
        ...tx,
        card_number: m?.card_number || "N/A",
        partnerName: m?.partnerName || "Ẩn danh",
      };
    });
  }, [transactions, membershipsWithPartner]);

  // Handle operations
  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerId || !newCardNumber) return;
    await createMembership.mutateAsync({
      partner_id: newPartnerId,
      card_number: newCardNumber,
      tier: newTier,
      status: "active",
      expiry_date: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
      notes: newNotes,
      card_image: newCardImage || undefined,
    });
    setCreateDialogOpen(false);
    setNewPartnerId("");
    setNewCardNumber("");
    setNewCardImage(null);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMembership || txAmount <= 0) return;
    await performTransaction.mutateAsync({
      membershipId: currentMembership.id,
      type: txType,
      amount: txAmount,
      description: txDesc || TRANSACTION_LABELS[txType],
    });
    setTxDialogOpen(false);
    setTxAmount(0);
    setTxDesc("");
  };

  const handleStatusChange = async (id: string, currentStatus: MembershipStatus) => {
    const nextStatus: MembershipStatus = currentStatus === "active" ? "locked" : "active";
    await updateMembershipStatus.mutateAsync({ id, status: nextStatus });
  };

  const handleTierChange = async (id: string, tier: MembershipTier) => {
    await updateMembershipTier.mutateAsync({ id, tier });
  };



  if (isLoading) {
    return (
      <MainLayout>
        <Header title="Thẻ thành viên" subtitle="Quản lý thẻ tích điểm và tài khoản trả trước" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const selectedWithPartner = (membershipsWithPartner.find(m => m.id === currentMembership?.id) || currentMembership) as any;

  return (
    <MainLayout>
      <Header
        title="Thẻ thành viên & Ví"
        subtitle="Quản lý thẻ tích điểm thông minh, tài khoản mua hàng trả trước của khách hàng"
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: VISUAL PREVIEW & MAIN STATS (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Visual Card Simulation */}
            {selectedWithPartner ? (
              <Card className="overflow-hidden border-none shadow-xl">
                <div 
                  className={cn(
                    "p-6 bg-gradient-to-br relative min-h-[220px] rounded-xl flex flex-col justify-between transition-all duration-300",
                    selectedWithPartner.card_image ? "bg-slate-900 text-white" : getCardBg(selectedWithPartner.tier)
                  )}
                  style={selectedWithPartner.card_image ? { backgroundImage: `url(${selectedWithPartner.card_image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                >
                  {selectedWithPartner.card_image && (
                    <div className="absolute inset-0 bg-black/45 rounded-xl pointer-events-none" />
                  )}
                  {/* Glassmorphic overlay grid */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none rounded-xl" />
                  
                  <div className="flex justify-between items-start z-10">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest opacity-80">Thẻ thành viên</p>
                      <h4 className="text-lg font-bold tracking-tight uppercase">VIETERP SMART CARD</h4>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[10px] uppercase font-bold border px-2 py-0.5 backdrop-blur-md bg-white/10 border-white/20",
                      selectedWithPartner.tier === "gold" ? "text-yellow-950 border-yellow-900/20" : "text-white"
                    )}>
                      {TIER_LABELS[selectedWithPartner.tier]}
                    </Badge>
                  </div>

                  {/* Smart chip representation */}
                  <div className="w-10 h-8 rounded bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300 border border-amber-400/40 relative overflow-hidden z-10 my-4 shadow-sm">
                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-700/20" />
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-700/20" />
                  </div>

                  <div className="z-10 space-y-4">
                    {/* Monospace card number */}
                    <div className="text-xl font-mono tracking-wider font-semibold">
                      {selectedWithPartner.card_number}
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5">
                        <p className="text-[9px] uppercase opacity-70">Chủ thẻ</p>
                        <p className="text-sm font-medium">{selectedWithPartner.partnerName}</p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-[9px] uppercase opacity-70">Hạn dùng</p>
                        <p className="text-xs font-mono">{selectedWithPartner.expiry_date}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-[220px] flex items-center justify-center border-dashed">
                <div className="text-center text-muted-foreground p-4">
                  <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Chưa chọn thẻ thành viên</p>
                </div>
              </Card>
            )}

            {/* Wallet Balances Card */}
            {selectedWithPartner && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-primary" /> Số dư tài khoản & Điểm thưởng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10">
                      <p className="text-xs text-muted-foreground">Tài khoản mua hàng</p>
                      <h3 className="text-xl font-bold mt-1 text-primary">
                        {selectedWithPartner.balance.toLocaleString("vi-VN")}đ
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Dùng để thanh toán POS nhanh</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <p className="text-xs text-muted-foreground">Điểm tích lũy</p>
                      <h3 className="text-xl font-bold mt-1 text-amber-600">
                        {selectedWithPartner.points.toLocaleString("vi-VN")} điểm
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Tích lũy 1% mỗi đơn hàng</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() => { setTxType("deposit"); setTxDialogOpen(true); }}
                      className="flex-1 text-xs"
                      size="sm"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Nạp tiền ví
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setTxType("payment"); setTxDialogOpen(true); }}
                      className="flex-1 text-xs"
                      size="sm"
                      disabled={selectedWithPartner.balance <= 0}
                    >
                      <ArrowDownLeft className="h-3.5 w-3.5 mr-1" /> Thanh toán
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions / Configuration */}
            {selectedWithPartner && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <Settings className="h-4 w-4 text-primary" /> Thiết lập thẻ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-1">
                    <div>
                      <p className="text-xs font-semibold">Trạng thái thẻ</p>
                      <p className="text-[10px] text-muted-foreground">Khóa hoặc mở khóa thẻ tạm thời</p>
                    </div>
                    <Button
                      variant={selectedWithPartner.status === "active" ? "destructive" : "default"}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleStatusChange(selectedWithPartner.id, selectedWithPartner.status)}
                    >
                      {selectedWithPartner.status === "active" ? "Khóa thẻ" : "Mở khóa"}
                    </Button>
                  </div>

                  <div className="flex justify-between items-center py-1 border-t pt-3">
                    <div>
                      <p className="text-xs font-semibold">Hạng thành viên</p>
                      <p className="text-[10px] text-muted-foreground">Cập nhật quyền lợi phân khúc</p>
                    </div>
                    <Select
                      value={selectedWithPartner.tier}
                      onValueChange={(val: MembershipTier) => handleTierChange(selectedWithPartner.id, val)}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIER_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: DIRECTORIES & HISTORY TABS (7 cols) */}
          <div className="lg:col-span-7">
            <Tabs defaultValue="cards" className="w-full">
              <TabsList className={cn("grid mb-4", isManagerOrAdmin ? "grid-cols-3" : "grid-cols-2")}>
                <TabsTrigger value="cards" className="text-xs sm:text-sm">Danh sách thẻ</TabsTrigger>
                <TabsTrigger value="txs" className="text-xs sm:text-sm">Lịch sử giao dịch</TabsTrigger>
                {isManagerOrAdmin && (
                  <TabsTrigger value="settings" className="text-xs sm:text-sm">Cài đặt ví</TabsTrigger>
                )}
              </TabsList>

              {/* TAB 1: CARD DIRECTORY */}
              <TabsContent value="cards" className="space-y-4 focus-visible:outline-none">
                <Card>
                  <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">Danh mục thẻ thành viên</CardTitle>
                      <CardDescription>Tìm kiếm thẻ theo mã số hoặc tên/SĐT khách hàng</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1.5" /> Phát hành thẻ mới
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Filters bar */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Mã thẻ, tên, số điện thoại..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 h-9 text-xs"
                        />
                      </div>
                      <Select value={tierFilter} onValueChange={setTierFilter}>
                        <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs">
                          <SelectValue placeholder="Hạng thẻ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">Tất cả hạng</SelectItem>
                          {Object.entries(TIER_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs">
                          <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">Tất cả trạng thái</SelectItem>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Table list */}
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Mã thẻ / Khách hàng</TableHead>
                            <TableHead className="text-xs text-center">Hạng</TableHead>
                            <TableHead className="text-xs text-right">Số dư ví</TableHead>
                            <TableHead className="text-xs text-center">Trạng thái</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMemberships.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                                Không tìm thấy thẻ thành viên nào.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredMemberships.map((m) => (
                              <TableRow
                                key={m.id}
                                className={cn(
                                  "cursor-pointer hover:bg-muted/50",
                                  selectedMembershipId === m.id && "bg-muted"
                                )}
                                onClick={() => setSelectedMembershipId(m.id)}
                              >
                                <TableCell className="py-2.5">
                                  <div className="flex items-center gap-2">
                                    {m.card_image ? (
                                      <div className="h-8 w-12 rounded border bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${m.card_image})` }} />
                                    ) : (
                                      <div className="h-8 w-12 rounded border bg-muted flex items-center justify-center shrink-0">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-mono text-xs font-semibold">{m.card_number}</div>
                                      <div className="text-xs font-medium text-foreground">{m.partnerName}</div>
                                      <div className="text-[10px] text-muted-foreground">{m.partnerPhone}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center py-2.5">
                                  <Badge className={cn("text-[9px] uppercase px-1.5 py-0 border", TIER_COLORS[m.tier])}>
                                    {m.tier}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium text-xs py-2.5">
                                  {m.balance.toLocaleString("vi-VN")}đ
                                  <div className="text-[9px] text-amber-600 font-bold">{m.points} điểm</div>
                                </TableCell>
                                <TableCell className="text-center py-2.5">
                                  <Badge className={cn("text-[9px] px-1.5 py-0 border", STATUS_COLORS[m.status])}>
                                    {STATUS_LABELS[m.status]}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: TRANSACTION HISTORY */}
              <TabsContent value="txs" className="space-y-4 focus-visible:outline-none">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Nhật ký giao dịch ví mua hàng</CardTitle>
                    <CardDescription>Báo cáo chi tiết các giao dịch nạp tiền và thanh toán đơn hàng bằng thẻ</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Thời gian / Thẻ</TableHead>
                            <TableHead className="text-xs">Khách hàng</TableHead>
                            <TableHead className="text-xs">Nội dung</TableHead>
                            <TableHead className="text-xs text-right">Số tiền</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                                Chưa có giao dịch nào được ghi nhận.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredTransactions.map((tx) => {
                              const isAddition = tx.type === "deposit" || tx.type === "refund";
                              return (
                                <TableRow key={tx.id}>
                                  <TableCell className="py-2.5">
                                    <div className="text-[10px] text-muted-foreground">
                                      {new Date(tx.created_at).toLocaleString("vi-VN")}
                                    </div>
                                    <div className="font-mono text-[10px] font-semibold">{tx.card_number}</div>
                                  </TableCell>
                                  <TableCell className="text-xs py-2.5">{tx.partnerName}</TableCell>
                                  <TableCell className="py-2.5">
                                    <div className="text-xs font-medium">{tx.description}</div>
                                    <Badge variant="secondary" className="text-[9px] px-1 py-0 scale-90 -ml-1">
                                      {TRANSACTION_LABELS[tx.type]}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className={cn(
                                    "text-right text-xs font-bold py-2.5",
                                    isAddition ? "text-green-600" : "text-destructive"
                                  )}>
                                    {isAddition ? "+" : "-"}{tx.amount.toLocaleString("vi-VN")}đ
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
              </TabsContent>

              {isManagerOrAdmin && (
                <TabsContent value="settings" className="space-y-6 focus-visible:outline-none">
                  {/* Cấu hình ví */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" /> Cấu hình Ví thành viên
                      </CardTitle>
                      <CardDescription>
                        Chọn tài khoản kế toán đối ứng khi khách hàng nạp tiền, hoàn tiền hoặc thanh toán bằng ví.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tài khoản đối ứng Ví mua hàng *</Label>
                        <Select value={offsetAccountCode} onValueChange={handleOffsetAccountChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn tài khoản kế toán..." />
                          </SelectTrigger>
                          <SelectContent>
                            {accountingAccounts
                              .filter(a => a.account_type === "liability" || a.account_type === "asset")
                              .map((a) => (
                                <SelectItem key={a.code} value={a.code}>
                                  {a.code} - {a.name} ({a.account_type === "liability" ? "Nợ phải trả" : "Tài sản"})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Các tài khoản thông dụng: 3387 (Doanh thu chưa thực hiện / Nhận trước), 131 (Phải thu khách hàng), 3388 (Phải trả khác)...
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cấu hình hạng thẻ */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" /> Cấu hình Hạng thành viên
                        </CardTitle>
                        <CardDescription>
                          Định nghĩa các hạng thẻ thành viên, quyền lợi chiết khấu và điều kiện tích lũy chi tiêu.
                        </CardDescription>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleOpenTierEditor()}>
                        <Plus className="h-4 w-4 mr-1.5" /> Thêm hạng thẻ
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Tên hạng</TableHead>
                              <TableHead className="text-xs">Mức chi tiêu tối thiểu</TableHead>
                              <TableHead className="text-xs text-center">Chiết khấu</TableHead>
                              <TableHead className="text-xs text-right">Thao tác</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tierConfigs.map((tc) => (
                              <TableRow key={tc.id}>
                                <TableCell className="py-2.5">
                                  <div className="flex items-center gap-2">
                                    <Badge className={cn("text-[9px] px-1.5 py-0 border", tc.color)}>
                                      {tc.name}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground font-mono">({tc.id})</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2.5 text-xs">
                                  {tc.min_spent.toLocaleString("vi-VN")}đ
                                </TableCell>
                                <TableCell className="py-2.5 text-xs text-center font-bold text-green-600">
                                  {tc.discount_rate}%
                                </TableCell>
                                <TableCell className="py-2.5 text-right space-x-1">
                                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => handleOpenTierEditor(tc)}>
                                    Sửa
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-destructive" onClick={() => {
                                    if (confirm(`Bạn có chắc chắn muốn xóa hạng thẻ "${tc.name}" không?`)) {
                                      deleteMembershipTier.mutate(tc.id);
                                    }
                                  }}>
                                    Xóa
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>

      {/* CREATE CARD DIALOG */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Phát hành thẻ thành viên</DialogTitle>
            <DialogDescription>Chọn khách hàng và đặt mã thẻ thành viên tương ứng</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCard} className="space-y-4">
            <div className="space-y-2">
              <Label>Khách hàng liên kết *</Label>
              <Select value={newPartnerId} onValueChange={handlePartnerSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khách hàng..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCustomers.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-3 text-center">
                      Tất cả khách hàng hiện tại đã có thẻ thành viên.
                    </div>
                  ) : (
                    availableCustomers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="card_number">Mã số thẻ (Tự sinh hoặc quét barcode) *</Label>
              <Input
                id="card_number"
                value={newCardNumber}
                onChange={(e) => setNewCardNumber(e.target.value)}
                placeholder="VD: MEM-123456"
              />
            </div>

            <div className="space-y-2">
              <Label>Hạng thành viên ban đầu</Label>
              <Select value={newTier} onValueChange={(val: string) => setNewTier(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tierConfigs.map((tc) => (
                    <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="card_notes">Ghi chú phát hành</Label>
              <Input
                id="card_notes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="VD: Khách hàng thân thiết..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-image-upload">Hình ảnh thẻ thành viên</Label>
              <Input
                id="card-image-upload"
                type="file"
                accept="image/*"
                onChange={handleCardImageChange}
                disabled={isUploadingImage}
              />
              {newCardImage && (
                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border">
                  <img src={newCardImage} alt="Card preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setNewCardImage(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={!newPartnerId || !newCardNumber || createMembership.isPending || isUploadingImage}>
                {createMembership.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* TIER EDITOR DIALOG */}
      <Dialog open={tierEditorOpen} onOpenChange={setTierEditorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTier ? "Chỉnh sửa hạng thẻ" : "Thêm hạng thẻ mới"}</DialogTitle>
            <DialogDescription>Cấu hình quyền lợi, điều kiện và giao diện hiển thị cho hạng thẻ</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveTier} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tier-id">Mã hạng thẻ *</Label>
                <Input
                  id="tier-id"
                  value={tierId}
                  onChange={(e) => setTierId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  placeholder="VD: platinum"
                  disabled={!!editingTier}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier-name">Tên hạng hiển thị *</Label>
                <Input
                  id="tier-name"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  placeholder="VD: Bạch Kim"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tier-discount">Chiết khấu đơn hàng (%)</Label>
                <Input
                  id="tier-discount"
                  type="number"
                  min={0}
                  max={100}
                  value={tierDiscountRate}
                  onChange={(e) => setTierDiscountRate(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier-min-spent">Doanh số tối thiểu (đ)</Label>
                <Input
                  id="tier-min-spent"
                  type="number"
                  min={0}
                  value={tierMinSpent}
                  onChange={(e) => setTierMinSpent(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier-desc">Mô tả quyền lợi</Label>
              <Input
                id="tier-desc"
                value={tierDesc}
                onChange={(e) => setTierDesc(e.target.value)}
                placeholder="VD: Giảm ngay 7% cho tất cả đơn hàng..."
              />
            </div>

            <div className="space-y-2">
              <Label>Kiểu hiển thị (Màu Badge CSS)</Label>
              <Select value={tierColor} onValueChange={setTierColor}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900">Màu Tím (Purple)</SelectItem>
                  <SelectItem value="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900">Màu Cam (Orange)</SelectItem>
                  <SelectItem value="bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800">Màu Bạc (Silver/Slate)</SelectItem>
                  <SelectItem value="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-900">Màu Vàng (Gold)</SelectItem>
                  <SelectItem value="bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-900">Màu Xanh Ngọc (Cyan/Diamond)</SelectItem>
                  <SelectItem value="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900">Màu Xanh Lá (Emerald/VIP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Màu Thẻ 3D (Background Gradient CSS)</Label>
              <Select value={tierBgGradient} onValueChange={setTierBgGradient}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="from-purple-600 via-pink-600 to-indigo-800 text-purple-50 shadow-purple-800/20">Gradient Tím-Hồng Sang Trọng</SelectItem>
                  <SelectItem value="from-amber-700 via-amber-800 to-amber-950 text-amber-50 shadow-amber-950/20">Gradient Đồng Cổ Điển</SelectItem>
                  <SelectItem value="from-slate-500 via-slate-600 to-slate-800 text-slate-50 shadow-slate-900/20">Gradient Bạc Hiện Đại</SelectItem>
                  <SelectItem value="from-amber-400 via-yellow-500 to-amber-600 text-yellow-950 shadow-yellow-500/10">Gradient Vàng Hoàng Gia</SelectItem>
                  <SelectItem value="from-cyan-500 via-blue-600 to-indigo-800 text-cyan-50 shadow-blue-800/20">Gradient Kim Cương Huyền Ảo</SelectItem>
                  <SelectItem value="from-emerald-600 via-teal-700 to-emerald-950 text-emerald-50 shadow-emerald-950/20">Gradient Lục Bảo Quý Phái</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTierEditorOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={!tierId || !tierName || createMembershipTier.isPending || updateMembershipTierConfig.isPending}>
                Xác nhận
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* WALLET TRANSACTION DIALOG */}
      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {txType === "deposit" ? "Nạp tiền vào tài khoản" : "Thanh toán ví"}
            </DialogTitle>
            <DialogDescription>
              {selectedWithPartner
                ? `Thực hiện giao dịch tài khoản cho thẻ ${selectedWithPartner.card_number} (${selectedWithPartner.partnerName})`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransactionSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Số tiền giao dịch (đ) *</Label>
              <Input
                id="tx-amount"
                type="number"
                min={1000}
                step={1000}
                value={txAmount || ""}
                onChange={(e) => setTxAmount(parseInt(e.target.value) || 0)}
                placeholder="Nhập số tiền (ví dụ: 100,000)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-desc">Mô tả giao dịch *</Label>
              <Textarea
                id="tx-desc"
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                placeholder={txType === "deposit" ? "VD: Nạp tiền mặt tại quầy..." : "VD: Thanh toán trực tiếp tại quầy..."}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTxDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={txAmount <= 0 || performTransaction.isPending}>
                {performTransaction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận giao dịch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
