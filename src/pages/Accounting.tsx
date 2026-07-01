import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounting } from "@/hooks/useAccounting";
import { useProjects } from "@/hooks/useProjects";
import {
  BookOpen, FileText, PieChart, TrendingUp, RefreshCw, Plus,
  ArrowUpRight, ArrowDownRight, Wallet, Coins, BarChart3, Search, ExternalLink,
  Pencil, Trash2, Filter,
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useGlobalDateFilter } from "@/contexts/GlobalDateFilterContext";
import { CashVoucherTab } from "@/components/finance/CashVoucherTab";

const TYPE_LABELS: Record<string, string> = {
  asset: "Tài sản", liability: "Nợ phải trả", equity: "Vốn chủ sở hữu",
  revenue: "Doanh thu", expense: "Chi phí",
};
const TYPE_COLORS: Record<string, string> = {
  asset: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  liability: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  equity: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  revenue: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  expense: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};
const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  draft: { label: "Nháp", variant: "secondary" },
  posted: { label: "Đã ghi sổ", variant: "default" },
  voided: { label: "Đã hủy", variant: "destructive" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export default function Accounting() {
  const {
    accounts: originalAccounts,
    entries: originalEntries,
    lines,
    isLoading,
    initAccounts,
    createManualEntry,
    createAccount,
    updateAccount,
    deleteAccount,
    voidJournalEntry,
  } = useAccounting();

  const { projects = [] } = useProjects();

  const [tab, setTab] = useState("ledger");
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const { startDate, endDate, setCustomRange, selectPreset } = useGlobalDateFilter();
  const navigate = useNavigate();
  
  // Sub-filters for account details
  const [detailTypeFilter, setDetailTypeFilter] = useState<string>("all");
  const [detailRangeFilter, setDetailRangeFilter] = useState<string>("all");
  const [detailSourceFilter, setDetailSourceFilter] = useState<string>("all");
  const [detailDebtAgeFilter, setDetailDebtAgeFilter] = useState<string>("all");
  const [detailWarehouseFilter, setDetailWarehouseFilter] = useState<string>("all");
  const [detailChannelFilter, setDetailChannelFilter] = useState<string>("all");
  const [detailProjectFilter, setDetailProjectFilter] = useState<string>("all");

  // Create journal entry form states
  const [createEntryOpen, setCreateEntryOpen] = useState(false);
  const [newEntryDesc, setNewEntryDesc] = useState("");
  const [newEntryLines, setNewEntryLines] = useState<any[]>([
    { account_id: "", debit: 0, credit: 0, memo: "" },
    { account_id: "", debit: 0, credit: 0, memo: "" },
  ]);

  // Simple entry states
  const [entryMode, setEntryMode] = useState<"simple" | "advanced">(
    () => (localStorage.getItem("accounting_default_entry_mode") as "simple" | "advanced") || "simple"
  );
  const [simpleType, setSimpleType] = useState<"expense" | "income" | "purchase_on_credit">("expense");
  const [simpleSourceAcc, setSimpleSourceAcc] = useState<string>("");
  const [simpleLines, setSimpleLines] = useState<any[]>([
    { account_id: "", amount: 0, memo: "" }
  ]);

  // Create account states
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [newAccountCode, setNewAccountCode] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState("asset");

  // Chart of accounts filter & edit states
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("all");
  const [editAccountOpen, setEditAccountOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<any | null>(null);
  const [editAccountName, setEditAccountName] = useState("");
  const [editAccountType, setEditAccountType] = useState("asset");

  // Reset manual entry states on open/close
  useEffect(() => {
    if (!createEntryOpen) {
      setNewEntryDesc("");
      setNewEntryLines([
        { account_id: "", debit: 0, credit: 0, memo: "" },
        { account_id: "", debit: 0, credit: 0, memo: "" },
      ]);
      setSimpleSourceAcc("");
      setSimpleLines([
        { account_id: "", amount: 0, memo: "" }
      ]);
    }
  }, [createEntryOpen]);

  const addEntryLine = () => {
    setNewEntryLines(prev => [...prev, { account_id: "", debit: 0, credit: 0, memo: "" }]);
  };

  const removeEntryLine = (index: number) => {
    setNewEntryLines(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateEntryLine = (index: number, field: string, value: any) => {
    setNewEntryLines(prev => prev.map((l, idx) => {
      if (idx !== index) return l;
      return { ...l, [field]: value };
    }));
  };

  const addSimpleLine = () => {
    setSimpleLines(prev => [...prev, { account_id: "", amount: 0, memo: "" }]);
  };

  const removeSimpleLine = (index: number) => {
    setSimpleLines(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateSimpleLine = (index: number, field: string, value: any) => {
    setSimpleLines(prev => prev.map((l, idx) => {
      if (idx !== index) return l;
      return { ...l, [field]: value };
    }));
  };

  const totalNewDebit = newEntryLines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalNewCredit = newEntryLines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const isBalanced = totalNewDebit === totalNewCredit && totalNewDebit > 0;

  const totalSimpleAmount = simpleLines.reduce((s, l) => s + Number(l.amount || 0), 0);

  const handleCreateEntry = () => {
    if (!isBalanced) return;
    const validLines = newEntryLines.filter(l => l.account_id && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) return;
    
    createManualEntry.mutate({
      description: newEntryDesc,
      lines: validLines.map(l => ({
        account_id: l.account_id,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
        memo: l.memo,
      })),
    }, {
      onSuccess: () => {
        setCreateEntryOpen(false);
        setNewEntryDesc("");
        setNewEntryLines([
          { account_id: "", debit: 0, credit: 0, memo: "" },
          { account_id: "", debit: 0, credit: 0, memo: "" },
        ]);
      }
    });
  };

  const simpleValidationWarning = useMemo(() => {
    if (!newEntryDesc.trim()) {
      return "Vui lòng nhập diễn giải chung cho giao dịch / bút toán.";
    }
    if (!simpleSourceAcc) {
      return "Vui lòng chọn tài khoản nguồn chi / tài khoản nhận tiền.";
    }
    const hasEmptyAccount = simpleLines.some(l => Number(l.amount) > 0 && !l.account_id);
    if (hasEmptyAccount) {
      return "Có dòng đã nhập số tiền nhưng chưa chọn tài khoản định khoản mục đích. Vui lòng chọn tài khoản.";
    }
    const hasZeroAmount = simpleLines.some(l => l.account_id && Number(l.amount) <= 0);
    if (hasZeroAmount) {
      return "Có dòng đã chọn tài khoản nhưng số tiền phải lớn hơn 0. Vui lòng nhập số tiền.";
    }
    const validLinesCount = simpleLines.filter(l => l.account_id && Number(l.amount) > 0).length;
    if (validLinesCount === 0) {
      return "Vui lòng thêm ít nhất một dòng khoản mục chi phí / thu nhập hợp lệ.";
    }
    return null;
  }, [newEntryDesc, simpleSourceAcc, simpleLines]);

  const handleCreateSimpleEntry = () => {
    const validLines = simpleLines.filter(l => l.account_id && Number(l.amount) > 0);
    if (validLines.length === 0 || !simpleSourceAcc || !newEntryDesc.trim() || simpleValidationWarning) return;

    const totalValidAmount = validLines.reduce((s, l) => s + Number(l.amount || 0), 0);
    let linesPayload: any[] = [];

    if (simpleType === "expense") {
      linesPayload = [
        ...validLines.map(l => ({
          account_id: l.account_id,
          debit: Number(l.amount),
          credit: 0,
        })),
        {
          account_id: simpleSourceAcc,
          debit: 0,
          credit: totalSimpleAmount,
          memo: newEntryDesc,
        }
      ];
    } else if (simpleType === "income") {
      linesPayload = [
        {
          account_id: simpleSourceAcc,
          debit: totalSimpleAmount,
          credit: 0,
          memo: newEntryDesc,
        },
        ...validLines.map(l => ({
          account_id: l.account_id,
          debit: 0,
          credit: Number(l.amount),
          memo: l.memo || newEntryDesc,
        }))
      ];
    } else if (simpleType === "purchase_on_credit") {
      linesPayload = [
        ...validLines.map(l => ({
          account_id: l.account_id,
          debit: Number(l.amount),
          credit: 0,
          memo: l.memo || newEntryDesc,
        })),
        {
          account_id: simpleSourceAcc,
          debit: 0,
          credit: totalValidAmount,
          memo: newEntryDesc,
        }
      ];
    }

    createManualEntry.mutate({
      description: newEntryDesc,
      lines: linesPayload,
    }, {
      onSuccess: () => {
        setCreateEntryOpen(false);
        setNewEntryDesc("");
        setSimpleSourceAcc("");
        setSimpleLines([{ account_id: "", amount: 0, memo: "" }]);
      }
    });
  };

  const handleCreateAccount = () => {
    if (!newAccountCode.trim() || !newAccountName.trim() || !newAccountType) return;
    createAccount.mutate({
      code: newAccountCode.trim(),
      name: newAccountName.trim(),
      account_type: newAccountType as any,
    }, {
      onSuccess: () => {
        setCreateAccountOpen(false);
        setNewAccountCode("");
        setNewAccountName("");
        setNewAccountType("asset");
      }
    });
  };

  useEffect(() => {
    setDetailTypeFilter("all");
    setDetailRangeFilter("all");
    setDetailSourceFilter("all");
    setDetailDebtAgeFilter("all");
    setDetailWarehouseFilter("all");
    setDetailChannelFilter("all");
    setDetailProjectFilter("all");
  }, [selectedAccount]);

  const filteredEntries = useMemo(() => {
    return originalEntries.filter(e => {
      if (!e.entry_date) return true;
      if (startDate && e.entry_date < startDate) return false;
      if (endDate && e.entry_date > endDate) return false;
      return true;
    });
  }, [originalEntries, startDate, endDate]);

  const filteredAccounts = useMemo(() => {
    return originalAccounts.map(a => {
      const accLines = lines.filter(l => {
        if (l.account_id !== a.id) return false;
        const entry = originalEntries.find(e => e.id === l.entry_id);
        if (!entry) return true;
        if (entry.status === "voided") return false;
        if (!entry.entry_date) return true;
        
        if (a.account_type === "asset" || a.account_type === "liability" || a.account_type === "equity") {
          if (endDate && entry.entry_date > endDate) return false;
          return true;
        }
        
        if (startDate && entry.entry_date < startDate) return false;
        if (endDate && entry.entry_date > endDate) return false;
        return true;
      });

      const totalDebit = accLines.reduce((s, l) => s + Number(l.debit || 0), 0);
      const totalCredit = accLines.reduce((s, l) => s + Number(l.credit || 0), 0);
      
      const startingBalance = Number(a.balance || 0);
      let bal = startingBalance;
      if (a.account_type === "asset" || a.account_type === "expense") {
        bal += totalDebit - totalCredit;
      } else {
        bal += totalCredit - totalDebit;
      }

      return {
        ...a,
        balance: bal,
      };
    });
  }, [originalAccounts, lines, originalEntries, startDate, endDate]);

  const accounts = filteredAccounts;
  const entries = filteredEntries;

  const totalAssets = filteredAccounts.filter(a => a.account_type === "asset").reduce((s, a) => s + Number(a.balance || 0), 0);
  const totalLiabilities = filteredAccounts.filter(a => a.account_type === "liability").reduce((s, a) => s + Math.abs(Number(a.balance || 0)), 0);
  const totalEquity = filteredAccounts.filter(a => a.account_type === "equity").reduce((s, a) => s + Math.abs(Number(a.balance || 0)), 0);
  const totalRevenue = filteredAccounts.filter(a => a.account_type === "revenue").reduce((s, a) => s + Math.abs(Number(a.balance || 0)), 0);
  const totalExpense = filteredAccounts.filter(a => a.account_type === "expense").reduce((s, a) => s + Number(a.balance || 0), 0);
  const netProfit = totalRevenue - totalExpense;

  const balanceSheet = { totalAssets, totalLiabilities, totalEquity };
  const profitLoss = { totalRevenue, totalExpense, netProfit };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
          <div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        </div>
      </MainLayout>
    );
  }

  const needsInit = accounts.length === 0;

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kế toán</h1>
            <p className="text-muted-foreground text-sm">Sổ cái đa tài sản &amp; Báo cáo thời gian thực</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Từ ngày:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setCustomRange(e.target.value, endDate)}
                className="w-36 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Đến ngày:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setCustomRange(startDate, e.target.value)}
                className="w-36 h-9 text-sm"
              />
            </div>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectPreset("all")}
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Xóa lọc
              </Button>
            )}
            {needsInit ? (
              <Button onClick={() => initAccounts.mutate()} disabled={initAccounts.isPending} className="h-9">
                <Plus className="h-4 w-4 mr-2" />Khởi tạo hệ thống tài khoản
              </Button>
            ) : (
              <Button onClick={() => setCreateEntryOpen(true)} className="h-9 bg-primary hover:bg-primary/95 text-primary-foreground gap-2">
                <Plus className="h-4 w-4" />Ghi bút toán thủ công
              </Button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardDescription>Tổng tài sản</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{fmt(balanceSheet.totalAssets)}đ</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Nợ phải trả</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{fmt(balanceSheet.totalLiabilities)}đ</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Vốn chủ sở hữu</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{fmt(balanceSheet.totalEquity)}đ</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Lợi nhuận</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {profitLoss.netProfit >= 0
                  ? <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                  : <ArrowDownRight className="h-5 w-5 text-red-500" />}
                <span className="text-2xl font-bold">{fmt(profitLoss.netProfit)}đ</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="ledger"><BookOpen className="h-4 w-4 mr-1" />Sổ cái</TabsTrigger>
            <TabsTrigger value="cash_vouchers"><Wallet className="h-4 w-4 mr-1" />Phiếu thu/chi (Quỹ)</TabsTrigger>
            <TabsTrigger value="journal"><FileText className="h-4 w-4 mr-1" />Bút toán</TabsTrigger>
            <TabsTrigger value="balance"><PieChart className="h-4 w-4 mr-1" />Bảng CĐKT</TabsTrigger>
            <TabsTrigger value="pnl"><TrendingUp className="h-4 w-4 mr-1" />P&L</TabsTrigger>
          </TabsList>

          <TabsContent value="ledger">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Hệ thống tài khoản</CardTitle>
                  <Badge variant="secondary" className="text-xs">{accounts.length} tài khoản</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <select
                      value={accountTypeFilter}
                      onChange={(e) => setAccountTypeFilter(e.target.value)}
                      className="bg-background border rounded px-2 py-1 text-xs h-8 outline-none"
                    >
                      <option value="all">Tất cả loại</option>
                      <option value="asset">Tài sản</option>
                      <option value="liability">Nợ phải trả</option>
                      <option value="equity">Vốn CSH</option>
                      <option value="revenue">Doanh thu</option>
                      <option value="expense">Chi phí</option>
                    </select>
                  </div>
                  <Button
                    onClick={() => setCreateAccountOpen(true)} 
                    size="sm" 
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Thêm tài khoản mới
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {accounts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Chưa có tài khoản. Nhấn "Khởi tạo" để bắt đầu.</p>
                ) : (() => {
                  const filtered = accountTypeFilter === "all" ? accounts : accounts.filter(a => a.account_type === accountTypeFilter);
                  return filtered.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6 text-sm">Không có tài khoản nào thuộc loại này.</p>
                  ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã TK</TableHead>
                        <TableHead>Tên tài khoản</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead className="text-right">Số dư</TableHead>
                        <TableHead className="text-right w-[100px]">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(a => (
                        <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50 group">
                          <TableCell className="font-mono font-semibold" onClick={() => setSelectedAccount(a)}>{a.code}</TableCell>
                          <TableCell onClick={() => setSelectedAccount(a)}>{a.name}</TableCell>
                          <TableCell onClick={() => setSelectedAccount(a)}>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[a.account_type] || ""}`}>
                              {TYPE_LABELS[a.account_type] || a.account_type}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono" onClick={() => setSelectedAccount(a)}>{fmt(Number(a.balance || 0))}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Sửa tài khoản"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditAccount(a);
                                  setEditAccountName(a.name);
                                  setEditAccountType(a.account_type);
                                  setEditAccountOpen(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Xóa tài khoản"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${a.code} - ${a.name}"? Chỉ có thể xóa tài khoản chưa có phát sinh và số dư = 0.`)) {
                                    deleteAccount.mutate(a.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* JOURNAL TAB */}
          <TabsContent value="journal">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nhật ký bút toán</CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Chưa có bút toán nào.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Diễn giải</TableHead>
                        <TableHead>Nguồn</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>VNeID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map(e => {
                        const st = STATUS_MAP[e.status] || STATUS_MAP.draft;
                        return (
                          <TableRow key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEntry(e)}>
                            <TableCell className="text-sm">
                              {e.entry_date && !isNaN(new Date(e.entry_date).getTime())
                                ? format(new Date(e.entry_date), "dd/MM/yyyy")
                                : "—"}
                            </TableCell>
                            <TableCell>{e.description || "—"}</TableCell>
                            <TableCell><Badge variant="outline">{e.source_type}</Badge></TableCell>
                            <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                            <TableCell>{e.vneid_signature ? "✓" : "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BALANCE SHEET TAB */}
          <TabsContent value="balance">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Tài sản (Assets)</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {accounts.filter(a => a.account_type === "asset").map(a => (
                    <div key={a.id} className="flex justify-between text-sm cursor-pointer hover:bg-muted/30 p-1.5 rounded transition-colors" onClick={() => setSelectedAccount(a)}>
                      <span>{a.code} - {a.name}</span>
                      <span className="font-mono">{fmt(Number(a.balance || 0))}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Tổng tài sản</span><span className="font-mono">{fmt(balanceSheet.totalAssets)}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Nguồn vốn (Liabilities &amp; Equity)</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">Nợ phải trả</h4>
                  {accounts.filter(a => a.account_type === "liability").map(a => (
                    <div key={a.id} className="flex justify-between text-sm cursor-pointer hover:bg-muted/30 p-1.5 rounded transition-colors" onClick={() => setSelectedAccount(a)}>
                      <span>{a.code} - {a.name}</span>
                      <span className="font-mono">{fmt(Math.abs(Number(a.balance || 0)))}</span>
                    </div>
                  ))}
                  <h4 className="font-semibold text-sm text-muted-foreground pt-2">Vốn chủ sở hữu</h4>
                  {accounts.filter(a => a.account_type === "equity").map(a => (
                    <div key={a.id} className="flex justify-between text-sm cursor-pointer hover:bg-muted/30 p-1.5 rounded transition-colors" onClick={() => setSelectedAccount(a)}>
                      <span>{a.code} - {a.name}</span>
                      <span className="font-mono">{fmt(Math.abs(Number(a.balance || 0)))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm p-1.5 rounded hover:bg-muted/30 text-emerald-600 font-medium">
                    <span>Lợi nhuận chưa phân phối (Lãi/Lỗ kỳ này)</span>
                    <span className="font-mono">{fmt(profitLoss.netProfit)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Tổng nguồn vốn</span><span className="font-mono">{fmt(balanceSheet.totalLiabilities + balanceSheet.totalEquity + profitLoss.netProfit)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* P&L TAB */}
          <TabsContent value="pnl">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" />Báo cáo Lãi/Lỗ (P&L)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Doanh thu</h4>
                {accounts.filter(a => a.account_type === "revenue").map(a => (
                  <div key={a.id} className="flex justify-between text-sm cursor-pointer hover:bg-muted/30 p-1.5 rounded transition-colors" onClick={() => setSelectedAccount(a)}>
                    <span>{a.code} - {a.name}</span>
                    <span className="font-mono text-emerald-600">{fmt(Math.abs(Number(a.balance || 0)))}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Tổng doanh thu</span><span className="font-mono text-emerald-600">{fmt(profitLoss.totalRevenue)}</span>
                </div>
                <h4 className="font-semibold text-sm text-muted-foreground pt-2">Chi phí</h4>
                {accounts.filter(a => a.account_type === "expense").map(a => (
                  <div key={a.id} className="flex justify-between text-sm cursor-pointer hover:bg-muted/30 p-1.5 rounded transition-colors" onClick={() => setSelectedAccount(a)}>
                    <span>{a.code} - {a.name}</span>
                    <span className="font-mono text-red-600">{fmt(Number(a.balance || 0))}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Tổng chi phí</span><span className="font-mono text-red-600">{fmt(profitLoss.totalExpense)}</span>
                </div>
                <div className="border-t-2 border-primary pt-3 flex justify-between text-lg font-bold">
                  <span>Lợi nhuận ròng</span>
                  <span className={profitLoss.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}>
                    {fmt(profitLoss.netProfit)}đ
                  </span>
                </div>
              </CardContent>
          </TabsContent>
          <TabsContent value="cash_vouchers">
            <CashVoucherTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Account Details Dialog */}
      <Dialog open={!!selectedAccount} onOpenChange={(open) => !open && setSelectedAccount(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Lịch sử tài khoản: {selectedAccount?.code} - {selectedAccount?.name}</DialogTitle>
            <DialogDescription>
              Kiểu: {TYPE_LABELS[selectedAccount?.account_type || ""]}
            </DialogDescription>
          </DialogHeader>
          
          {(() => {
            if (!selectedAccount) return null;
            
            // 1. Calculate opening balance (transactions before startDate)
            let openingBalance = 0;
            if (startDate) {
              const beforeLines = lines.filter(l => {
                if (l.account_id !== selectedAccount.id) return false;
                const entry = originalEntries.find(e => e.id === l.entry_id);
                if (!entry) return false;
                if (entry.status === "voided") return false;
                if (!entry.entry_date) return false;
                return entry.entry_date < startDate;
              });
              const openingDebit = beforeLines.reduce((s, l) => s + Number(l.debit || 0), 0);
              const openingCredit = beforeLines.reduce((s, l) => s + Number(l.credit || 0), 0);
              if (selectedAccount.account_type === "asset" || selectedAccount.account_type === "expense") {
                openingBalance = openingDebit - openingCredit;
              } else {
                openingBalance = openingCredit - openingDebit;
              }
            }
            
            // 2. Filter lines within the range and advanced sub-filters
            const accountLines = lines
              .filter(l => {
                if (l.account_id !== selectedAccount.id) return false;
                const entry = originalEntries.find(e => e.id === l.entry_id);
                if (!entry) return true;
                if (entry.status === "voided") return false;
                if (!entry.entry_date) return true; // Keep manual/unassociated lines if any
                
                // Date range filters
                if (startDate && entry.entry_date < startDate) return false;
                if (endDate && entry.entry_date > endDate) return false;

                // 1. Transaction Type (Thu vs Chi / Debit vs Credit)
                if (detailTypeFilter === "debit" && !(l.debit > 0)) return false;
                if (detailTypeFilter === "credit" && !(l.credit > 0)) return false;

                // 2. Classification / Source
                if (detailSourceFilter !== "all") {
                  if (detailSourceFilter === "manual" && entry.source_type && entry.source_type !== "manual") return false;
                  if (detailSourceFilter !== "manual" && entry.source_type !== detailSourceFilter) return false;
                }

                // 3. Amount Range (Khoảng giá trị)
                const amt = Math.max(Number(l.debit || 0), Number(l.credit || 0));
                if (detailRangeFilter === "small" && !(amt < 10000000)) return false;
                if (detailRangeFilter === "medium" && !(amt >= 10000000 && amt <= 50000000)) return false;
                if (detailRangeFilter === "large" && !(amt > 50000000)) return false;

                // --- Dynamic Filters based on Account ---
                const code = selectedAccount.code || "";
                const isDebt = code.startsWith("131") || code.startsWith("331");
                const isInventory = code.startsWith("156");
                const isPnL = selectedAccount.account_type === "revenue" || selectedAccount.account_type === "expense";

                // Debt Age Filter
                if (isDebt && detailDebtAgeFilter !== "all") {
                  const entryDateObj = new Date(entry.entry_date);
                  const today = new Date("2026-06-19");
                  const diffTime = Math.abs(today.getTime() - entryDateObj.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (detailDebtAgeFilter === "current" && diffDays > 30) return false;
                  if (detailDebtAgeFilter === "overdue_30" && (diffDays <= 30 || diffDays > 90)) return false;
                  if (detailDebtAgeFilter === "bad" && diffDays <= 90) return false;
                }

                // Warehouse Filter
                if (isInventory && detailWarehouseFilter !== "all") {
                  const memoLower = (l.memo || "").toLowerCase();
                  const descLower = (entry.description || "").toLowerCase();
                   
                  const hasQ1 = memoLower.includes("q1") || descLower.includes("q1") || memoLower.includes("quận 1") || descLower.includes("quận 1");
                  const hasTD = memoLower.includes("thủ đức") || descLower.includes("thủ đức") || memoLower.includes("tđ") || descLower.includes("tđ");
                  const hasTong = memoLower.includes("tổng") || descLower.includes("tổng") || memoLower.includes("chính") || descLower.includes("chính");

                  if (detailWarehouseFilter === "q1" && !hasQ1) return false;
                  if (detailWarehouseFilter === "td" && !hasTD) return false;
                  if (detailWarehouseFilter === "tong" && !hasTong && (hasQ1 || hasTD)) return false;
                }

                // Sales Channel Filter
                if (isPnL && detailChannelFilter !== "all") {
                  const memoLower = (l.memo || "").toLowerCase();
                  const descLower = (entry.description || "").toLowerCase();
                   
                  const hasShopee = memoLower.includes("shopee") || descLower.includes("shopee");
                  const hasLazada = memoLower.includes("lazada") || descLower.includes("lazada");
                  const hasTiktok = memoLower.includes("tiktok") || descLower.includes("tiktok") || memoLower.includes("tt") || descLower.includes("tt");
                  const hasPOS = memoLower.includes("pos") || descLower.includes("pos") || memoLower.includes("bán lẻ") || descLower.includes("bán lẻ");

                  if (detailChannelFilter === "shopee" && !hasShopee) return false;
                  if (detailChannelFilter === "lazada" && !hasLazada) return false;
                  if (detailChannelFilter === "tiktok" && !hasTiktok) return false;
                  if (detailChannelFilter === "pos" && !hasPOS && (hasShopee || hasLazada || hasTiktok)) return false;
                }

                // Project Filter
                if (detailProjectFilter !== "all") {
                  const memoLower = (l.memo || "").toLowerCase();
                  const descLower = (entry.description || "").toLowerCase();

                  if (detailProjectFilter === "none") {
                    // Check if it doesn't match any project code or name
                    const hasAnyProject = projects.some(p => {
                      const codeLower = p.code.toLowerCase();
                      const nameLower = p.name.toLowerCase();
                      return memoLower.includes(codeLower) || descLower.includes(codeLower) ||
                             memoLower.includes(nameLower) || descLower.includes(nameLower);
                    });
                    if (hasAnyProject) return false;
                  } else {
                    const selectedProj = projects.find(p => p.id === detailProjectFilter);
                    if (selectedProj) {
                      const codeLower = selectedProj.code.toLowerCase();
                      const nameLower = selectedProj.name.toLowerCase();
                      const matchesProj = memoLower.includes(codeLower) || descLower.includes(codeLower) ||
                                           memoLower.includes(nameLower) || descLower.includes(nameLower);
                      if (!matchesProj) return false;
                    }
                  }
                }

                return true;
              })
              .map(l => {
                const entry = originalEntries.find(e => e.id === l.entry_id);
                return {
                  ...l,
                  date: entry?.entry_date || entry?.created_at || l.created_at,
                  description: entry?.description || l.memo || "—",
                  source: entry?.source_type || "manual",
                };
              })
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // Calculate running balance and period totals
            const totalPeriodDebit = accountLines.reduce((s, l) => s + Number(l.debit || 0), 0);
            const totalPeriodCredit = accountLines.reduce((s, l) => s + Number(l.credit || 0), 0);
            
            let currentBal = openingBalance;
            const rowsWithRunningBalance = accountLines.map(l => {
              let change = 0;
              if (selectedAccount.account_type === "asset" || selectedAccount.account_type === "expense") {
                change = Number(l.debit || 0) - Number(l.credit || 0);
              } else {
                change = Number(l.credit || 0) - Number(l.debit || 0);
              }
              currentBal += change;
              return {
                ...l,
                runningBalance: currentBal,
              };
            });

            // Sort newest first for rendering
            const sortedRows = [...rowsWithRunningBalance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const endingBalance = selectedAccount.balance;


            const code = selectedAccount.code || "";
            const isCashBank = code.startsWith("111") || code.startsWith("112");
            const isDebt = code.startsWith("131") || code.startsWith("331");
            const isInventory = code.startsWith("156");
            const isPnL = selectedAccount.account_type === "revenue" || selectedAccount.account_type === "expense";

            return (
              <>
                {/* Period Summary Header */}
                <div className="grid grid-cols-4 gap-2 my-2 text-xs border rounded-lg p-2.5 bg-muted/20">
                  <div>
                    <span className="text-muted-foreground block font-medium">Số dư đầu kỳ</span>
                    <span className="font-semibold font-mono text-sm">{fmt(openingBalance)}đ</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Phát sinh Nợ (Dr)</span>
                    <span className="font-semibold font-mono text-emerald-600 text-sm">+{fmt(totalPeriodDebit)}đ</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Phát sinh Có (Cr)</span>
                    <span className="font-semibold font-mono text-red-600 text-sm">+{fmt(totalPeriodCredit)}đ</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Số dư cuối kỳ</span>
                    <span className="font-semibold font-mono text-primary text-sm">{fmt(endingBalance)}đ</span>
                  </div>
                </div>

                {/* Advanced Filter Panel */}
                <div className="bg-muted/40 border p-3 rounded-lg flex flex-wrap items-center gap-3 text-[11px] mt-2 mb-1">
                  
                  {/* Cash/Bank Filters */}
                  {isCashBank && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-muted-foreground">Phân loại dòng:</span>
                        <select 
                          value={detailTypeFilter} 
                          onChange={(e) => setDetailTypeFilter(e.target.value)}
                          className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                        >
                          <option value="all">Tất cả phát sinh</option>
                          <option value="debit">Nợ (Thu / Thu tiền)</option>
                          <option value="credit">Có (Chi / Trả tiền)</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-muted-foreground">Khoảng tiền:</span>
                        <select 
                          value={detailRangeFilter} 
                          onChange={(e) => setDetailRangeFilter(e.target.value)}
                          className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                        >
                          <option value="all">Tất cả khoảng</option>
                          <option value="small">Nhỏ (&lt; 10 triệu)</option>
                          <option value="medium">Vừa (10 triệu - 50 triệu)</option>
                          <option value="large">Lớn (&gt; 50 triệu)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-muted-foreground">Nguồn dòng tiền:</span>
                        <select 
                          value={detailSourceFilter} 
                          onChange={(e) => setDetailSourceFilter(e.target.value)}
                          className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                        >
                          <option value="all">Tất cả nguồn</option>
                          <option value="order">Đơn hàng (Sales / Orders)</option>
                          <option value="payroll">Bảng lương (Payroll)</option>
                          <option value="manual">Thủ công &amp; Khác</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Accounts Receivable / Payable (Công nợ) Filters */}
                  {isDebt && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-muted-foreground">Tính chất:</span>
                        <select 
                          value={detailTypeFilter} 
                          onChange={(e) => setDetailTypeFilter(e.target.value)}
                          className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                        >
                          <option value="all">Tất cả phát sinh</option>
                          {code.startsWith("131") ? (
                            <>
                              <option value="debit">Nợ (Tăng phải thu - Bán hàng)</option>
                              <option value="credit">Có (Giảm phải thu - Thu tiền)</option>
                            </>
                          ) : (
                            <>
                              <option value="credit">Có (Tăng phải trả - Mua hàng)</option>
                              <option value="debit">Nợ (Giảm phải trả - Trả tiền)</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-muted-foreground">Tuổi nợ (Phân tích):</span>
                        <select 
                          value={detailDebtAgeFilter} 
                          onChange={(e) => setDetailDebtAgeFilter(e.target.value)}
                          className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                        >
                          <option value="all">Tất cả hạn nợ</option>
                          <option value="current">Trong hạn (&lt; 30 ngày)</option>
                          <option value="overdue_30">Nợ quá hạn (30 - 90 ngày)</option>
                          <option value="bad">Nợ khó đòi (&gt; 90 ngày)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-muted-foreground">Khoảng giá trị:</span>
                        <select 
                          value={detailRangeFilter} 
                          onChange={(e) => setDetailRangeFilter(e.target.value)}
                          className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                        >
                          <option value="all">Tất cả khoảng</option>
                          <option value="small">Nhỏ (&lt; 10 triệu)</option>
                          <option value="medium">Vừa (10 triệu - 50 triệu)</option>
                          <option value="large">Lớn (&gt; 50 triệu)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Inventory (Kho hàng) Filters */}
                  {isInventory && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-muted-foreground">Loại phiếu:</span>
                        <select 
                          value={detailTypeFilter} 
                          onChange={(e) => setDetailTypeFilter(e.target.value)}
                          className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                        >
                          <option value="all">Tất cả biến động</option>
                          <option value="debit">Nợ (Nhập kho hàng hóa)</option>
                          <option value="credit">Có (Xuất kho bán hàng / hủy)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-muted-foreground">Kho hàng phân bổ:</span>
                        <select 
                          value={detailWarehouseFilter} 
                          onChange={(e) => setDetailWarehouseFilter(e.target.value)}
                          className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                        >
                          <option value="all">Tất cả các kho</option>
                          <option value="tong">Kho Tổng (Chính)</option>
                          <option value="q1">Kho Quận 1 (Bán lẻ)</option>
                          <option value="td">Kho Thủ Đức</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-muted-foreground">Khoảng giá trị lô:</span>
                        <select 
                          value={detailRangeFilter} 
                          onChange={(e) => setDetailRangeFilter(e.target.value)}
                          className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                        >
                          <option value="all">Tất cả khoảng</option>
                          <option value="small">Nhỏ (&lt; 10 triệu)</option>
                          <option value="medium">Vừa (10M - 50M)</option>
                          <option value="large">Lớn (&gt; 50 triệu)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Revenue / Expense (Doanh thu / Chi phí) Filters */}
                  {isPnL && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-muted-foreground">Kênh phân bổ:</span>
                        <select 
                          value={detailChannelFilter} 
                          onChange={(e) => setDetailChannelFilter(e.target.value)}
                          className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                        >
                          <option value="all">Tất cả kênh doanh thu</option>
                          <option value="pos">Bán lẻ tại quầy (POS)</option>
                          <option value="shopee">Sàn Shopee</option>
                          <option value="lazada">Sàn Lazada</option>
                          <option value="tiktok">Tiktok Shop</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-muted-foreground">Khoảng doanh thu:</span>
                        <select 
                          value={detailRangeFilter} 
                          onChange={(e) => setDetailRangeFilter(e.target.value)}
                          className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                        >
                          <option value="all">Tất cả khoảng</option>
                          <option value="small">Nhỏ (&lt; 10 triệu)</option>
                          <option value="medium">Vừa (10M - 50M)</option>
                          <option value="large">Lớn (&gt; 50 triệu)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-muted-foreground">Nguồn gốc:</span>
                        <select 
                          value={detailSourceFilter} 
                          onChange={(e) => setDetailSourceFilter(e.target.value)}
                          className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                        >
                          <option value="all">Tất cả nguồn</option>
                          <option value="order">Đơn hàng (Sales / Orders)</option>
                          <option value="payroll">Bảng lương (Payroll)</option>
                          <option value="manual">Thủ công &amp; Khác</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Project (Dự án) Filter */}
                  {(isCashBank || isDebt || isPnL) && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-muted-foreground">Dự án:</span>
                      <select 
                        value={detailProjectFilter} 
                        onChange={(e) => setDetailProjectFilter(e.target.value)}
                        className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                      >
                        <option value="all">Tất cả dự án</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                        ))}
                        <option value="none">Không thuộc dự án</option>
                      </select>
                    </div>
                  )}

                  {/* Fallback for other accounts */}
                  {!isCashBank && !isDebt && !isInventory && !isPnL && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-muted-foreground">Phân loại:</span>
                        <select 
                          value={detailTypeFilter} 
                          onChange={(e) => setDetailTypeFilter(e.target.value)}
                          className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                        >
                          <option value="all">Tất cả phát sinh</option>
                          <option value="debit">Nợ (Debit)</option>
                          <option value="credit">Có (Credit)</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-muted-foreground">Khoảng giá trị:</span>
                        <select 
                          value={detailRangeFilter} 
                          onChange={(e) => setDetailRangeFilter(e.target.value)}
                          className="bg-background border rounded px-1.5 py-0.5 outline-none h-6 text-[11px]"
                        >
                          <option value="all">Tất cả khoảng</option>
                          <option value="small">Nhỏ (&lt; 10 triệu)</option>
                          <option value="medium">Vừa (10M - 50M)</option>
                          <option value="large">Lớn (&gt; 50 triệu)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Quick Reset Button */}
                  {(detailTypeFilter !== "all" || 
                    detailRangeFilter !== "all" || 
                    detailSourceFilter !== "all" ||
                    detailDebtAgeFilter !== "all" ||
                    detailWarehouseFilter !== "all" ||
                    detailChannelFilter !== "all" ||
                    detailProjectFilter !== "all") && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setDetailTypeFilter("all");
                        setDetailRangeFilter("all");
                        setDetailSourceFilter("all");
                        setDetailDebtAgeFilter("all");
                        setDetailWarehouseFilter("all");
                        setDetailChannelFilter("all");
                        setDetailProjectFilter("all");
                      }}
                      className="h-6 text-[10px] px-1.5 ml-auto text-muted-foreground hover:text-foreground"
                    >
                      Xóa lọc phụ
                    </Button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto mt-4 pr-1 min-h-[300px]">
                  {sortedRows.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Không có giao dịch nào trong kỳ.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Ngày</TableHead>
                          <TableHead>Diễn giải</TableHead>
                          <TableHead>Nguồn</TableHead>
                          <TableHead className="text-right w-[120px]">Nợ (Dr)</TableHead>
                          <TableHead className="text-right w-[120px]">Có (Cr)</TableHead>
                          <TableHead className="text-right w-[120px]">Số dư chạy</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedRows.map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="text-sm">
                              {l.date && !isNaN(new Date(l.date).getTime())
                                ? format(new Date(l.date), "dd/MM/yyyy")
                                : "—"}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={l.description}>{l.description}</TableCell>
                            <TableCell><Badge variant="outline">{l.source}</Badge></TableCell>
                            <TableCell className="text-right font-mono text-emerald-600">{l.debit > 0 ? fmt(l.debit) : "—"}</TableCell>
                            <TableCell className="text-right font-mono text-red-600">{l.credit > 0 ? fmt(l.credit) : "—"}</TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">{fmt(l.runningBalance)}đ</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Journal Entry Details Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Chi tiết bút toán: {selectedEntry?.description || "Không có diễn giải"}
              {selectedEntry && (() => {
                const st = STATUS_MAP[selectedEntry.status] || STATUS_MAP.draft;
                return <Badge variant={st.variant}>{st.label}</Badge>;
              })()}
            </DialogTitle>
            <DialogDescription>
              Ngày ghi nhận: {selectedEntry?.entry_date && !isNaN(new Date(selectedEntry.entry_date).getTime()) 
                ? format(new Date(selectedEntry.entry_date), "dd/MM/yyyy") 
                : "—"} 
              • Nguồn: {selectedEntry?.source_type}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {(() => {
              if (!selectedEntry) return null;
              const entryLines = lines
                .filter(l => l.entry_id === selectedEntry.id)
                .map(l => {
                  const acc = accounts.find(a => a.id === l.account_id);
                  return {
                    ...l,
                    accountCode: acc?.code || "—",
                    accountName: acc?.name || "—",
                  };
                });

              const totalDebit = entryLines.reduce((s, l) => s + Number(l.debit || 0), 0);
              const totalCredit = entryLines.reduce((s, l) => s + Number(l.credit || 0), 0);

              return (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tài khoản</TableHead>
                        <TableHead>Diễn giải dòng</TableHead>
                        <TableHead className="text-right w-[120px]">Nợ (Dr)</TableHead>
                        <TableHead className="text-right w-[120px]">Có (Cr)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entryLines.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>
                            <span className="font-mono font-semibold">{l.accountCode}</span> - {l.accountName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{l.memo || "—"}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-600">{l.debit > 0 ? fmt(l.debit) : "—"}</TableCell>
                          <TableCell className="text-right font-mono text-red-600">{l.credit > 0 ? fmt(l.credit) : "—"}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted/20">
                        <TableCell colSpan={2}>Tổng cộng</TableCell>
                        <TableCell className="text-right font-mono">{fmt(totalDebit)}đ</TableCell>
                        <TableCell className="text-right font-mono">{fmt(totalCredit)}đ</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  {selectedEntry.vneid_signature && (
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
                      <span>✓ Đã xác thực bằng chữ ký số định danh điện tử VNeID</span>
                      <span className="font-mono text-[10px] opacity-75">{selectedEntry.vneid_signature.substring(0, 16)}...</span>
                    </div>
                  )}
                  {selectedEntry.source_type && selectedEntry.source_type !== "manual" && (
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 border-primary/30 hover:bg-primary/5 text-primary mt-2"
                      onClick={() => {
                        if (selectedEntry.source_type === "order" || selectedEntry.source_type === "sales") {
                          navigate("/orders");
                        } else if (selectedEntry.source_type === "payroll") {
                          navigate("/performance/team");
                        } else if (selectedEntry.source_type === "inventory") {
                          navigate("/inventory");
                        } else {
                          navigate("/finance");
                        }
                        setSelectedEntry(null);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" /> 
                      Truy xuất nguồn dữ liệu gốc ({
                        selectedEntry.source_type === "order" || selectedEntry.source_type === "sales" 
                          ? "Đơn hàng" 
                          : selectedEntry.source_type === "payroll" 
                            ? "Bảng lương" 
                            : selectedEntry.source_type === "inventory" 
                              ? "Kho hàng" 
                              : selectedEntry.source_type
                      })
                    </Button>
                  )}
                  {selectedEntry.status !== "voided" && (
                    <Button
                      variant="destructive"
                      className="w-full gap-2 mt-2 bg-red-600 hover:bg-red-700 text-white"
                      disabled={voidJournalEntry.isPending}
                      onClick={() => {
                        if (confirm("Bạn có chắc chắn muốn hủy bút toán này? Hành động này sẽ loại bỏ hoàn toàn các phát sinh Nợ/Có của bút toán khỏi số dư tài khoản.")) {
                          voidJournalEntry.mutate(selectedEntry.id, {
                            onSuccess: () => {
                              setSelectedEntry(null);
                            }
                          });
                        }
                      }}
                    >
                      Hủy bút toán (Void)
                    </Button>
                  )}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Journal Entry Dialog */}
      <Dialog open={createEntryOpen} onOpenChange={(open) => {
        setCreateEntryOpen(open);
        if (!open) {
          const defaultMode = (localStorage.getItem("accounting_default_entry_mode") as "simple" | "advanced") || "simple";
          setEntryMode(defaultMode);
          setSimpleSourceAcc("");
          setSimpleLines([{ account_id: "", amount: 0, memo: "" }]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Ghi nhận giao dịch thủ công mới</DialogTitle>
            <DialogDescription>
              Ghi nhận các khoản thu chi phát sinh ngoài hệ thống để đối soát và cân đối số sách kế toán.
            </DialogDescription>
          </DialogHeader>

          {/* Mode Selector */}
          <div className="flex border-b mb-2">
            <button
              className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${
                entryMode === "simple"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setEntryMode("simple")}
            >
              📝 Nhập nhanh đơn giản (Dành cho người không chuyên)
            </button>
            <button
              className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${
                entryMode === "advanced"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setEntryMode("advanced")}
            >
              ⚙️ Định khoản nâng cao (Nợ/Có kép)
            </button>
          </div>

          <div className="flex items-center justify-between px-1.5 py-1 mb-2 bg-muted/20 border rounded-lg text-[11px] gap-2">
            <span className="text-muted-foreground">
              Chế độ hiện tại: <strong>{entryMode === "simple" ? "Nhập nhanh đơn giản" : "Định khoản nâng cao"}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.setItem("accounting_default_entry_mode", entryMode);
                toast.success(`Đã lưu "${entryMode === "simple" ? "Nhập nhanh đơn giản" : "Định khoản nâng cao"}" làm chế độ mặc định khi mở.`);
              }}
              className="h-6 text-[10px] gap-1 hover:bg-primary/5 hover:text-primary transition-all border-primary/20"
            >
              💾 Lưu chế độ này làm mặc định
            </Button>
          </div>

          <div className="space-y-4 my-2 flex-1 overflow-y-auto pr-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Diễn giải giao dịch / bút toán</label>
              <Input 
                value={newEntryDesc}
                onChange={(e) => setNewEntryDesc(e.target.value)}
                placeholder="Nhập diễn giải chung (ví dụ: Thanh toán tiền điện tháng 5, Thu tiền đơn hàng lẻ)..."
                className="text-sm"
              />
            </div>

            {entryMode === "simple" ? (
              <div className="space-y-4 my-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Loại nghiệp vụ</label>
                    <select
                      value={simpleType}
                      onChange={(e) => {
                        setSimpleType(e.target.value as any);
                        setSimpleSourceAcc("");
                        setSimpleLines([{ account_id: "", amount: 0, memo: "" }]);
                      }}
                      className="w-full bg-background border rounded px-3 py-2 outline-none text-sm h-10"
                    >
                      <option value="expense">💸 Chi tiền / Chi phí ( Facebook Ads, Điện nước, tiếp khách...)</option>
                      <option value="income">💰 Thu tiền / Doanh thu (Thu tiền mặt, khách chuyển khoản...)</option>
                      <option value="purchase_on_credit">📦 Mua hàng hóa chưa trả tiền (Nhập kho công nợ)</option>
                    </select>
                    {simpleType === "expense" && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium leading-relaxed">
                        ⚠️ Nghiệp vụ Chi tiền chỉ cho phép chọn chi phí / mua tài sản / trả nợ. Vui lòng không chọn TK Doanh thu (TK đầu 5) tại đây.
                      </p>
                    )}
                    {simpleType === "income" && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium leading-relaxed">
                        ⚠️ Nghiệp vụ Thu tiền chỉ cho phép chọn doanh thu / thu hồi nợ. Vui lòng không chọn TK Chi phí (TK đầu 6) tại đây.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      {simpleType === "expense" && "Tài khoản nguồn chi (Chi từ tài khoản nào)"}
                      {simpleType === "income" && "Tài khoản nhận tiền (Thu vào tài khoản nào)"}
                      {simpleType === "purchase_on_credit" && "Đối tác / Nhà cung cấp (Ghi nhận công nợ)"}
                    </label>
                    <select
                      value={simpleSourceAcc}
                      onChange={(e) => setSimpleSourceAcc(e.target.value)}
                      className="w-full bg-background border rounded px-3 py-2 outline-none text-sm h-10"
                    >
                      <option value="">-- Chọn tài khoản --</option>
                      {accounts
                        .filter(a => {
                          if (simpleType === "expense" || simpleType === "income") {
                            return a.code.startsWith("111") || a.code.startsWith("112");
                          }
                          if (simpleType === "purchase_on_credit") {
                            return a.code.startsWith("331");
                          }
                          return true;
                        })
                        .map(a => (
                          <option key={a.id} value={a.id}>{a.code} - {a.name} (Số dư: {fmt(a.balance || 0)}đ)</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {simpleType === "expense" && "Danh sách khoản mục chi phí / thanh toán"}
                      {simpleType === "income" && "Danh sách khoản mục thu nhập / thu hồi nợ"}
                      {simpleType === "purchase_on_credit" && "Danh sách mặt hàng / tài sản nhập kho"}
                    </span>
                    <Button variant="outline" size="sm" onClick={addSimpleLine} className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Thêm khoản mục
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>
                            {simpleType === "expense" && "Mục đích chi"}
                            {simpleType === "income" && "Phân loại nguồn thu"}
                            {simpleType === "purchase_on_credit" && "Khoản mục nhập kho"}
                          </TableHead>
                          <TableHead className="w-[180px] text-right">Số tiền (đ)</TableHead>
                          <TableHead>Diễn giải chi tiết dòng</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {simpleLines.map((l, idx) => {
                          const selectedAcc = accounts.find(a => a.id === l.account_id);
                          return (
                            <TableRow key={idx} className="hover:bg-transparent">
                              <TableCell className="p-2">
                                <select
                                  value={l.account_id}
                                  onChange={(e) => updateSimpleLine(idx, "account_id", e.target.value)}
                                  className="w-full bg-background border rounded px-2 py-1 outline-none text-xs h-8"
                                >
                                  <option value="">-- Chọn tài khoản --</option>
                                  {simpleType === "expense" && (
                                    <>
                                      <optgroup label="💸 Chi phí vận hành (Tài khoản đầu 6)">
                                        {accounts
                                          .filter(a => a.account_type === "expense")
                                          .map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name} (Số dư: {fmt(a.balance || 0)}đ)</option>
                                          ))}
                                      </optgroup>
                                      <optgroup label="🤝 Trả nợ & Trả lương (Tài khoản đầu 3)">
                                        {accounts
                                          .filter(a => a.code.startsWith("331") || a.code.startsWith("334") || a.code.startsWith("333") || a.code.startsWith("341"))
                                          .map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name} (Số dư: {fmt(a.balance || 0)}đ)</option>
                                          ))}
                                      </optgroup>
                                      <optgroup label="🏗️ Mua sắm tài sản & Đầu tư (Tài khoản đầu 1, đầu 2)">
                                        {accounts
                                          .filter(a => a.code.startsWith("241") || a.code.startsWith("156") || a.code.startsWith("157"))
                                          .map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name} (Số dư: {fmt(a.balance || 0)}đ)</option>
                                          ))}
                                      </optgroup>
                                      <optgroup label="⚙️ Tài khoản khác">
                                        {accounts
                                          .filter(a => 
                                            a.account_type !== "expense" && 
                                            a.account_type !== "revenue" && 
                                            !a.code.startsWith("331") && !a.code.startsWith("334") && !a.code.startsWith("333") && !a.code.startsWith("341") &&
                                            !a.code.startsWith("241") && !a.code.startsWith("156") && !a.code.startsWith("157") &&
                                            !a.code.startsWith("111") && !a.code.startsWith("112")
                                          )
                                          .map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name} (Số dư: {fmt(a.balance || 0)}đ)</option>
                                          ))}
                                      </optgroup>
                                    </>
                                  )}
                                  {simpleType === "income" && (
                                    <>
                                      <optgroup label="💰 Doanh thu kinh doanh (Tài khoản đầu 5)">
                                        {accounts
                                          .filter(a => a.account_type === "revenue")
                                          .map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name} (Số dư: {fmt(a.balance || 0)}đ)</option>
                                          ))}
                                      </optgroup>
                                      <optgroup label="👤 Thu hồi nợ khách hàng (Tài khoản đầu 131)">
                                        {accounts
                                          .filter(a => a.code.startsWith("131"))
                                          .map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name} (Số dư: {fmt(a.balance || 0)}đ)</option>
                                          ))}
                                      </optgroup>
                                      <optgroup label="🌱 Nhận vốn góp & Nguồn khác">
                                        {accounts
                                          .filter(a => 
                                            a.account_type !== "revenue" && 
                                            a.account_type !== "expense" && 
                                            !a.code.startsWith("131") &&
                                            !a.code.startsWith("111") && !a.code.startsWith("112")
                                          )
                                          .map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name} (Số dư: {fmt(a.balance || 0)}đ)</option>
                                          ))}
                                      </optgroup>
                                    </>
                                  )}
                                  {simpleType === "purchase_on_credit" && (
                                    <>
                                      <optgroup label="📦 Tài sản kho hàng hóa (Tài khoản đầu 156)">
                                        {accounts
                                          .filter(a => a.code.startsWith("156"))
                                          .map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name} (Số dư: {fmt(a.balance || 0)}đ)</option>
                                          ))}
                                      </optgroup>
                                      <optgroup label="⚙️ Tài khoản hàng tồn kho khác">
                                        {accounts
                                          .filter(a => !a.code.startsWith("156") && (a.account_type === "asset" || a.code.startsWith("157")))
                                          .map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name} (Số dư: {fmt(a.balance || 0)}đ)</option>
                                          ))}
                                      </optgroup>
                                    </>
                                  )}
                                </select>
                                {selectedAcc && (
                                  <div className="text-[10px] text-muted-foreground mt-1 px-1 font-medium">
                                    Số dư hiện tại: <span className="font-semibold text-foreground">{fmt(selectedAcc.balance || 0)}đ</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="p-2">
                                <Input
                                  type="number"
                                  value={l.amount || ""}
                                  onChange={(e) => updateSimpleLine(idx, "amount", parseFloat(e.target.value) || 0)}
                                  className="text-right text-xs h-8 font-mono"
                                  placeholder="0"
                                  min="0"
                                />
                              </TableCell>
                              <TableCell className="p-2">
                                <Input
                                  value={l.memo || ""}
                                  onChange={(e) => updateSimpleLine(idx, "memo", e.target.value)}
                                  className="text-xs h-8"
                                  placeholder="Nhập diễn giải riêng..."
                                />
                              </TableCell>
                              <TableCell className="p-2 text-center">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeSimpleLine(idx)}
                                  disabled={simpleLines.length <= 1}
                                  className="h-7 w-7 text-red-500 hover:text-red-700"
                                >
                                  ×
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="font-bold bg-muted/10">
                          <TableCell className="text-right">Tổng cộng</TableCell>
                          <TableCell className="text-right font-mono text-xs">{fmt(totalSimpleAmount)}đ</TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/50 rounded-lg text-xs space-y-1 text-blue-800 dark:text-blue-200">
                  <p className="font-semibold">💡 Định khoản tự động (Kế toán kép):</p>
                  <div className="space-y-1 pl-1">
                    {simpleType === "expense" && (
                      <>
                        <p>Hệ thống tự động ghi nhận nghiệp vụ chi tiền kép:</p>
                        <ul className="list-disc list-inside text-[11px] pl-1 opacity-90">
                          {simpleLines.filter(l => l.account_id && Number(l.amount) > 0).map((l, idx) => {
                            const acc = accounts.find(a => a.id === l.account_id);
                            return (
                              <li key={idx}>Ghi **Nợ (Dr)** TK {acc ? `${acc.code} - ${acc.name}` : "mục chi"}: <span className="font-semibold">{fmt(l.amount)}đ</span></li>
                            );
                          })}
                          {simpleSourceAcc && (
                            <li>Ghi **Có (Cr)** TK {accounts.find(a => a.id === simpleSourceAcc)?.code || "nguồn tiền"}: <span className="font-semibold">{fmt(totalSimpleAmount)}đ</span></li>
                          )}
                        </ul>
                      </>
                    )}
                    {simpleType === "income" && (
                      <>
                        <p>Hệ thống tự động ghi nhận nghiệp vụ thu tiền kép:</p>
                        <ul className="list-disc list-inside text-[11px] pl-1 opacity-90">
                          {simpleSourceAcc && (
                            <li>Ghi **Nợ (Dr)** TK {accounts.find(a => a.id === simpleSourceAcc)?.code || "tài khoản nhận"}: <span className="font-semibold">{fmt(totalSimpleAmount)}đ</span></li>
                          )}
                          {simpleLines.filter(l => l.account_id && Number(l.amount) > 0).map((l, idx) => {
                            const acc = accounts.find(a => a.id === l.account_id);
                            return (
                              <li key={idx}>Ghi **Có (Cr)** TK {acc ? `${acc.code} - ${acc.name}` : "phân loại"}: <span className="font-semibold">{fmt(l.amount)}đ</span></li>
                            );
                          })}
                        </ul>
                      </>
                    )}
                    {simpleType === "purchase_on_credit" && (
                      <>
                        <p>Hệ thống tự động ghi nhận nghiệp vụ mua chịu kép:</p>
                        <ul className="list-disc list-inside text-[11px] pl-1 opacity-90">
                          {simpleLines.filter(l => l.account_id && Number(l.amount) > 0).map((l, idx) => {
                            const acc = accounts.find(a => a.id === l.account_id);
                            return (
                              <li key={idx}>Ghi **Nợ (Dr)** TK {acc ? `${acc.code} - ${acc.name}` : "hàng hóa"}: <span className="font-semibold">{fmt(l.amount)}đ</span></li>
                            );
                          })}
                          {simpleSourceAcc && (
                            <li>Ghi **Có (Cr)** TK {accounts.find(a => a.id === simpleSourceAcc)?.code || "nhà cung cấp"}: <span className="font-semibold">{fmt(totalSimpleAmount)}đ</span></li>
                          )}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>

            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">Danh sách dòng định khoản</span>
                  <Button variant="outline" size="sm" onClick={addEntryLine} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Thêm dòng
                  </Button>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1 border border-dashed text-muted-foreground my-2">
                  <p className="font-semibold text-foreground flex items-center gap-1">💡 Quy tắc định khoản bút toán kép:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    <div>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Tài sản (1xx, 2xx) & Chi phí (6xx):</span>
                      <ul className="list-disc list-inside pl-1 text-[11px] mt-0.5">
                        <li>Ghi **Nợ (Dr)** = <span className="text-emerald-600 font-semibold">Tăng (+)</span> tài sản / chi phí</li>
                        <li>Ghi **Có (Cr)** = <span className="text-red-500 font-semibold">Giảm (-)</span> tài sản / chi phí</li>
                      </ul>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Nợ phải trả (3xx), Vốn CSH (4xx) & Doanh thu (5xx):</span>
                      <ul className="list-disc list-inside pl-1 text-[11px] mt-0.5">
                        <li>Ghi **Nợ (Dr)** = <span className="text-red-500 font-semibold">Giảm (-)</span> nợ / vốn / doanh thu</li>
                        <li>Ghi **Có (Cr)** = <span className="text-emerald-600 font-semibold">Tăng (+)</span> nợ / vốn / doanh thu</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Tài khoản</TableHead>
                        <TableHead className="w-[150px] text-right">Nợ (Dr)</TableHead>
                        <TableHead className="w-[150px] text-right">Có (Cr)</TableHead>
                        <TableHead>Diễn giải dòng</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newEntryLines.map((l, idx) => {
                        const selectedAcc = accounts.find(a => a.id === l.account_id);
                        const accType = selectedAcc?.account_type;
                        const isDebitIncrease = accType === "asset" || accType === "expense";

                        return (
                          <TableRow key={idx} className="hover:bg-transparent">
                            <TableCell className="p-2">
                              <select
                                value={l.account_id}
                                onChange={(e) => updateEntryLine(idx, "account_id", e.target.value)}
                                className="w-full bg-background border rounded px-2 py-1 outline-none text-xs h-8"
                              >
                                <option value="">-- Chọn tài khoản --</option>
                                {accounts.map(a => (
                                  <option key={a.id} value={a.id}>{a.code} - {a.name} (Số dư: {fmt(a.balance || 0)}đ)</option>
                                ))}
                              </select>
                              {selectedAcc && (
                                <div className="text-[10px] text-muted-foreground mt-1 px-1 font-medium">
                                  Số dư hiện tại: <span className="font-semibold text-foreground">{fmt(selectedAcc.balance || 0)}đ</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="number"
                                value={l.debit || ""}
                                onChange={(e) => updateEntryLine(idx, "debit", parseFloat(e.target.value) || 0)}
                                className="text-right text-xs h-8 font-mono"
                                placeholder="0"
                                min="0"
                              />
                              {accType && (
                                <div className={`text-[10px] mt-1 text-right px-1 font-semibold ${
                                  isDebitIncrease ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                                }`}>
                                  {isDebitIncrease ? "Tăng (+)" : "Giảm (-)"}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="number"
                                value={l.credit || ""}
                                onChange={(e) => updateEntryLine(idx, "credit", parseFloat(e.target.value) || 0)}
                                className="text-right text-xs h-8 font-mono"
                                placeholder="0"
                                min="0"
                              />
                              {accType && (
                                <div className={`text-[10px] mt-1 text-right px-1 font-semibold ${
                                  isDebitIncrease ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                                }`}>
                                  {isDebitIncrease ? "Giảm (-)" : "Tăng (+)"}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                value={l.memo || ""}
                                onChange={(e) => updateEntryLine(idx, "memo", e.target.value)}
                                className="text-xs h-8"
                                placeholder="Ghi chú..."
                              />
                            </TableCell>
                            <TableCell className="p-2 text-center">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeEntryLine(idx)}
                                disabled={newEntryLines.length <= 2}
                                className="h-7 w-7 text-red-500 hover:text-red-700"
                              >
                                ×
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {/* Summary row */}
                      <TableRow className="font-bold bg-muted/10">
                        <TableCell className="text-right">Tổng cộng</TableCell>
                        <TableCell className="text-right font-mono text-xs">{fmt(totalNewDebit)}đ</TableCell>
                        <TableCell className="text-right font-mono text-xs">{fmt(totalNewCredit)}đ</TableCell>
                        <TableCell colSpan={2} className="text-left">
                          {totalNewDebit > 0 && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isBalanced ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                              {isBalanced ? "Đã cân đối" : `Chênh lệch: ${fmt(Math.abs(totalNewDebit - totalNewCredit))}đ`}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {entryMode === "simple" && simpleValidationWarning && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs flex items-center gap-2 font-medium">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span>{simpleValidationWarning}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" size="sm" onClick={() => setCreateEntryOpen(false)}>
              Hủy bỏ
            </Button>
            <Button 
              size="sm" 
              onClick={entryMode === "simple" ? handleCreateSimpleEntry : handleCreateEntry}
              disabled={
                createManualEntry.isPending ||
                (entryMode === "simple" 
                  ? !!simpleValidationWarning
                  : (!newEntryDesc.trim() || !isBalanced)
                )
              }
            >
              {createManualEntry.isPending ? "Đang ghi sổ..." : "Ghi sổ bút toán"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Account Dialog */}
      <Dialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm tài khoản kế toán mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản mới trong danh mục hệ thống tài khoản (Chart of Accounts) để theo dõi số dư chi tiết.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Số hiệu tài khoản (Code)</label>
              <Input 
                value={newAccountCode}
                onChange={(e) => setNewAccountCode(e.target.value)}
                placeholder="Ví dụ: 113, 1388, 6421..."
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Tên tài khoản (Name)</label>
              <Input 
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="Ví dụ: Tiền đang chuyển, Phải thu khác..."
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Loại tài khoản (Type)</label>
              <select
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value)}
                className="w-full bg-background border rounded px-3 py-2 outline-none text-sm h-10"
              >
                <option value="asset">Tài sản (Asset)</option>
                <option value="liability">Nợ phải trả (Liability)</option>
                <option value="equity">Vốn chủ sở hữu (Equity)</option>
                <option value="revenue">Doanh thu (Revenue)</option>
                <option value="expense">Chi phí (Expense)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" size="sm" onClick={() => setCreateAccountOpen(false)}>
              Hủy bỏ
            </Button>
            <Button 
              size="sm" 
              onClick={handleCreateAccount}
              disabled={!newAccountCode.trim() || !newAccountName.trim() || createAccount.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {createAccount.isPending ? "Đang thêm..." : "Thêm tài khoản"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={editAccountOpen} onOpenChange={setEditAccountOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sửa tài khoản: {editAccount?.code}</DialogTitle>
            <DialogDescription>
              Cập nhật tên hoặc loại tài khoản. Số hiệu tài khoản (code) không thể thay đổi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Số hiệu tài khoản (Code)</label>
              <Input 
                value={editAccount?.code || ""}
                disabled
                className="text-sm bg-muted"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Tên tài khoản (Name)</label>
              <Input 
                value={editAccountName}
                onChange={(e) => setEditAccountName(e.target.value)}
                placeholder="Tên tài khoản..."
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Loại tài khoản (Type)</label>
              <select
                value={editAccountType}
                onChange={(e) => setEditAccountType(e.target.value)}
                className="w-full bg-background border rounded px-3 py-2 outline-none text-sm h-10"
              >
                <option value="asset">Tài sản (Asset)</option>
                <option value="liability">Nợ phải trả (Liability)</option>
                <option value="equity">Vốn chủ sở hữu (Equity)</option>
                <option value="revenue">Doanh thu (Revenue)</option>
                <option value="expense">Chi phí (Expense)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" size="sm" onClick={() => setEditAccountOpen(false)}>
              Hủy bỏ
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                if (editAccount) {
                  updateAccount.mutate({
                    id: editAccount.id,
                    name: editAccountName,
                    account_type: editAccountType as any,
                  });
                  setEditAccountOpen(false);
                }
              }}
              disabled={!editAccountName.trim() || updateAccount.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateAccount.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
