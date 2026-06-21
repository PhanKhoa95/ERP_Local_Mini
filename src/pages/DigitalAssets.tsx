import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SharesTab } from "@/components/digital-assets/SharesTab";
import { TokenTab } from "@/components/digital-assets/TokenTab";
import { VNeIDTab } from "@/components/digital-assets/VNeIDTab";
import { BlockchainConfigTab } from "@/components/digital-assets/BlockchainConfigTab";
import { IntegrationMarketplaceTab } from "@/components/digital-assets/IntegrationMarketplaceTab";
import { ApiKeyManagementPanel } from "@/components/digital-assets/ApiKeyManagementPanel";
import { IntegrationQueueViewer } from "@/components/digital-assets/IntegrationQueueViewer";
import { WebhookLogsPanel } from "@/components/digital-assets/WebhookLogsPanel";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { PieChart, Coins, Fingerprint, Link2, Workflow } from "lucide-react";

const DigitalAssets = () => {
  const { role } = useCompanyContext();
  const isAdmin = role === "admin";

  return (
    <MainLayout>
      <Header title="Tài sản số & Kết nối" subtitle="Quản trị cổ phiếu, token, xác thực & API Gateway" />
      <Tabs defaultValue="shares" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="shares" className="gap-2"><PieChart className="h-4 w-4" />Cổ phiếu</TabsTrigger>
          <TabsTrigger value="tokens" className="gap-2"><Coins className="h-4 w-4" />Token</TabsTrigger>
          <TabsTrigger value="vneid" className="gap-2"><Fingerprint className="h-4 w-4" />Xác thực</TabsTrigger>
          {isAdmin && <TabsTrigger value="integration" className="gap-2"><Workflow className="h-4 w-4" />API Gateway</TabsTrigger>}
          {isAdmin && <TabsTrigger value="blockchain" className="gap-2"><Link2 className="h-4 w-4" />Blockchain</TabsTrigger>}
        </TabsList>

        <TabsContent value="shares"><SharesTab /></TabsContent>
        <TabsContent value="tokens"><TokenTab /></TabsContent>
        <TabsContent value="vneid"><VNeIDTab /></TabsContent>
        {isAdmin && (
          <TabsContent value="integration" className="space-y-6">
            <IntegrationMarketplaceTab />
            <ApiKeyManagementPanel />
            <div className="grid gap-6 md:grid-cols-2">
              <IntegrationQueueViewer />
              <WebhookLogsPanel />
            </div>
          </TabsContent>
        )}
        {isAdmin && <TabsContent value="blockchain"><BlockchainConfigTab /></TabsContent>}
      </Tabs>
    </MainLayout>
  );
};

export default DigitalAssets;
