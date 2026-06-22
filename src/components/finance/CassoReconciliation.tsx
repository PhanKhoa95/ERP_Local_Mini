import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, CreditCard, CheckCircle2, ShieldCheck, HelpCircle, ArrowDownLeft } from "lucide-react";
import { toast } from "sonner";

export function CassoReconciliation() {
  const [syncing, setSyncing] = useState(false);
  const [apiKey, setApiKey] = useState("casso_api_live_***89f2");
  
  const [transactions, setTransactions] = useState([
    {
      id: "FT26128038102",
      description: "CHUYEN TIEN DH9812",
      amount: 450000,
      bank: "Vietcombank",
      account: "1028374827",
      status: "matched",
      orderCode: "DH9812",
      time: "2026-06-22 14:10:02"
    },
    {
      id: "FT26128038105",
      description: "KHOA MEDIA CK DH8821",
      amount: 1250000,
      bank: "Techcombank",
      account: "190384729180",
      status: "matched",
      orderCode: "DH8821",
      time: "2026-06-22 13:45:10"
    },
    {
      id: "FT26128038109",
      description: "NGUYEN VAN A THANH TOAN",
      amount: 320000,
      bank: "MB Bank",
      account: "09823847291",
      status: "unmatched",
      orderCode: null,
      time: "2026-06-22 12:20:15"
    }
  ]);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      // Simulate discovering a new transaction and matching it
      const newTx = {
        id: `FT2612803${Math.floor(Math.random() * 90000) + 10000}`,
        description: "THANH TOAN DON HANG DH7731",
        amount: 890000,
        bank: "VietinBank",
        account: "1038471928",
        status: "matched",
        orderCode: "DH7731",
        time: new Date().toLocaleString("vi-VN")
      };
      
      setTransactions(prev => [newTx, ...prev]);
      toast.success("Đã đồng bộ thành công với cổng Casso! Phát hiện 1 giao dịch mới đã được đối soát tự động.");
      setSyncing(false);
    }, 1500);
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Tự động hóa đối soát ngân hàng (Casso Integration)
            </CardTitle>
            <CardDescription>
              Kết nối trực tiếp tài khoản ngân hàng doanh nghiệp qua Casso API để tự động xác nhận thanh toán đơn hàng bằng VietQR
            </CardDescription>
          </div>
          <Button onClick={handleSync} disabled={syncing} className="gap-2 shrink-0">
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Đồng bộ giao dịch ngay
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 border rounded-lg bg-muted/20 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase">API Trạng thái</div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                <ShieldCheck className="h-4 w-4" />
                Đang kết nối (Live)
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Cập nhật lần cuối: 2 phút trước</div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/20 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Webhook Endpoint</div>
              <div className="text-xs font-mono text-muted-foreground truncate select-all mt-1 bg-background p-1 border rounded">
                https://api.qtdn.vn/v1/webhooks/casso
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Tự động nhận callback chuyển khoản 24/7</div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/20 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Tỷ lệ đối soát tự động</div>
              <div className="text-2xl font-bold text-primary mt-1">94.8%</div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Khớp lệnh tự động qua cú pháp chuyển khoản & VietQR</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Giao dịch ngân hàng đồng bộ gần đây</h4>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã giao dịch</TableHead>
                  <TableHead>Nội dung chuyển khoản</TableHead>
                  <TableHead>Ngân hàng</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Đối soát ERP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors text-sm">
                    <td className="font-mono text-xs">{tx.id}</td>
                    <td className="font-medium">{tx.description}</td>
                    <td>
                      <div className="text-xs">{tx.bank}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{tx.account}</div>
                    </td>
                    <td className="font-semibold text-emerald-600 dark:text-emerald-400">
                      +{tx.amount.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="text-xs text-muted-foreground">{tx.time}</td>
                    <td>
                      {tx.status === "matched" ? (
                        <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Khớp đơn {tx.orderCode}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <HelpCircle className="h-3 w-3" />
                          Chờ đối soát thủ công
                        </Badge>
                      )}
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
