import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Plus, ArrowDownLeft, ArrowUpRight, Check, X, Search, FileText, Eye,
  Ban, Printer,
} from "lucide-react";
import { useCashVouchers, type VoucherType } from "@/hooks/useCashVouchers";
import { useAccounting } from "@/hooks/useAccounting";
import { useProjects } from "@/hooks/useProjects";

const fmt = (n: number) => n.toLocaleString("vi-VN");

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Nháp", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  confirmed: { label: "Đã xác nhận", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  voided: { label: "Đã hủy", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  other: "Khác",
};

export function CashVoucherTab() {
  const { vouchers, partners, createVoucher, confirmVoucher, voidVoucher } = useCashVouchers();
  const { accounts } = useAccounting();
  const { projects = [] } = useProjects();

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [formType, setFormType] = useState<VoucherType>("receipt");
  const [formPartnerId, setFormPartnerId] = useState("");
  const [formPartnerName, setFormPartnerName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState<"cash" | "bank_transfer" | "other">("cash");
  const [formAccountId, setFormAccountId] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formRef, setFormRef] = useState("");

  // Detail dialog
  const [detailVoucher, setDetailVoucher] = useState<any | null>(null);

  const filtered = useMemo(() => {
    let list = [...vouchers];
    if (typeFilter !== "all") list = list.filter(v => v.voucher_type === typeFilter);
    if (statusFilter !== "all") list = list.filter(v => v.status === statusFilter);
    if (projectFilter !== "all") list = list.filter(v => v.project_id === projectFilter);
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter(v =>
        v.voucher_number.toLowerCase().includes(s) ||
        v.partner_name.toLowerCase().includes(s) ||
        v.description.toLowerCase().includes(s)
      );
    }
    return list;
  }, [vouchers, typeFilter, statusFilter, projectFilter, searchTerm]);

  // Totals
  const totalReceipt = filtered.filter(v => v.voucher_type === "receipt" && v.status === "confirmed").reduce((s, v) => s + v.amount, 0);
  const totalPayment = filtered.filter(v => v.voucher_type === "payment" && v.status === "confirmed").reduce((s, v) => s + v.amount, 0);

  const resetForm = () => {
    setFormPartnerId("");
    setFormPartnerName("");
    setFormAmount("");
    setFormMethod("cash");
    setFormAccountId("");
    setFormProjectId("");
    setFormDesc("");
    setFormRef("");
  };

  const handleCreate = () => {
    const amount = Number(formAmount);
    if (amount <= 0) return;
    const partnerName = formPartnerName.trim() || (partners.find((p: any) => p.id === formPartnerId)?.name || "Không xác định");
    
    // Auto-append project code tag for ledger reporting transparency
    const proj = projects.find((p: any) => p.id === formProjectId);
    const projTag = proj ? ` [${proj.code}]` : "";
    const finalDesc = formDesc.trim() 
      ? `${formDesc.trim()}${projTag}`
      : `${formType === "receipt" ? "Thu tiền" : "Chi tiền"}${projTag}`;

    createVoucher.mutate({
      voucher_type: formType,
      partner_id: formPartnerId || null,
      partner_name: partnerName,
      amount,
      payment_method: formMethod,
      account_id: formAccountId,
      description: finalDesc,
      reference: formRef || null,
      project_id: formProjectId || null,
    });
    setCreateOpen(false);
    resetForm();
  };

  // Get relevant accounts for contra side based on voucher type
  const getContraAccounts = () => {
    if (formType === "receipt") {
      // Thu tiền: contra accounts are revenue, receivable, liability reduction
      return accounts.filter(a => a.code !== "1111" && a.code !== "1121");
    } else {
      // Chi tiền: contra accounts are expense, payable, asset purchase
      return accounts.filter(a => a.code !== "1111" && a.code !== "1121");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Sổ quỹ — Phiếu thu / Phiếu chi</CardTitle>
            <Badge variant="secondary" className="text-xs">{vouchers.length} phiếu</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs"
              onClick={() => { setFormType("receipt"); resetForm(); setCreateOpen(true); }}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" /> Phiếu thu
            </Button>
            <Button
              size="sm"
              className="h-8 bg-orange-600 hover:bg-orange-700 text-white gap-1 text-xs"
              onClick={() => { setFormType("payment"); resetForm(); setCreateOpen(true); }}
            >
              <ArrowUpRight className="h-3.5 w-3.5" /> Phiếu chi
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50">
              <p className="text-xs text-muted-foreground">Tổng thu (đã xác nhận)</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono">{fmt(totalReceipt)}đ</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200/50">
              <p className="text-xs text-muted-foreground">Tổng chi (đã xác nhận)</p>
              <p className="text-lg font-bold text-orange-700 dark:text-orange-300 font-mono">{fmt(totalPayment)}đ</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50">
              <p className="text-xs text-muted-foreground">Chênh lệch (Thu − Chi)</p>
              <p className={`text-lg font-bold font-mono ${totalReceipt - totalPayment >= 0 ? "text-blue-700 dark:text-blue-300" : "text-red-600"}`}>
                {totalReceipt - totalPayment >= 0 ? "+" : ""}{fmt(totalReceipt - totalPayment)}đ
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200/50">
              <p className="text-xs text-muted-foreground">Phiếu nháp chờ xác nhận</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400 font-mono">{vouchers.filter(v => v.status === "draft").length}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm theo số phiếu, đối tác, diễn giải..."
                className="pl-8 h-9 text-xs"
              />
            </div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-background border rounded px-2 py-1 text-xs h-9 outline-none"
            >
              <option value="all">Tất cả loại</option>
              <option value="receipt">Phiếu thu</option>
              <option value="payment">Phiếu chi</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-background border rounded px-2 py-1 text-xs h-9 outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">Nháp</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="voided">Đã hủy</option>
            </select>
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="bg-background border rounded px-2 py-1 text-xs h-9 outline-none"
            >
              <option value="all">Tất cả dự án</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Chưa có phiếu thu / phiếu chi nào.</p>
              <p className="text-xs mt-1">Nhấn nút <strong>"Phiếu thu"</strong> hoặc <strong>"Phiếu chi"</strong> ở trên để tạo mới.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Số phiếu</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Đối tác</TableHead>
                    <TableHead>Dự án</TableHead>
                    <TableHead>Diễn giải</TableHead>
                    <TableHead>Phương thức</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right w-[130px]">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(v => {
                    const st = STATUS_MAP[v.status] || STATUS_MAP.draft;
                    const proj = projects.find((p: any) => p.id === v.project_id);
                    return (
                      <TableRow key={v.id} className="group">
                        <TableCell className="font-mono font-semibold text-xs">{v.voucher_number}</TableCell>
                        <TableCell>
                          {v.voucher_type === "receipt" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                              <ArrowDownLeft className="h-3 w-3" /> Thu
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-orange-700 dark:text-orange-400">
                              <ArrowUpRight className="h-3 w-3" /> Chi
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm max-w-[140px] truncate">{v.partner_name}</TableCell>
                        <TableCell className="text-xs">
                          {proj ? (
                            <Badge variant="outline" className="text-[10px] bg-blue-50/50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400 border-blue-200">
                              {proj.code}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{v.description}</TableCell>
                        <TableCell className="text-xs">{PAYMENT_METHOD_LABELS[v.payment_method] || v.payment_method}</TableCell>
                        <TableCell className={`text-right font-mono font-semibold ${v.voucher_type === "receipt" ? "text-emerald-600" : "text-orange-600"}`}>
                          {v.voucher_type === "receipt" ? "+" : "−"}{fmt(v.amount)}đ
                        </TableCell>
                        <TableCell>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Xem chi tiết" onClick={() => setDetailVoucher(v)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {v.status === "draft" && (
                              <Button
                                variant="ghost" size="sm" className="h-7 w-7 p-0" title="Xác nhận phiếu"
                                onClick={() => confirmVoucher.mutate(v.id)}
                              >
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              </Button>
                            )}
                            {v.status !== "voided" && (
                              <Button
                                variant="ghost" size="sm" className="h-7 w-7 p-0" title="Hủy phiếu"
                                onClick={() => {
                                  if (confirm(`Bạn có chắc muốn hủy ${v.voucher_number}?`)) {
                                    voidVoucher.mutate(v.id);
                                  }
                                }}
                              >
                                <Ban className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ───── Create Voucher Dialog ───── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {formType === "receipt" ? (
                <><ArrowDownLeft className="h-5 w-5 text-emerald-600" /> Tạo Phiếu thu mới</>
              ) : (
                <><ArrowUpRight className="h-5 w-5 text-orange-600" /> Tạo Phiếu chi mới</>
              )}
            </DialogTitle>
            <DialogDescription>
              {formType === "receipt"
                ? "Ghi nhận khoản thu tiền từ khách hàng, đối tác hoặc nguồn khác."
                : "Ghi nhận khoản chi tiền cho nhà cung cấp, chi phí hoặc mục đích khác."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* Partner */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Đối tác (Khách hàng / NCC)</label>
              <select
                value={formPartnerId}
                onChange={e => {
                  setFormPartnerId(e.target.value);
                  const p = partners.find((p: any) => p.id === e.target.value);
                  if (p) setFormPartnerName(p.name);
                }}
                className="w-full bg-background border rounded px-3 py-2 outline-none text-sm h-10"
              >
                <option value="">-- Chọn đối tác hoặc nhập tay bên dưới --</option>
                {partners.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.code} - {p.name} ({p.partner_type === "customer" ? "KH" : "NCC"})</option>
                ))}
              </select>
              <Input
                value={formPartnerName}
                onChange={e => setFormPartnerName(e.target.value)}
                placeholder="Hoặc nhập tên đối tác thủ công..."
                className="text-sm mt-1"
              />
            </div>

            {/* Related Project */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Dự án liên quan (Tùy chọn)</label>
              <select
                value={formProjectId}
                onChange={e => setFormProjectId(e.target.value)}
                className="w-full bg-background border rounded px-3 py-2 outline-none text-sm h-10"
              >
                <option value="">-- Không liên kết dự án --</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                ))}
              </select>
            </div>

            {/* Amount + Method */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Số tiền</label>
                <Input
                  type="number"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  placeholder="0"
                  className="text-sm font-mono"
                  min={0}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Phương thức</label>
                <select
                  value={formMethod}
                  onChange={e => setFormMethod(e.target.value as any)}
                  className="w-full bg-background border rounded px-3 py-2 outline-none text-sm h-10"
                >
                  <option value="cash">💵 Tiền mặt</option>
                  <option value="bank_transfer">🏦 Chuyển khoản</option>
                  <option value="other">📋 Khác</option>
                </select>
              </div>
            </div>

            {/* Contra account */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Tài khoản đối ứng {formType === "receipt" ? "(Nguồn thu — giảm phải thu / tăng doanh thu)" : "(Mục chi — tăng chi phí / giảm nợ phải trả)"}
              </label>
              <select
                value={formAccountId}
                onChange={e => setFormAccountId(e.target.value)}
                className="w-full bg-background border rounded px-3 py-2 outline-none text-sm h-10"
              >
                <option value="">-- Chọn tài khoản --</option>
                {formType === "receipt" ? (
                  <>
                    <optgroup label="👤 Giảm phải thu khách hàng">
                      {accounts.filter(a => a.code.startsWith("131")).map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="💰 Doanh thu">
                      {accounts.filter(a => a.account_type === "revenue").map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🔄 Giảm nợ phải trả / Ví thành viên">
                      {accounts.filter(a => a.account_type === "liability").map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="⚙️ Tài khoản khác">
                      {accounts.filter(a => !a.code.startsWith("131") && a.account_type !== "revenue" && a.account_type !== "liability" && a.code !== "1111" && a.code !== "1121").map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  <>
                    <optgroup label="💸 Chi phí vận hành">
                      {accounts.filter(a => a.account_type === "expense").map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🤝 Trả nợ nhà cung cấp">
                      {accounts.filter(a => a.code.startsWith("331")).map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🏗️ Mua tài sản / Đầu tư">
                      {accounts.filter(a => a.code.startsWith("211") || a.code.startsWith("241") || a.code.startsWith("156")).map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="⚙️ Tài khoản khác">
                      {accounts.filter(a => a.account_type !== "expense" && !a.code.startsWith("331") && !a.code.startsWith("211") && !a.code.startsWith("241") && !a.code.startsWith("156") && a.code !== "1111" && a.code !== "1121").map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </optgroup>
                  </>
                )}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Diễn giải / Nội dung</label>
              <Input
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                placeholder={formType === "receipt" ? "Ví dụ: Thu tiền đơn hàng POS-123, Thu nợ KH..." : "Ví dụ: Thanh toán tiền điện, Trả nợ NCC..."}
                className="text-sm"
              />
            </div>

            {/* Reference */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Số tham chiếu (tuỳ chọn)</label>
              <Input
                value={formRef}
                onChange={e => setFormRef(e.target.value)}
                placeholder="Số hoá đơn, số đơn hàng, UNC..."
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t mt-4">
            <p className="text-xs text-muted-foreground">
              Phiếu sẽ được tạo ở trạng thái <strong>Nháp</strong>. Bấm xác nhận để ghi sổ kế toán.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Hủy</Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!formAmount || Number(formAmount) <= 0 || !formAccountId || !formPartnerName.trim() || createVoucher.isPending}
                className={formType === "receipt" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-orange-600 hover:bg-orange-700 text-white"}
              >
                {createVoucher.isPending ? "Đang tạo..." : `Tạo ${formType === "receipt" ? "Phiếu thu" : "Phiếu chi"}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ───── Detail / Print-ready Dialog ───── */}
      <Dialog open={!!detailVoucher} onOpenChange={() => setDetailVoucher(null)}>
        <DialogContent className="max-w-lg">
          {detailVoucher && (() => {
            const isReceipt = detailVoucher.voucher_type === "receipt";
            const st = STATUS_MAP[detailVoucher.status] || STATUS_MAP.draft;
            const contraAcc = accounts.find(a => a.id === detailVoucher.account_id);
            const cashLabel = detailVoucher.payment_method === "bank_transfer" ? "1121 - Tiền gửi ngân hàng" : "1111 - Tiền mặt";
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {isReceipt ? <ArrowDownLeft className="h-5 w-5 text-emerald-600" /> : <ArrowUpRight className="h-5 w-5 text-orange-600" />}
                    {isReceipt ? "PHIẾU THU" : "PHIẾU CHI"} — {detailVoucher.voucher_number}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 my-2 text-sm">
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <div className="text-muted-foreground">Số phiếu:</div>
                    <div className="font-mono font-bold">{detailVoucher.voucher_number}</div>

                    <div className="text-muted-foreground">Trạng thái:</div>
                    <div><span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span></div>

                    <div className="text-muted-foreground">Đối tác:</div>
                    <div className="font-semibold">{detailVoucher.partner_name}</div>

                    <div className="text-muted-foreground">Số tiền:</div>
                    <div className={`font-mono font-bold text-base ${isReceipt ? "text-emerald-600" : "text-orange-600"}`}>
                      {isReceipt ? "+" : "−"}{fmt(detailVoucher.amount)}đ
                    </div>

                    <div className="text-muted-foreground">Phương thức:</div>
                    <div>{PAYMENT_METHOD_LABELS[detailVoucher.payment_method]}</div>

                    <div className="text-muted-foreground">Diễn giải:</div>
                    <div>{detailVoucher.description}</div>

                    {detailVoucher.project_id && (() => {
                      const p = projects.find((proj: any) => proj.id === detailVoucher.project_id);
                      return p ? (
                        <>
                          <div className="text-muted-foreground">Dự án liên quan:</div>
                          <div className="font-semibold text-blue-600 dark:text-blue-400">{p.code} - {p.name}</div>
                        </>
                      ) : null;
                    })()}

                    {detailVoucher.reference && (
                      <>
                        <div className="text-muted-foreground">Tham chiếu:</div>
                        <div>{detailVoucher.reference}</div>
                      </>
                    )}

                    <div className="text-muted-foreground">Ngày tạo:</div>
                    <div>{new Date(detailVoucher.created_at).toLocaleString("vi-VN")}</div>

                    {detailVoucher.confirmed_at && (
                      <>
                        <div className="text-muted-foreground">Ngày xác nhận:</div>
                        <div>{new Date(detailVoucher.confirmed_at).toLocaleString("vi-VN")}</div>
                      </>
                    )}
                  </div>

                  {/* Accounting breakdown */}
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Định khoản kế toán:</p>
                    <table className="w-full text-xs border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-2 py-1 border-b">Tài khoản</th>
                          <th className="text-right px-2 py-1 border-b">Nợ (Dr)</th>
                          <th className="text-right px-2 py-1 border-b">Có (Cr)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isReceipt ? (
                          <>
                            <tr>
                              <td className="px-2 py-1 border-b">{cashLabel}</td>
                              <td className="text-right px-2 py-1 border-b font-mono">{fmt(detailVoucher.amount)}</td>
                              <td className="text-right px-2 py-1 border-b">-</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1">{contraAcc ? `${contraAcc.code} - ${contraAcc.name}` : detailVoucher.account_id}</td>
                              <td className="text-right px-2 py-1">-</td>
                              <td className="text-right px-2 py-1 font-mono">{fmt(detailVoucher.amount)}</td>
                            </tr>
                          </>
                        ) : (
                          <>
                            <tr>
                              <td className="px-2 py-1 border-b">{contraAcc ? `${contraAcc.code} - ${contraAcc.name}` : detailVoucher.account_id}</td>
                              <td className="text-right px-2 py-1 border-b font-mono">{fmt(detailVoucher.amount)}</td>
                              <td className="text-right px-2 py-1 border-b">-</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1">{cashLabel}</td>
                              <td className="text-right px-2 py-1">-</td>
                              <td className="text-right px-2 py-1 font-mono">{fmt(detailVoucher.amount)}</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t mt-3">
                  <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1 text-xs">
                    <Printer className="h-3.5 w-3.5" /> In phiếu
                  </Button>
                  <div className="flex gap-2">
                    {detailVoucher.status === "draft" && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs"
                        onClick={() => { confirmVoucher.mutate(detailVoucher.id); setDetailVoucher(null); }}
                      >
                        <Check className="h-3.5 w-3.5" /> Xác nhận & Ghi sổ
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setDetailVoucher(null)}>Đóng</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
