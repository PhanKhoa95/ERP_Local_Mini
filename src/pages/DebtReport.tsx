import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Loader2,
  TrendingUp,
  Users,
  Building2,
  Calendar,
} from "lucide-react";
import { usePaymentTransactions } from "@/hooks/usePaymentTransactions";
import { usePartners } from "@/hooks/usePartners";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--info))",
];

const DebtReport = () => {
  const { transactions, isLoading, debtSummary } = usePaymentTransactions();
  const { customers, suppliers } = usePartners();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Calculate totals
  const totals = useMemo(() => {
    const customerDebt = debtSummary
      .filter((p) => p.partner_type === "customer" || p.partner_type === "both")
      .reduce((sum, p) => sum + (Number(p.debt_amount) || 0), 0);

    const supplierDebt = debtSummary
      .filter((p) => p.partner_type === "supplier" || p.partner_type === "both")
      .reduce((sum, p) => sum + (Number(p.debt_amount) || 0), 0);

    return {
      customerDebt: Math.abs(customerDebt),
      supplierDebt: Math.abs(supplierDebt),
      netDebt: customerDebt + supplierDebt,
    };
  }, [debtSummary]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.partners?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.partners?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPartner =
        selectedPartner === "all" || t.partner_id === selectedPartner;

      const matchesType =
        selectedType === "all" || t.transaction_type === selectedType;

      return matchesSearch && matchesPartner && matchesType;
    });
  }, [transactions, searchTerm, selectedPartner, selectedType]);

  // Chart data for debt by partner type
  const debtByTypeData = useMemo(() => {
    const customerTotal = debtSummary
      .filter((p) => p.partner_type === "customer")
      .reduce((sum, p) => sum + Math.abs(Number(p.debt_amount) || 0), 0);

    const supplierTotal = debtSummary
      .filter((p) => p.partner_type === "supplier")
      .reduce((sum, p) => sum + Math.abs(Number(p.debt_amount) || 0), 0);

    return [
      { name: "Khách hàng", value: customerTotal },
      { name: "Nhà cung cấp", value: supplierTotal },
    ].filter((d) => d.value > 0);
  }, [debtSummary]);

  // Top debtors chart data
  const topDebtorsData = useMemo(() => {
    return debtSummary
      .slice(0, 10)
      .map((p) => ({
        name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
        debt: Math.abs(Number(p.debt_amount) || 0) / 1000000,
      }));
  }, [debtSummary]);

  // Monthly transaction summary
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { received: number; paid: number }>();

    transactions.forEach((t) => {
      const month = format(new Date(t.transaction_date), "MM/yyyy");
      const existing = monthMap.get(month) || { received: 0, paid: 0 };

      if (t.transaction_type === "payment_in") {
        existing.received += Number(t.amount) || 0;
      } else if (t.transaction_type === "payment_out") {
        existing.paid += Number(t.amount) || 0;
      }

      monthMap.set(month, existing);
    });

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        received: data.received / 1000000,
        paid: data.paid / 1000000,
      }))
      .slice(-6)
      .reverse();
  }, [transactions]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString("vi-VN");
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      receivable: "Ghi nợ KH",
      payable: "Ghi nợ NCC",
      payment_in: "Thu tiền",
      payment_out: "Chi tiền",
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      receivable: "bg-warning/10 text-warning",
      payable: "bg-destructive/10 text-destructive",
      payment_in: "bg-success/10 text-success",
      payment_out: "bg-info/10 text-info",
    };
    return colors[type] || "bg-secondary text-secondary-foreground";
  };

  if (isLoading) {
    return (
      <MainLayout>
        <Header title="Báo cáo công nợ" subtitle="Phân tích công nợ chi tiết" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header
        title="Báo cáo công nợ"
        subtitle="Phân tích công nợ và lịch sử thanh toán"
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <ArrowDownLeft className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Công nợ phải thu
                </p>
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(totals.customerDebt)}đ
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10">
                <ArrowUpRight className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Công nợ phải trả</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(totals.supplierDebt)}đ
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Công nợ ròng</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    totals.netDebt >= 0 ? "text-success" : "text-destructive"
                  )}
                >
                  {formatCurrency(Math.abs(totals.netDebt))}đ
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-info/10">
                <Users className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đối tác có nợ</p>
                <p className="text-2xl font-bold text-info">
                  {debtSummary.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phân bổ công nợ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {debtByTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={debtByTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {debtByTypeData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) =>
                          `${formatCurrency(value)}đ`
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Không có dữ liệu công nợ
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top 10 đối tác nợ nhiều nhất</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {topDebtorsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topDebtorsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => `${v}M`}
                        fontSize={12}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        fontSize={11}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value}M`, "Công nợ"]}
                      />
                      <Bar
                        dataKey="debt"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Không có dữ liệu
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thu chi theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis tickFormatter={(v) => `${v}M`} fontSize={12} />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}M`, ""]}
                    />
                    <Legend />
                    <Bar
                      dataKey="received"
                      name="Thu tiền"
                      fill="hsl(var(--success))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="paid"
                      name="Chi tiền"
                      fill="hsl(var(--destructive))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Chưa có dữ liệu giao dịch
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Lịch sử giao dịch</TabsTrigger>
            <TabsTrigger value="debtors">Danh sách công nợ</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo đối tác, mã tham chiếu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Chọn đối tác" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả đối tác</SelectItem>
                  {[...customers, ...suppliers].map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Loại giao dịch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="receivable">Ghi nợ KH</SelectItem>
                  <SelectItem value="payable">Ghi nợ NCC</SelectItem>
                  <SelectItem value="payment_in">Thu tiền</SelectItem>
                  <SelectItem value="payment_out">Chi tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transactions Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Đối tác</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Mã tham chiếu</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(t.transaction_date), "dd/MM/yyyy", {
                            locale: vi,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {t.partners?.partner_type === "customer" ? (
                            <Users className="h-4 w-4 text-primary" />
                          ) : (
                            <Building2 className="h-4 w-4 text-warning" />
                          )}
                          <div>
                            <p className="font-medium">{t.partners?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.partners?.code}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getTransactionTypeColor(t.transaction_type)}
                        >
                          {getTransactionTypeLabel(t.transaction_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {t.reference_number || t.orders?.order_number || "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span
                          className={
                            t.transaction_type === "payment_in"
                              ? "text-success"
                              : t.transaction_type === "payment_out"
                              ? "text-destructive"
                              : ""
                          }
                        >
                          {t.transaction_type === "payment_in" && "+"}
                          {t.transaction_type === "payment_out" && "-"}
                          {Number(t.amount).toLocaleString("vi-VN")}đ
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {t.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Không có giao dịch nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="debtors" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Tên đối tác</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead className="text-right">Tổng chi tiêu</TableHead>
                    <TableHead className="text-right">Công nợ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtSummary.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">{p.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {p.partner_type === "customer" ? (
                            <Users className="h-4 w-4 text-primary" />
                          ) : (
                            <Building2 className="h-4 w-4 text-warning" />
                          )}
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {p.partner_type === "customer"
                            ? "Khách hàng"
                            : p.partner_type === "supplier"
                            ? "Nhà cung cấp"
                            : "Cả hai"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(p.total_spent || 0).toLocaleString("vi-VN")}đ
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-semibold",
                            Number(p.debt_amount) > 0
                              ? "text-warning"
                              : "text-destructive"
                          )}
                        >
                          {Number(p.debt_amount || 0).toLocaleString("vi-VN")}đ
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {debtSummary.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Không có công nợ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default DebtReport;
