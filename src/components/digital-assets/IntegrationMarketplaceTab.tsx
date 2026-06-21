import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, ShoppingCart, Layers, CheckCircle2, XCircle } from "lucide-react";
import { useIntegrationConfigs } from "@/hooks/useIntegrationConfigs";
import { ConnectPartnerDialog } from "./ConnectPartnerDialog";

const PARTNERS = [
  { type: "sapo", name: "Sapo POS", icon: Store, color: "text-blue-500", desc: "Đồng bộ đơn hàng, tồn kho và khách hàng từ Sapo" },
  { type: "kiotviet", name: "KiotViet", icon: ShoppingCart, color: "text-green-500", desc: "Tích hợp API trực tiếp với KiotViet Retail" },
  { type: "vieterp", name: "VietERP", icon: Layers, color: "text-red-500", desc: "Tích hợp toàn diện các API HRM, CRM, MRP, Kế toán từ nền tảng VietERP" },
  { type: "custom", name: "Custom ERP", icon: Layers, color: "text-purple-500", desc: "Sử dụng Universal Adapter để kết nối hệ thống khác" },
];

export function IntegrationMarketplaceTab() {
  const { configs, disconnectConfig } = useIntegrationConfigs();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState({ type: "", name: "" });

  const getConfigForPartner = (partnerType: string) =>
    configs.find((c: any) => c.partner_type === partnerType && c.is_active);

  const handleConnect = (type: string, name: string) => {
    setSelectedPartner({ type, name });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {PARTNERS.map((p) => {
          const config = getConfigForPartner(p.type);
          const isConnected = !!config;
          const Icon = p.icon;

          return (
            <Card key={p.type} className={isConnected ? "border-green-500/50" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${p.color}`} /> {p.name}
                  {isConnected && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
                </CardTitle>
                <CardDescription>{p.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Client ID: {(config as any).client_id ? `${(config as any).client_id.substring(0, 8)}...` : "N/A"} · Đồng bộ: {(config as any).sync_frequency}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => disconnectConfig.mutate((config as any).id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Ngắt kết nối
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => handleConnect(p.type, p.name)} className="w-full">
                    Kết nối ngay
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ConnectPartnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        partnerType={selectedPartner.type}
        partnerName={selectedPartner.name}
      />
    </div>
  );
}
