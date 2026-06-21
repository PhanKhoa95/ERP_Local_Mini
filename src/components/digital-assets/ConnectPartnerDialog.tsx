import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIntegrationConfigs } from "@/hooks/useIntegrationConfigs";
import { useApiGateway } from "@/hooks/useApiGateway";
import { Loader2 } from "lucide-react";

interface ConnectPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerType: string;
  partnerName: string;
}

export function ConnectPartnerDialog({ open, onOpenChange, partnerType, partnerName }: ConnectPartnerDialogProps) {
  const { createConfig } = useIntegrationConfigs();
  const { generateKey } = useApiGateway();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [syncFrequency, setSyncFrequency] = useState("hourly");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConnect = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create integration config
      await createConfig.mutateAsync({
        partner_name: partnerName,
        partner_type: partnerType,
        client_id: clientId || undefined,
        client_secret_hash: clientSecret || undefined,
        webhook_url: webhookUrl || undefined,
        sync_frequency: syncFrequency,
      });

      // 2. Auto-generate a scoped API key for the partner
      await generateKey.mutateAsync({
        key_name: `${partnerName} Auto-Key`,
        partner_type: partnerType,
        scopes: ["read:orders", "read:inventory"],
      });

      setClientId("");
      setClientSecret("");
      setWebhookUrl("");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kết nối {partnerName}</DialogTitle>
          <DialogDescription>
            Nhập thông tin API từ {partnerName} để bắt đầu đồng bộ dữ liệu. ERP+ sẽ tự động tạo Scoped Key bảo mật.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Client ID</Label>
            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder={`Client ID từ ${partnerName}`} />
          </div>
          <div className="grid gap-2">
            <Label>Client Secret</Label>
            <Input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="grid gap-2">
            <Label>Webhook URL (tuỳ chọn)</Label>
            <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid gap-2">
            <Label>Tần suất đồng bộ</Label>
            <Select value={syncFrequency} onValueChange={setSyncFrequency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Realtime</SelectItem>
                <SelectItem value="hourly">Mỗi giờ</SelectItem>
                <SelectItem value="daily">Mỗi ngày</SelectItem>
                <SelectItem value="manual">Thủ công</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={handleConnect} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Kết nối & Tạo Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
