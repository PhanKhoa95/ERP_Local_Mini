import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTokenLedger } from "@/hooks/useTokenLedger";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { TokenExchangeDialog } from "./TokenExchangeDialog";
import { Coins, Send, ArrowRightLeft, Plus } from "lucide-react";
import { format } from "date-fns";
import { useStepUpAuth } from "@/hooks/useStepUpAuth";
import { StepUpAuthDialog } from "@/components/auth/StepUpAuthDialog";

export function TokenTab() {
  const { balances, ledger, myBalance, isLoading, issueTokens, transferTokens } = useTokenLedger();
  const { role } = useCompanyContext();
  const isAdmin = role === "admin" || role === "manager";

  const stepUp = useStepUpAuth();
  const [issueOpen, setIssueOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ target_user_id: "", amount: "" });
  const [transferForm, setTransferForm] = useState({ to_user_id: "", amount: "" });

  const handleIssueWithStepUp = async () => {
    const result = await stepUp.requireStepUp("token_issue");
    if (result.approved) {
      setIssueOpen(true);
    }
  };

  const refTypeLabels: Record<string, string> = {
    issuance: "Phát hành",
    transfer: "Chuyển khoản",
    exchange: "Đổi Voucher",
    dividend: "Cổ tức",
  };

  return (
    <div className="space-y-6">
      {/* Balance cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10"><Coins className="h-6 w-6 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Số dư của bạn</p>
                <p className="text-2xl font-bold text-foreground">{myBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
            <Button variant="outline" onClick={handleIssueWithStepUp}><Plus className="h-4 w-4 mr-2" />Phát hành</Button>
            <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
              <DialogContent>
                <DialogHeader><DialogTitle>Phát hành Token</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>User ID nhận</Label><Input value={issueForm.target_user_id} onChange={e => setIssueForm(f => ({ ...f, target_user_id: e.target.value }))} /></div>
                  <div><Label>Số lượng</Label><Input type="number" value={issueForm.amount} onChange={e => setIssueForm(f => ({ ...f, amount: e.target.value }))} /></div>
                  <Button className="w-full" disabled={issueTokens.isPending} onClick={() => {
                    issueTokens.mutate({ target_user_id: issueForm.target_user_id, amount: Number(issueForm.amount) }, {
                      onSuccess: () => { setIssueOpen(false); setIssueForm({ target_user_id: "", amount: "" }); }
                    });
                  }}>Phát hành</Button>
                </div>
              </DialogContent>
            </Dialog>
            </>
          )}

          <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Send className="h-4 w-4 mr-2" />Chuyển</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Chuyển Token</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>User ID nhận</Label><Input value={transferForm.to_user_id} onChange={e => setTransferForm(f => ({ ...f, to_user_id: e.target.value }))} /></div>
                <div><Label>Số lượng</Label><Input type="number" value={transferForm.amount} onChange={e => setTransferForm(f => ({ ...f, amount: e.target.value }))} /></div>
                <Button className="w-full" disabled={transferTokens.isPending} onClick={() => {
                  transferTokens.mutate({ to_user_id: transferForm.to_user_id, amount: Number(transferForm.amount) }, {
                    onSuccess: () => { setTransferOpen(false); setTransferForm({ to_user_id: "", amount: "" }); }
                  });
                }}>Chuyển Token</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => setExchangeOpen(true)}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />Đổi Voucher
          </Button>
        </div>
      </div>

      <TokenExchangeDialog open={exchangeOpen} onOpenChange={setExchangeOpen} />

      {/* Transaction history */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Lịch sử giao dịch</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead className="text-right">Số dư sau</TableHead>
                <TableHead>Tham chiếu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Chưa có giao dịch</TableCell></TableRow>
              )}
              {ledger.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground">{format(new Date(tx.created_at), "dd/MM HH:mm")}</TableCell>
                  <TableCell><Badge variant="outline">{refTypeLabels[tx.reference_type] || tx.reference_type}</Badge></TableCell>
                  <TableCell className={`text-right font-mono ${Number(tx.amount) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {Number(tx.amount) >= 0 ? "+" : ""}{Number(tx.amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">{Number(tx.balance_after).toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{tx.reference_id?.slice(0, 20) || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <StepUpAuthDialog
        open={stepUp.isOpen}
        onOpenChange={() => {}}
        action={stepUp.currentAction}
        isVerifying={stepUp.isVerifying}
        onVerifyPassword={stepUp.verifyPassword}
        onComplete={stepUp.completeStepUp}
        onCancel={stepUp.cancelStepUp}
      />
    </div>
  );
}
