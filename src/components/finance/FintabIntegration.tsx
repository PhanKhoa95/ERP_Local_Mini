import { useState } from "react";
import { useFintab, FintabInvoice, FintabBankAccount, FintabBankTransaction } from "@/hooks/useFintab";
import { useCashVouchers } from "@/hooks/useCashVouchers";
import { useAccounting } from "@/hooks/useAccounting";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, ShieldCheck, RefreshCw, Landmark, ArrowDownLeft, ArrowUpRight,
  Plus, Play, CheckCircle2, Download, Printer, AlertTriangle, Calendar,
  TrendingDown, Check, Coins
} from "lucide-react";

export function FintabIntegration() {
  const {
    taxConfig,
    invoices,
    bankAccounts,
    bankTransactions,
    updateInvoiceStatus,
    simulateNewBankTransaction,
    reconcileBankTransaction
  } = useFintab();

  const { createVoucher, confirmVoucher, vouchers } = useCashVouchers();
  const { accounts } = useAccounting();

  // Active sub tab
  const [activeFintabTab, setActiveFintabTab] = useState<"e_invoices" | "circular_88" | "bank_feeds">("e_invoices");
  
  // E-Invoices filters
  const [invoiceDirection, setInvoiceDirection] = useState<"in" | "out">("in");

  // Dialog States
  const [selectedInvoice, setSelectedInvoice] = useState<FintabInvoice | null>(null);
  const [selectedTx, setSelectedTx] = useState<FintabBankTransaction | null>(null);
  const [openSimTx, setOpenSimTx] = useState(false);
  const [openReportPrint, setOpenReportPrint] = useState(false);

  // Quick Voucher form states
  const [contraAccountId, setContraAccountId] = useState("");
  const [voucherDesc, setVoucherDesc] = useState("");
  const [voucherPaymentMethod, setVoucherPaymentMethod] = useState<"cash" | "bank_transfer">("bank_transfer");

  // Simulated transaction form states
  const [simBankId, setSimBankId] = useState("bank-vcb");
  const [simAmount, setSimAmount] = useState(5000000);
  const [simDirection, setSimDirection] = useState<"in" | "out">("in");
  const [simDesc, setSimDesc] = useState("KHACH HANG CHUYEN KHOAN THANH TOAN DON HANG");

  // Circular 88 Selected Book template
  const [selectedBook, setSelectedBook] = useState<"S1-HKD" | "S5-HKD" | "S6-HKD" | "S3-HKD">("S1-HKD");
  const [downloading, setDownloading] = useState(false);

  const handleOpenVoucherDialog = (invoice: FintabInvoice) => {
    setSelectedInvoice(invoice);
    setVoucherDesc(`Thanh toán hóa đơn điện tử số ${invoice.invoice_number} - ${invoice.supplier_name}`);
    setContraAccountId(invoice.direction === "in" ? "acc-642" : "acc-5111"); // pre-select expense or revenue account if available
  };

  const handleCreateVoucherFromInvoice = async () => {
    if (!selectedInvoice) return;

    // Trigger create draft Cash Voucher
    const draftV = await createVoucher.mutateAsync({
      voucher_type: selectedInvoice.direction === "in" ? "payment" : "receipt",
      partner_id: null,
      partner_name: selectedInvoice.direction === "in" ? selectedInvoice.supplier_name : selectedInvoice.buyer_name,
      amount: selectedInvoice.total_amount,
      payment_method: voucherPaymentMethod,
      account_id: contraAccountId || "acc-642",
      description: voucherDesc,
      reference: selectedInvoice.invoice_number
    });

    // Confirm/Post the voucher automatically
    if (draftV) {
      await confirmVoucher.mutateAsync(draftV.id);
    }

    // Update status in Fintab
    await updateInvoiceStatus.mutateAsync({ id: selectedInvoice.id, status: "synced" });
    setSelectedInvoice(null);
  };

  // Reconcile Bank feed to existing vouchers or create new
  const handleOpenReconcile = (tx: FintabBankTransaction) => {
    setSelectedTx(tx);
    setVoucherDesc(tx.description);
    setContraAccountId(tx.direction === "in" ? "acc-5111" : "acc-642");
  };

  const handleReconcileSubmit = async () => {
    if (!selectedTx) return;

    // Create and confirm cash voucher corresponding to bank transaction
    const draftV = await createVoucher.mutateAsync({
      voucher_type: selectedTx.direction === "in" ? "receipt" : "payment",
      partner_id: null,
      partner_name: selectedTx.direction === "in" ? "Khách chuyển khoản" : "Chi tiền ngân hàng",
      amount: selectedTx.amount,
      payment_method: "bank_transfer",
      account_id: contraAccountId || "acc-5111",
      description: voucherDesc,
      reference: selectedTx.reference_code
    });

    if (draftV) {
      await confirmVoucher.mutateAsync(draftV.id);
      await reconcileBankTransaction.mutateAsync({
        transaction_id: selectedTx.id,
        voucher_id: draftV.id
      });
    }

    setSelectedTx(null);
  };

  const handleSimulateTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await simulateNewBankTransaction.mutateAsync({
      bank_account_id: simBankId,
      amount: Number(simAmount),
      direction: simDirection,
      description: simDesc
    });
    setOpenSimTx(false);
  };

  const handleMockDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      toast.success(`Đã xuất báo cáo ${selectedBook} thành công ra file Excel/PDF!`);
    }, 2000);
  };

  const filteredInvoices = invoices.filter(i => i.direction === invoiceDirection);

  return (
    <div className="space-y-6">
      {/* Overview connections card */}
      <Card className="border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/20 dark:bg-indigo-950/10">
        <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-650 flex items-center justify-center text-white shadow-lg shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                Pancake Fintab Accounting Integration
                <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[8px] tracking-wider">ĐÃ LIÊN KẾT</Badge>
              </h3>
              <p className="text-[11px] text-muted-foreground">Mã số thuế: {taxConfig.tax_code} • Tài khoản Thuế: {taxConfig.username} (Cổng TCT)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs font-semibold hover:bg-secondary/20">
              <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> Đồng bộ Thuế
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeFintabTab} onValueChange={(val: any) => setActiveFintabTab(val)} className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-[480px] bg-muted/60 p-1 rounded-xl text-xs mb-4">
          <TabsTrigger value="e_invoices" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Hóa đơn điện tử</TabsTrigger>
          <TabsTrigger value="circular_88" className="gap-1.5"><Landmark className="h-3.5 w-3.5" /> Sổ sách Thông tư 88</TabsTrigger>
          <TabsTrigger value="bank_feeds" className="gap-1.5"><Landmark className="h-3.5 w-3.5" /> Sổ quỹ &amp; Ngân hàng</TabsTrigger>
        </TabsList>

        {/* Tab 1: Hóa đơn điện tử */}
        <TabsContent value="e_invoices" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border text-[11px]">
              <button
                onClick={() => setInvoiceDirection("in")}
                className={`px-3 py-1 rounded font-bold transition-all ${invoiceDirection === "in" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Hóa đơn đầu vào (Mua vào)
              </button>
              <button
                onClick={() => setInvoiceDirection("out")}
                className={`px-3 py-1 rounded font-bold transition-all ${invoiceDirection === "out" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Hóa đơn đầu ra (Bán ra)
              </button>
            </div>
          </div>

          <Card className="border border-border/80 shadow-md">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground">
                    <th className="p-3 font-semibold">Ký hiệu/Số hóa đơn</th>
                    <th className="p-3 font-semibold">Ngày lập</th>
                    <th className="p-3 font-semibold">Đối tác</th>
                    <th className="p-3 font-semibold text-right">Giá trị trước thuế</th>
                    <th className="p-3 font-semibold text-right">Thuế VAT</th>
                    <th className="p-3 font-semibold text-right">Tổng thanh toán</th>
                    <th className="p-3 font-semibold">Trạng thái hạch toán</th>
                    <th className="p-3 font-semibold text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b hover:bg-secondary/5 transition-colors">
                      <td className="p-3 font-mono font-bold text-foreground">{inv.invoice_number}</td>
                      <td className="p-3">{new Date(inv.invoice_date).toLocaleDateString("vi-VN")}</td>
                      <td className="p-3">
                        <div className="font-bold text-foreground">
                          {inv.direction === "in" ? inv.supplier_name : inv.buyer_name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">MST: {inv.direction === "in" ? inv.supplier_mst : inv.buyer_mst}</div>
                      </td>
                      <td className="p-3 text-right font-mono">{inv.amount_before_tax.toLocaleString("vi-VN")}đ</td>
                      <td className="p-3 text-right">
                        <div className="font-semibold text-foreground">{inv.tax_rate}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{inv.tax_amount.toLocaleString("vi-VN")}đ</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-650">{inv.total_amount.toLocaleString("vi-VN")}đ</td>
                      <td className="p-3">
                        {inv.status === "synced" ? (
                          <Badge className="bg-green-50 text-green-700 border-none font-bold rounded-full">Đã ghi sổ</Badge>
                        ) : inv.status === "pending" ? (
                          <Badge className="bg-amber-50 text-amber-700 border-none font-bold rounded-full">Chờ đối soát</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700 border-none font-bold rounded-full">Nháp</Badge>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {inv.status !== "synced" && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenVoucherDialog(inv)}
                            className="h-7 text-[10px] font-bold bg-indigo-650 hover:bg-indigo-750 text-white gap-1"
                          >
                            <Plus className="h-3 w-3" /> Tạo chứng từ nhanh
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Sổ sách Thông tư 88 */}
        <TabsContent value="circular_88" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Template selector */}
            <div className="lg:col-span-4 space-y-2">
              <h3 className="text-xs font-bold text-foreground mb-2">DANH MỤC SỔ SÁCH KÊ KHAI THUẾ (Circular 88):</h3>
              <div
                onClick={() => setSelectedBook("S1-HKD")}
                className={`p-3 border rounded-xl cursor-pointer text-xs transition-all ${selectedBook === "S1-HKD" ? "border-indigo-400 bg-indigo-50/20 text-indigo-700 font-bold" : "bg-card text-muted-foreground"}`}
              >
                Sổ chi tiết Doanh thu bán hàng (S1-HKD)
              </div>
              <div
                onClick={() => setSelectedBook("S5-HKD")}
                className={`p-3 border rounded-xl cursor-pointer text-xs transition-all ${selectedBook === "S5-HKD" ? "border-indigo-400 bg-indigo-50/20 text-indigo-700 font-bold" : "bg-card text-muted-foreground"}`}
              >
                Sổ chi phí Sản xuất kinh doanh (S5-HKD)
              </div>
              <div
                onClick={() => setSelectedBook("S6-HKD")}
                className={`p-3 border rounded-xl cursor-pointer text-xs transition-all ${selectedBook === "S6-HKD" ? "border-indigo-400 bg-indigo-50/20 text-indigo-700 font-bold" : "bg-card text-muted-foreground"}`}
              >
                Sổ quỹ tiền mặt &amp; tiền gửi ngân hàng (S6-HKD)
              </div>
              <div
                onClick={() => setSelectedBook("S3-HKD")}
                className={`p-3 border rounded-xl cursor-pointer text-xs transition-all ${selectedBook === "S3-HKD" ? "border-indigo-400 bg-indigo-50/20 text-indigo-700 font-bold" : "bg-card text-muted-foreground"}`}
              >
                Sổ theo dõi thực hiện Nghĩa vụ thuế với NSNN (S3-HKD)
              </div>
            </div>

            {/* Visual Book Preview Sheets */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-foreground">Xem trước trang in biểu mẫu</h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleMockDownload} disabled={downloading} className="h-8 text-xs font-bold border-indigo-200 text-indigo-650 hover:bg-indigo-50">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    {downloading ? "Đang xuất..." : "Tải Excel/PDF"}
                  </Button>
                </div>
              </div>

              <Card className="border border-slate-300 dark:border-slate-800 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-6 font-sans overflow-x-auto shadow-lg min-h-[400px]">
                <div className="min-w-[600px] space-y-6">
                  {/* Header template standard */}
                  <div className="flex justify-between text-[10px] font-semibold">
                    <div className="text-left space-y-0.5">
                      <div>Đơn vị: Xưởng in Sticker TPHCM</div>
                      <div>MST: 8090123456</div>
                    </div>
                    <div className="text-right italic">
                      Mẫu số {selectedBook}<br />
                      (Ban hành kèm theo Thông tư số 88/2021/TT-BTC)
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">
                      {selectedBook === "S1-HKD" && "SỔ CHI TIẾT DOANH THU BÁN HÀNG HÓA, DỊCH VỤ"}
                      {selectedBook === "S5-HKD" && "SỔ CHI PHÍ SẢN XUẤT KINH DOANH"}
                      {selectedBook === "S6-HKD" && "SỔ QUỸ TIỀN MẶT VÀ TIỀN GỬI NGÂN HÀNG"}
                      {selectedBook === "S3-HKD" && "SỔ THEO DÕI NGHĨA VỤ THUẾ VỚI NGÂN SÁCH NHÀ NƯỚC"}
                    </h3>
                    <p className="text-[10px] italic">Tháng 7 năm 2026</p>
                  </div>

                  {/* Standard Circular 88 Tables */}
                  {selectedBook === "S1-HKD" && (
                    <table className="w-full border-collapse border border-slate-400 text-[10px] text-left">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 font-bold text-center">
                          <th className="border border-slate-400 p-2" rowSpan={2}>Ngày ghi sổ</th>
                          <th className="border border-slate-400 p-2" colSpan={2}>Chứng từ</th>
                          <th className="border border-slate-400 p-2" rowSpan={2}>Nội dung nghiệp vụ</th>
                          <th className="border border-slate-400 p-2" rowSpan={2}>Doanh thu hàng hóa (8% VAT)</th>
                          <th className="border border-slate-400 p-2" rowSpan={2}>Doanh thu dịch vụ (10% VAT)</th>
                          <th className="border border-slate-400 p-2" rowSpan={2}>Tổng Doanh thu</th>
                        </tr>
                        <tr className="bg-slate-100 dark:bg-slate-900 font-bold text-center">
                          <th className="border border-slate-400 p-2">Số hiệu</th>
                          <th className="border border-slate-400 p-2">Ngày</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border hover:bg-secondary/5 font-medium">
                          <td className="border border-slate-400 p-2 text-center">04/07/2026</td>
                          <td className="border border-slate-400 p-2 text-center font-mono">1C26-OUT01</td>
                          <td className="border border-slate-400 p-2 text-center">04/07/2026</td>
                          <td className="border border-slate-400 p-2">In ấn nhãn mác Sticker cho đối tác Pancake</td>
                          <td className="border border-slate-400 p-2 text-right">42,000,000đ</td>
                          <td className="border border-slate-400 p-2 text-right">—</td>
                          <td className="border border-slate-400 p-2 text-right font-bold">42,000,000đ</td>
                        </tr>
                        <tr className="bg-slate-50 dark:bg-slate-900/40 font-bold text-right">
                          <td className="border border-slate-400 p-2 text-center" colSpan={4}>CỘNG DOANH THU</td>
                          <td className="border border-slate-400 p-2">42,000,000đ</td>
                          <td className="border border-slate-400 p-2">—</td>
                          <td className="border border-slate-400 p-2">42,000,000đ</td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {selectedBook === "S5-HKD" && (
                    <table className="w-full border-collapse border border-slate-400 text-[10px] text-left">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 font-bold text-center">
                          <th className="border border-slate-400 p-2" rowSpan={2}>Ngày ghi sổ</th>
                          <th className="border border-slate-400 p-2" colSpan={2}>Chứng từ</th>
                          <th className="border border-slate-400 p-2" rowSpan={2}>Nội dung nghiệp vụ</th>
                          <th className="border border-slate-400 p-2" colSpan={3}>Chi phí phân loại</th>
                        </tr>
                        <tr className="bg-slate-100 dark:bg-slate-900 font-bold text-center">
                          <th className="border border-slate-400 p-2">Số hiệu</th>
                          <th className="border border-slate-400 p-2">Ngày</th>
                          <th className="border border-slate-400 p-2">Chi mua nguyên vật liệu</th>
                          <th className="border border-slate-400 p-2">Chi lương nhân viên</th>
                          <th className="border border-slate-400 p-2">Chi phí quản lý/Khác</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border hover:bg-secondary/5 font-medium">
                          <td className="border border-slate-400 p-2 text-center">01/07/2026</td>
                          <td className="border border-slate-400 p-2 text-center font-mono">1C26-TA001</td>
                          <td className="border border-slate-400 p-2 text-center">01/07/2026</td>
                          <td className="border border-slate-400 p-2">Mua giấy cuộn bọc nilon bao bì</td>
                          <td className="border border-slate-400 p-2 text-right">16,200,000đ</td>
                          <td className="border border-slate-400 p-2 text-right">—</td>
                          <td className="border border-slate-400 p-2 text-right">—</td>
                        </tr>
                        <tr className="border hover:bg-secondary/5 font-medium">
                          <td className="border border-slate-400 p-2 text-center">05/07/2026</td>
                          <td className="border border-slate-400 p-2 text-center font-mono">PC-0001</td>
                          <td className="border border-slate-400 p-2 text-center">05/07/2026</td>
                          <td className="border border-slate-400 p-2">Thanh toán hóa đơn điện xưởng in</td>
                          <td className="border border-slate-400 p-2 text-right">—</td>
                          <td className="border border-slate-400 p-2 text-right">—</td>
                          <td className="border border-slate-400 p-2 text-right">1,500,000đ</td>
                        </tr>
                        <tr className="bg-slate-50 dark:bg-slate-900/40 font-bold text-right">
                          <td className="border border-slate-400 p-2 text-center" colSpan={4}>TỔNG CỘNG CHI PHÍ</td>
                          <td className="border border-slate-400 p-2">16,200,000đ</td>
                          <td className="border border-slate-400 p-2">—</td>
                          <td className="border border-slate-400 p-2">1,500,000đ</td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {selectedBook === "S6-HKD" && (
                    <table className="w-full border-collapse border border-slate-400 text-[10px] text-left">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 font-bold text-center">
                          <th className="border border-slate-400 p-2" rowSpan={2}>Ngày</th>
                          <th className="border border-slate-400 p-2" colSpan={2}>Chứng từ</th>
                          <th className="border border-slate-400 p-2" rowSpan={2}>Nội dung thu/chi</th>
                          <th className="border border-slate-400 p-2" rowSpan={2}>Số tiền Thu</th>
                          <th className="border border-slate-400 p-2" rowSpan={2}>Số tiền Chi</th>
                          <th className="border border-slate-400 p-2" rowSpan={2}>Số dư quỹ</th>
                        </tr>
                        <tr className="bg-slate-100 dark:bg-slate-900 font-bold text-center">
                          <th className="border border-slate-400 p-2">Số hiệu</th>
                          <th className="border border-slate-400 p-2">Ngày</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border font-medium">
                          <td className="border border-slate-400 p-2 text-center">04/07/2026</td>
                          <td className="border border-slate-400 p-2 text-center font-mono">PT-0001</td>
                          <td className="border border-slate-400 p-2 text-center">04/07/2026</td>
                          <td className="border border-slate-400 p-2">Thu tiền hóa đơn 1C26-OUT01</td>
                          <td className="border border-slate-400 p-2 text-right">45,360,000đ</td>
                          <td className="border border-slate-400 p-2 text-right">—</td>
                          <td className="border border-slate-400 p-2 text-right font-bold">45,360,000đ</td>
                        </tr>
                        <tr className="border font-medium">
                          <td className="border border-slate-400 p-2 text-center">05/07/2026</td>
                          <td className="border border-slate-400 p-2 text-center font-mono">PC-0001</td>
                          <td className="border border-slate-400 p-2 text-center">05/07/2026</td>
                          <td className="border border-slate-400 p-2">Chi thanh toán điện xưởng in</td>
                          <td className="border border-slate-400 p-2 text-right">—</td>
                          <td className="border border-slate-400 p-2 text-right">1,500,000đ</td>
                          <td className="border border-slate-400 p-2 text-right font-bold">43,860,000đ</td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {selectedBook === "S3-HKD" && (
                    <table className="w-full border-collapse border border-slate-400 text-[10px] text-left">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 font-bold text-center">
                          <th className="border border-slate-400 p-2">Loại thuế</th>
                          <th className="border border-slate-400 p-2">Số phải nộp</th>
                          <th className="border border-slate-400 p-2">Số đã nộp</th>
                          <th className="border border-slate-400 p-2">Số còn phải nộp</th>
                          <th className="border border-slate-400 p-2">Chứng từ nộp thuế</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border font-medium">
                          <td className="border border-slate-400 p-2 font-bold">1. Thuế giá trị gia tăng (VAT)</td>
                          <td className="border border-slate-400 p-2 text-right">3,360,000đ</td>
                          <td className="border border-slate-400 p-2 text-right">3,360,000đ</td>
                          <td className="border border-slate-400 p-2 text-right">0đ</td>
                          <td className="border border-slate-400 p-2 text-center font-mono text-[9px]">GDT-816301</td>
                        </tr>
                        <tr className="border font-medium">
                          <td className="border border-slate-400 p-2 font-bold">2. Thuế thu nhập cá nhân (TNCN)</td>
                          <td className="border border-slate-400 p-2 text-right">1,680,000đ</td>
                          <td className="border border-slate-400 p-2 text-right">1,000,000đ</td>
                          <td className="border border-slate-400 p-2 text-right text-rose-600 font-bold">680,000đ</td>
                          <td className="border border-slate-400 p-2 text-center font-mono text-[9px]">GDT-816302</td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {/* Sign block */}
                  <div className="grid grid-cols-2 text-center text-[10px] pt-6 font-semibold">
                    <div className="space-y-12">
                      <div>NGƯỜI LẬP SỔ<br /><span className="text-slate-400 italic font-normal">(Ký, ghi rõ họ tên)</span></div>
                      <div className="font-bold uppercase text-slate-800 dark:text-slate-200">Nguyễn Văn Kế Toán</div>
                    </div>
                    <div className="space-y-12">
                      <div>ĐẠI DIỆN HỘ KINH DOANH<br /><span className="text-slate-400 italic font-normal">(Ký, đóng dấu nếu có)</span></div>
                      <div className="font-bold uppercase text-slate-800 dark:text-slate-200">Phan Khoa</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Đối soát dòng tiền ngân hàng */}
        <TabsContent value="bank_feeds" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Connected bank accounts list */}
            {bankAccounts.map((bank) => (
              <Card key={bank.id} className="border border-border/85 shadow-md">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1 text-xs">
                    <div className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                      <Landmark className="h-4.5 w-4.5 text-indigo-500" />
                      {bank.bank_name}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Số tài khoản: <span className="font-mono font-bold text-foreground">{bank.account_number}</span></p>
                    <p className="text-[10px] text-muted-foreground">Chủ tài khoản: <span className="font-bold text-foreground">{bank.account_holder}</span></p>
                  </div>
                  <div className="text-right space-y-1.5">
                    <div className="text-base font-bold text-indigo-650 font-mono">{bank.balance.toLocaleString("vi-VN")}đ</div>
                    <Badge className="bg-green-50 text-green-700 border-none font-bold text-[8px] uppercase tracking-wider">Đang hoạt động</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-3.5 border-t pt-5">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-xs font-bold text-foreground">Nhật ký biến động số dư Bank Feeds</h3>
              <Button size="sm" onClick={() => setOpenSimTx(true)} className="h-8 text-xs font-bold bg-indigo-650 hover:bg-indigo-750 text-white gap-1 shadow-sm">
                <Play className="h-3.5 w-3.5 fill-white" /> Mô phỏng Giao dịch mới
              </Button>
            </div>

            <Card className="border border-border/80 shadow-md">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b bg-muted/20 text-muted-foreground">
                      <th className="p-3 font-semibold">Tài khoản ngân hàng</th>
                      <th className="p-3 font-semibold">Thời gian</th>
                      <th className="p-3 font-semibold">Mã giao dịch (Ref)</th>
                      <th className="p-3 font-semibold">Diễn giải chuyển khoản</th>
                      <th className="p-3 font-semibold text-right">Biến động số tiền</th>
                      <th className="p-3 font-semibold">Đối soát sổ quỹ</th>
                      <th className="p-3 font-semibold text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankTransactions.map((tx) => {
                      const bank = bankAccounts.find(b => b.id === tx.bank_account_id);
                      return (
                        <tr key={tx.id} className="border-b hover:bg-secondary/5 transition-colors">
                          <td className="p-3 font-bold text-foreground">{bank ? bank.bank_name : "Ngân hàng"}</td>
                          <td className="p-3">{new Date(tx.transaction_date).toLocaleString("vi-VN")}</td>
                          <td className="p-3 font-mono text-[10px] text-muted-foreground">{tx.reference_code}</td>
                          <td className="p-3 italic text-muted-foreground">"{tx.description}"</td>
                          <td className="p-3 text-right">
                            <span className={`font-mono font-bold ${tx.direction === 'in' ? 'text-green-600' : 'text-rose-600'}`}>
                              {tx.direction === 'in' ? '+' : '-'}{tx.amount.toLocaleString("vi-VN")}đ
                            </span>
                          </td>
                          <td className="p-3">
                            {tx.is_reconciled ? (
                              <Badge className="bg-green-50 text-green-700 border-none font-bold rounded-full">✓ Khớp dòng tiền</Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-700 border-none font-bold rounded-full">Chưa đối soát</Badge>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {!tx.is_reconciled && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenReconcile(tx)}
                                className="h-7 text-[10px] font-bold bg-indigo-650 hover:bg-indigo-750 text-white"
                              >
                                Đối soát ngay
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Create Voucher from Invoice */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-[420px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Plus className="h-4.5 w-4.5 text-indigo-500" /> Tạo chứng từ nhanh từ Hóa đơn điện tử
            </DialogTitle>
            <DialogDescription className="text-xs">Trích xuất điền nhanh dữ liệu từ Hóa đơn số {selectedInvoice?.invoice_number}.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="font-semibold">Mã đối tác</Label>
                <Input readOnly className="h-8 text-xs bg-muted/40" value={selectedInvoice?.direction === "in" ? selectedInvoice.supplier_name : selectedInvoice.buyer_name} />
              </div>
              <div>
                <Label className="font-semibold">Tổng tiền thanh toán</Label>
                <Input readOnly className="h-8 text-xs bg-muted/40 font-mono" value={selectedInvoice ? `${selectedInvoice.total_amount.toLocaleString("vi-VN")}đ` : ""} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold">Diễn giải chứng từ *</Label>
              <Input className="h-8 text-xs" value={voucherDesc} onChange={e => setVoucherDesc(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="font-semibold">Phương thức chi</Label>
                <Select value={voucherPaymentMethod} onValueChange={(val: any) => setVoucherPaymentMethod(val)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-foreground">
                    <SelectItem value="cash">Tiền mặt</SelectItem>
                    <SelectItem value="bank_transfer">Chuyển khoản ngân hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Tài khoản đối ứng *</Label>
                <Select value={contraAccountId} onValueChange={setContraAccountId}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Chọn tài khoản..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-foreground">
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t pt-3">
            <Button type="button" size="sm" variant="outline" onClick={() => setSelectedInvoice(null)}>Hủy</Button>
            <Button type="button" onClick={handleCreateVoucherFromInvoice} className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">Xác nhận &amp; Ghi sổ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Reconcile Bank Transaction */}
      <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <DialogContent className="sm:max-w-[420px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Landmark className="h-4.5 w-4.5 text-indigo-500" /> Đối soát giao dịch Ngân hàng sang Sổ quỹ
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="font-semibold">Số tiền biến động</Label>
                <Input readOnly className="h-8 text-xs bg-muted/40 font-mono font-bold" value={selectedTx ? `${selectedTx.direction === 'in' ? '+' : '-'}${selectedTx.amount.toLocaleString("vi-VN")}đ` : ""} />
              </div>
              <div>
                <Label className="font-semibold">Mã tham chiếu (Ref)</Label>
                <Input readOnly className="h-8 text-xs bg-muted/40 font-mono" value={selectedTx?.reference_code} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold">Diễn giải chuyển khoản *</Label>
              <Input className="h-8 text-xs" value={voucherDesc} onChange={e => setVoucherDesc(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label className="font-semibold">Tài khoản đối ứng định khoản *</Label>
              <Select value={contraAccountId} onValueChange={setContraAccountId}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Chọn tài khoản..." />
                </SelectTrigger>
                <SelectContent className="bg-popover text-foreground">
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t pt-3">
            <Button type="button" size="sm" variant="outline" onClick={() => setSelectedTx(null)}>Hủy</Button>
            <Button type="button" onClick={handleReconcileSubmit} className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">Khớp số liệu &amp; Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Simulate New Bank Transaction */}
      <Dialog open={openSimTx} onOpenChange={setOpenSimTx}>
        <DialogContent className="sm:max-w-[400px] bg-background text-foreground text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Play className="h-4.5 w-4.5 text-indigo-500" /> Mô phỏng giao dịch biến động số dư Bank Feeds
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSimulateTransactionSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="font-semibold">Tài khoản ngân hàng</Label>
                <Select value={simBankId} onValueChange={setSimBankId}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-foreground">
                    {bankAccounts.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.bank_name} ({b.account_number})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Loại giao dịch</Label>
                <Select value={simDirection} onValueChange={(val: any) => setSimDirection(val)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-foreground">
                    <SelectItem value="in">Báo có (Nhận tiền)</SelectItem>
                    <SelectItem value="out">Báo nợ (Chuyển khoản chi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="simAmountInput" className="font-semibold">Số tiền biến động (VND) *</Label>
                <Input
                  id="simAmountInput"
                  type="number"
                  className="h-8 text-xs"
                  value={simAmount}
                  onChange={e => setSimAmount(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="simDescInput" className="font-semibold">Diễn giải chuyển khoản *</Label>
                <Input
                  id="simDescInput"
                  className="h-8 text-xs"
                  value={simDesc}
                  onChange={e => setSimDesc(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2 border-t pt-3">
              <Button type="button" size="sm" variant="outline" onClick={() => setOpenSimTx(false)}>Hủy</Button>
              <Button type="submit" size="sm" className="bg-indigo-650 hover:bg-indigo-750 text-white font-semibold shadow-sm">Gửi mô phỏng</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
