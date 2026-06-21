import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContracts, SmartContract } from "@/hooks/useContracts";
import { ShieldCheck, Loader2, Wifi, WifiOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useStepUpAuth } from "@/hooks/useStepUpAuth";
import { StepUpAuthDialog } from "@/components/auth/StepUpAuthDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: SmartContract | null;
}

export function ContractSignDialog({ open, onOpenChange, contract }: Props) {
  const { signContract } = useContracts();
  const stepUp = useStepUpAuth();
  const [vneidHash, setVneidHash] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  if (!contract) return null;

  const handleSign = async () => {
    // Require step-up auth for high-value contracts
    if (contract.total_value > 50000000) {
      const result = await stepUp.requireStepUp("contract_sign");
      if (!result.approved) return;
    }
    const offlineHash = isOffline
      ? btoa(`${contract.id}:${Date.now()}:${contract.title}`)
      : undefined;

    signContract.mutate({
      contract_id: contract.id,
      vneid_hash: vneidHash || undefined,
      offline_hash: offlineHash,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setVneidHash("");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Ký số hợp đồng
          </DialogTitle>
          <DialogDescription>{contract.title} - {contract.contract_number}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Mã xác thực VNeID (tùy chọn)</Label>
            <Input value={vneidHash} onChange={e => setVneidHash(e.target.value)} placeholder="Nhập hash VNeID đã xác thực" />
            <p className="text-xs text-muted-foreground mt-1">Nếu đã xác thực VNeID, nhập mã hash để gắn kết danh tính</p>
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {isOffline ? <WifiOff className="h-4 w-4 text-orange-500" /> : <Wifi className="h-4 w-4 text-green-500" />}
            <div className="flex-1">
              <Label className="cursor-pointer">Ký offline</Label>
              <p className="text-xs text-muted-foreground">Tạo bản băm nội bộ, đối chiếu khi có mạng</p>
            </div>
            <Switch checked={isOffline} onCheckedChange={setIsOffline} />
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-1">Thông tin hợp đồng:</p>
            <p>Giá trị: {contract.total_value.toLocaleString("vi-VN")}đ</p>
            <p>Ngành: {contract.industry}</p>
            <p>Loại: {contract.contract_type}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSign} disabled={signContract.isPending} className="gap-2">
            {signContract.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Xác nhận ký
          </Button>
        </DialogFooter>
      </DialogContent>

      <StepUpAuthDialog
        open={stepUp.isOpen}
        onOpenChange={() => {}}
        action={stepUp.currentAction}
        isVerifying={stepUp.isVerifying}
        onVerifyPassword={stepUp.verifyPassword}
        onComplete={stepUp.completeStepUp}
        onCancel={stepUp.cancelStepUp}
      />
    </Dialog>
  );
}
