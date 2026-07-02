import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Calendar, Landmark, FileText, ArrowRightLeft } from "lucide-react";
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
}

const TRANSACTIONS_KEY = "erp-mini-local-demo-payment-transactions";
const PARTNERS_KEY = "erp-mini-local-demo-partners";
const ORDERS_KEY = "erp-mini-local-demo-orders";

export function TransactionsTab() {
  const [transactions, setTransactions] = useState<LocalPaymentTransaction[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

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
    const rawOrders = localStorage.getItem(ORDERS_KEY);
    if (rawOrders) {
      try {
        setOrders(JSON.parse(rawOrders));
      } catch (e) {
        setOrders([]);
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

  const typeConfig: Record<string, { label: string; color: string }> = {
    payment_in: { label: "Thu tiền", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    payment_out: { label: "Chi tiền", color: "bg-red-500/10 text-red-600 border-red-500/20" },
    receivable: { label: "Phải thu (Công nợ)", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    payable: { label: "Phải trả (Công nợ)", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  };

  const methodLabels: Record<string, string> = {
    tien_mat: "Tiền mặt",
    chuyen_khoan: "Chuyển khoản",
    vietqr: "VietQR",
    momo: "Momo",
    vnpay: "VNPAY",
    cod: "Thu hộ COD",
  };

  const filteredList = useMemo(() => {
    return transactions.filter((tx) => {
      const partner = partners.find((p) => p.id === tx.partner_id);
      const partnerName = partner ? partner.name.toLowerCase() : "";
      
      const order = orders.find((o) => o.id === tx.order_id);
      const orderNum = order ? order.order_number.toLowerCase() : "";

      const matchesSearch =
        (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.reference_number && tx.reference_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        partnerName.includes(searchTerm.toLowerCase()) ||
        orderNum.includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || tx.transaction_type === typeFilter;

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

      return matchesSearch && matchesType && matchesDate;
    });
  }, [transactions, partners, orders, searchTerm, typeFilter, dateRange]);

  return (
    <div className="space-y-4 text-foreground text-xs">
      <Card className="shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo đối tác, mã đơn, mã gd..."
                  className="pl-8 h-8 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Loại giao dịch" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="payment_in">Giao dịch thu (In)</SelectItem>
                  <SelectItem value="payment_out">Giao dịch chi (Out)</SelectItem>
                  <SelectItem value="receivable">Công nợ phải thu</SelectItem>
                  <SelectItem value="payable">Công nợ phải trả</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Thời gian" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Tất cả thời gian</SelectItem>
                  <SelectItem value="today">Hôm nay</SelectItem>
                  <SelectItem value="week">7 ngày qua</SelectItem>
                  <SelectItem value="month">30 ngày qua</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-muted-foreground text-[11px]">
              Hiển thị <strong>{filteredList.length}</strong> giao dịch thanh toán
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/20 text-muted-foreground">
                  <th className="p-3 text-left font-medium">Mã GD / Ngày tháng</th>
                  <th className="p-3 text-left font-medium">Đối tác</th>
                  <th className="p-3 text-left font-medium">Đơn hàng liên kết</th>
                  <th className="p-3 text-left font-medium">Loại GD</th>
                  <th className="p-3 text-left font-medium">Phương thức</th>
                  <th className="p-3 text-right font-medium">Số tiền</th>
                  <th className="p-3 text-left font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((tx) => {
                  const partner = partners.find((p) => p.id === tx.partner_id);
                  const order = orders.find((o) => o.id === tx.order_id);
                  const conf = typeConfig[tx.transaction_type] || { label: tx.transaction_type, color: "" };
                  const isPositive = tx.transaction_type === "payment_in" || tx.transaction_type === "receivable";

                  return (
                    <tr key={tx.id} className="border-b hover:bg-secondary/15 transition-colors">
                      <td className="p-3">
                        <div className="font-bold font-mono text-foreground">{tx.reference_number || tx.id.slice(0, 10).toUpperCase()}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(tx.transaction_date).toLocaleString("vi-VN")}
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-foreground">
                        {partner ? partner.name : "Vãng lai / Không tên"}
                      </td>
                      <td className="p-3 font-mono">
                        {order ? (
                          <Badge variant="outline" className="font-bold text-[9px] px-1 py-0">
                            {order.order_number}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge className={cn("text-[9px] px-1.5 py-0", conf.color)}>
                          {conf.label}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium text-foreground">
                        {methodLabels[tx.payment_method || ""] || tx.payment_method || "—"}
                      </td>
                      <td className="p-3 text-right font-bold">
                        <span className={isPositive ? "text-emerald-600" : "text-red-500"}>
                          {isPositive ? "+" : "-"}
                          {tx.amount.toLocaleString("vi-VN")}đ
                        </span>
                      </td>
                      <td className="p-3 max-w-[180px] truncate text-muted-foreground" title={tx.notes || ""}>
                        {tx.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Không tìm thấy giao dịch thanh toán nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
