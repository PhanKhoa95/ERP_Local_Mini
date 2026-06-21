import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CreditCard, Banknote, Building2 } from "lucide-react";
import { usePaymentTransactions } from "@/hooks/usePaymentTransactions";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: {
    id: string;
    name: string;
    partner_type: string;
    debt_amount?: number;
  } | null;
}

export function PaymentDialog({ open, onOpenChange, partner }: PaymentDialogProps) {
  const { createTransaction } = usePaymentTransactions();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  if (!partner) return null;

  const isCustomer = partner.partner_type === "customer" || partner.partner_type === "both";
  const debtAmount = Number(partner.debt_amount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createTransaction.mutateAsync({
      partner_id: partner.id,
      transaction_type: isCustomer ? "payment_in" : "payment_out",
      amount: Number(amount),
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      notes: notes || null,
    });

    setAmount("");
    setReferenceNumber("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCustomer ? "Ghi nhận thanh toán từ khách hàng" : "Ghi nhận thanh toán cho NCC"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Đối tác</p>
            <p className="font-semibold text-foreground">{partner.name}</p>
            <p className="text-sm mt-2">
              Công nợ hiện tại:{" "}
              <span className={debtAmount > 0 ? "text-destructive font-semibold" : "text-success font-semibold"}>
                {debtAmount.toLocaleString("vi-VN")}đ
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Số tiền thanh toán *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              min={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Phương thức thanh toán</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={paymentMethod === "cash" ? "default" : "outline"}
                className="flex-col h-auto py-3"
                onClick={() => setPaymentMethod("cash")}
              >
                <Banknote className="h-5 w-5 mb-1" />
                <span className="text-xs">Tiền mặt</span>
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "transfer" ? "default" : "outline"}
                className="flex-col h-auto py-3"
                onClick={() => setPaymentMethod("transfer")}
              >
                <Building2 className="h-5 w-5 mb-1" />
                <span className="text-xs">Chuyển khoản</span>
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "card" ? "default" : "outline"}
                className="flex-col h-auto py-3"
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard className="h-5 w-5 mb-1" />
                <span className="text-xs">Thẻ</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Mã giao dịch / Số phiếu</Label>
            <Input
              id="reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="VD: PT001, CK123..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thanh toán..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!amount || createTransaction.isPending}>
              {createTransaction.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ghi nhận thanh toán
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
