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
import { cn } from "@/lib/utils";

export default function Memberships() {
  const {
    memberships,
    transactions,
    isLoading,
    createMembership,
    updateMembershipStatus,
    updateMembershipTier,
    performTransaction,
  } = useMemberships();

  const { customers } = usePartners();

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
  const [newTier, setNewTier] = useState<MembershipTier>("bronze");
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

  // Selectable customers for new cards (those who do not have a card yet)
  const availableCustomers = useMemo(() => {
    return customers.filter(c => !memberships.some(m => m.partner_id === c.id));
  }, [customers, memberships]);

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
    });
    setCreateDialogOpen(false);
    setNewPartnerId("");
    setNewCardNumber("");
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

  // Card gradient backgrounds for gorgeous visualization
  const getCardBg = (tier: MembershipTier) => {
    switch (tier) {
      case "bronze":
        return "from-amber-700 via-amber-800 to-amber-950 text-amber-50 shadow-amber-950/20";
      case "silver":
        return "from-slate-500 via-slate-600 to-slate-800 text-slate-50 shadow-slate-900/20";
      case "gold":
        return "from-amber-400 via-yellow-500 to-amber-600 text-yellow-950 shadow-yellow-500/10";
      case "diamond":
        return "from-cyan-500 via-blue-600 to-indigo-800 text-cyan-50 shadow-blue-800/20";
      default:
        return "from-slate-700 to-slate-900 text-slate-50";
    }
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
                <div className={cn(
                  "p-6 bg-gradient-to-br relative min-h-[220px] rounded-xl flex flex-col justify-between transition-all duration-300",
                  getCardBg(selectedWithPartner.tier)
                )}>
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
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="cards" className="text-xs sm:text-sm">Danh sách thẻ</TabsTrigger>
                <TabsTrigger value="txs" className="text-xs sm:text-sm">Lịch sử giao dịch</TabsTrigger>
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
                                  <div className="font-mono text-xs font-semibold">{m.card_number}</div>
                                  <div className="text-xs font-medium text-foreground">{m.partnerName}</div>
                                  <div className="text-[10px] text-muted-foreground">{m.partnerPhone}</div>
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
              <Select value={newTier} onValueChange={(val: MembershipTier) => setNewTier(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIER_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={!newPartnerId || !newCardNumber || createMembership.isPending}>
                {createMembership.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
