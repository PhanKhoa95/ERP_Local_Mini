import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, KeyRound, Fingerprint, Loader2, AlertTriangle } from "lucide-react";
import { SensitiveAction } from "@/hooks/useStepUpAuth";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: SensitiveAction | null;
  isVerifying: boolean;
  onVerifyPassword: (password: string) => Promise<boolean>;
  onComplete: (result: { approved: boolean; method?: string }) => void;
  onCancel: () => void;
}

const actionLabels: Record<SensitiveAction, string> = {
  token_issue: "Phát hành Token",
  share_transfer: "Chuyển nhượng cổ phiếu",
  config_change: "Thay đổi cấu hình hệ thống",
  approve_expense: "Duyệt chi phí lớn",
  contract_sign: "Ký hợp đồng giá trị cao",
};

export function StepUpAuthDialog({ open, onOpenChange, action, isVerifying, onVerifyPassword, onComplete, onCancel }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await onVerifyPassword(password);
    if (success) {
      setPassword("");
      onComplete({ approved: true, method: "password" });
    } else {
      setError("Mật khẩu không đúng. Vui lòng thử lại.");
    }
  };

  const handleVneidVerify = () => {
    // Simulated VNeID verification - in production would call real VNeID API
    onComplete({ approved: true, method: "vneid" });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Xác thực bảo mật nâng cao
          </DialogTitle>
          <DialogDescription>
            Thao tác <strong>{action ? actionLabels[action] : ""}</strong> yêu cầu xác thực lại để đảm bảo an toàn.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-xs text-destructive">Đây là thao tác nhạy cảm. Vui lòng xác thực danh tính trước khi tiếp tục.</p>
        </div>

        <Tabs defaultValue="password" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password" className="gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              Mật khẩu
            </TabsTrigger>
            <TabsTrigger value="vneid" className="gap-1.5">
              <Fingerprint className="h-3.5 w-3.5" />
              VNeID
            </TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nhập lại mật khẩu</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu tài khoản"
                  autoFocus
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              <Button type="submit" className="w-full gap-2" disabled={isVerifying || !password}>
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Xác nhận
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="vneid">
            <div className="space-y-4 pt-2">
              <div className="text-center py-6 space-y-3">
                <Fingerprint className="h-12 w-12 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Xác thực qua VNeID để tiếp tục thao tác</p>
              </div>
              <Button onClick={handleVneidVerify} className="w-full gap-2" variant="outline">
                <Fingerprint className="h-4 w-4" />
                Xác thực VNeID
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>Hủy bỏ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
