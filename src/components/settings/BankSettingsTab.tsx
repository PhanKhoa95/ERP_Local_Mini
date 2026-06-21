import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShopSettings, type BankInfo, type ShopInfo } from "@/hooks/useShopSettings";
import { Loader2, CreditCard, Store, QrCode, Copy, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";

export function BankSettingsTab() {
  const { bankInfo, shopInfo, isLoading, updateBankInfo, updateShopInfo } = useShopSettings();
  const { toast } = useToast();

  const [bankForm, setBankForm] = useState<BankInfo>({
    bank_name: "",
    account_number: "",
    account_holder: "",
    branch: "",
  });

  const [shopForm, setShopForm] = useState<ShopInfo>({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (bankInfo) setBankForm(bankInfo);
  }, [bankInfo]);

  useEffect(() => {
    if (shopInfo) setShopForm(shopInfo);
  }, [shopInfo]);

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBankInfo.mutate(bankForm);
  };

  const handleShopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopInfo.mutate(shopForm);
  };

  const orderUrl = `${window.location.origin}/order`;
  const trackingUrl = `${window.location.origin}/tracking`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `Đã sao chép ${label}` });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shop Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Thông tin cửa hàng
          </CardTitle>
          <CardDescription>Thông tin hiển thị trên trang đặt hàng công khai</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleShopSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên cửa hàng</Label>
                <Input
                  value={shopForm.name}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                  placeholder="VD: Shop ABC"
                />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input
                  value={shopForm.phone}
                  onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                  placeholder="VD: 0901234567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input
                value={shopForm.address}
                onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
              />
            </div>
            <Button type="submit" disabled={updateShopInfo.isPending}>
              {updateShopInfo.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lưu thông tin
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bank Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Thông tin chuyển khoản
          </CardTitle>
          <CardDescription>Hiển thị khi khách hàng chọn thanh toán chuyển khoản</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBankSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên ngân hàng</Label>
                <Input
                  value={bankForm.bank_name}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                  placeholder="VD: MB Bank, Vietcombank..."
                />
              </div>
              <div className="space-y-2">
                <Label>Chi nhánh</Label>
                <Input
                  value={bankForm.branch}
                  onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                  placeholder="VD: Chi nhánh Hà Nội"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số tài khoản</Label>
                <Input
                  value={bankForm.account_number}
                  onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                  placeholder="VD: 0123456789"
                />
              </div>
              <div className="space-y-2">
                <Label>Chủ tài khoản</Label>
                <Input
                  value={bankForm.account_holder}
                  onChange={(e) => setBankForm({ ...bankForm, account_holder: e.target.value })}
                  placeholder="VD: NGUYEN VAN A"
                />
              </div>
            </div>
            <Button type="submit" disabled={updateBankInfo.isPending}>
              {updateBankInfo.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lưu thông tin
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* QR Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code & Link chia sẻ
          </CardTitle>
          <CardDescription>Chia sẻ link hoặc QR code để khách hàng đặt hàng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Page QR */}
            <div className="text-center space-y-3">
              <p className="font-medium">Trang đặt hàng</p>
              <div className="bg-white p-4 rounded-lg inline-block mx-auto">
                <QRCodeSVG value={orderUrl} size={150} />
              </div>
              <div className="flex items-center gap-2 justify-center">
                <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px]">
                  {orderUrl}
                </code>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(orderUrl, "link đặt hàng")}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href={orderUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Tracking Page QR */}
            <div className="text-center space-y-3">
              <p className="font-medium">Tra cứu đơn hàng</p>
              <div className="bg-white p-4 rounded-lg inline-block mx-auto">
                <QRCodeSVG value={trackingUrl} size={150} />
              </div>
              <div className="flex items-center gap-2 justify-center">
                <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px]">
                  {trackingUrl}
                </code>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(trackingUrl, "link tra cứu")}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
