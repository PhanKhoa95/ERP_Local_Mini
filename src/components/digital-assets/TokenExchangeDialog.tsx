import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTokenLedger } from "@/hooks/useTokenLedger";
import { ArrowRight, Ticket } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function TokenExchangeDialog({ open, onOpenChange }: Props) {
  const { myBalance, exchangeVoucher } = useTokenLedger();
  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState("10");

  const handleExchange = () => {
    if (!amount || Number(amount) <= 0) return;
    exchangeVoucher.mutate(
      { amount: Number(amount), voucher_discount: Number(discount) },
      { onSuccess: () => { onOpenChange(false); setAmount(""); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />Đổi Token lấy Voucher
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted text-center">
            <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
            <p className="text-2xl font-bold text-foreground">{myBalance.toLocaleString()} Token</p>
          </div>
          <div>
            <Label>Số token đổi</Label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} max={myBalance} placeholder="100" />
          </div>
          <div>
            <Label>Giảm giá voucher (%)</Label>
            <Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} min={1} max={100} />
          </div>
          <div className="flex items-center justify-center gap-3 py-2 text-muted-foreground">
            <span className="font-mono">{amount || 0} Token</span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-mono">Voucher giảm {discount}%</span>
          </div>
          <Button onClick={handleExchange} disabled={exchangeVoucher.isPending || !amount} className="w-full">
            {exchangeVoucher.isPending ? "Đang xử lý..." : "Xác nhận đổi"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
