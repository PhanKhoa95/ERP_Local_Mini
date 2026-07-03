import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Printer, Eye, Save, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STORAGE_KEY = "erp-mini-print-template-settings";

export interface PrintTemplateSettings {
  show_logo: boolean;
  logo_url: string;
  header_text: string;
  show_sku: boolean;
  show_variant: boolean;
  show_discount_column: boolean;
  show_bank_info: boolean;
  show_qr_code: boolean;
  footer_text: string;
  paper_size: "80mm" | "A4" | "A5";
  font_size: "12px" | "13px" | "14px";
}

const DEFAULT_SETTINGS: PrintTemplateSettings = {
  show_logo: true,
  logo_url: "",
  header_text: "HÓA ĐƠN BÁN HÀNG",
  show_sku: true,
  show_variant: true,
  show_discount_column: true,
  show_bank_info: true,
  show_qr_code: false,
  footer_text: "Cảm ơn quý khách đã mua hàng!",
  paper_size: "A4",
  font_size: "13px",
};

export function usePrintTemplateSettings(): PrintTemplateSettings {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

// Sample data for live preview
const SAMPLE_ORDER = {
  id: "DH-2024001",
  date: new Date().toLocaleDateString("vi-VN"),
  customer: "Nguyễn Văn A",
  phone: "0901234567",
  items: [
    { sku: "SP001", name: "Áo thun nam", variant: "L / Trắng", qty: 2, price: 250000, discount: 10 },
    { sku: "SP002", name: "Quần jean nữ", variant: "28 / Xanh", qty: 1, price: 450000, discount: 0 },
  ],
  bank_name: "Vietcombank",
  bank_account: "1234567890",
  bank_holder: "CONG TY ABC",
};

function InvoicePreview({ settings }: { settings: PrintTemplateSettings }) {
  const total = SAMPLE_ORDER.items.reduce((sum, item) => {
    const discounted = item.price * (1 - item.discount / 100);
    return sum + discounted * item.qty;
  }, 0);

  return (
    <div
      className="border rounded-lg shadow-sm bg-white overflow-auto"
      style={{
        fontSize: settings.font_size,
        maxHeight: "600px",
        minWidth: settings.paper_size === "80mm" ? "240px" : "360px",
        maxWidth: settings.paper_size === "80mm" ? "300px" : "500px",
        margin: "0 auto",
        padding: "16px",
        color: "#111",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      {settings.show_logo && settings.logo_url && (
        <div className="text-center mb-2">
          <img src={settings.logo_url} alt="Logo" className="h-12 mx-auto object-contain" />
        </div>
      )}
      {settings.show_logo && !settings.logo_url && (
        <div className="text-center mb-2">
          <div className="inline-block bg-gray-100 rounded px-4 py-2 text-gray-500 text-xs">[Logo cửa hàng]</div>
        </div>
      )}

      <div className="text-center font-bold text-base border-b pb-2 mb-3">{settings.header_text}</div>

      {/* Order Info */}
      <div className="grid grid-cols-2 gap-1 mb-3 text-xs">
        <div><span className="text-gray-500">Số HĐ:</span> {SAMPLE_ORDER.id}</div>
        <div><span className="text-gray-500">Ngày:</span> {SAMPLE_ORDER.date}</div>
        <div><span className="text-gray-500">Khách hàng:</span> {SAMPLE_ORDER.customer}</div>
        <div><span className="text-gray-500">SĐT:</span> {SAMPLE_ORDER.phone}</div>
      </div>

      {/* Items Table */}
      <table className="w-full text-xs border-collapse mb-3">
        <thead>
          <tr className="border-b border-t">
            <th className="text-left py-1">Sản phẩm</th>
            {settings.show_sku && <th className="text-left py-1">SKU</th>}
            <th className="text-right py-1">SL</th>
            <th className="text-right py-1">Đơn giá</th>
            {settings.show_discount_column && <th className="text-right py-1">CK%</th>}
            <th className="text-right py-1">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_ORDER.items.map((item, i) => {
            const lineTotal = item.price * (1 - item.discount / 100) * item.qty;
            return (
              <tr key={i} className="border-b border-dashed">
                <td className="py-1">
                  <div>{item.name}</div>
                  {settings.show_variant && (
                    <div className="text-gray-400 text-xs">{item.variant}</div>
                  )}
                </td>
                {settings.show_sku && <td className="py-1 text-gray-400">{item.sku}</td>}
                <td className="py-1 text-right">{item.qty}</td>
                <td className="py-1 text-right">{item.price.toLocaleString("vi-VN")}</td>
                {settings.show_discount_column && (
                  <td className="py-1 text-right">{item.discount > 0 ? `${item.discount}%` : "—"}</td>
                )}
                <td className="py-1 text-right font-medium">{lineTotal.toLocaleString("vi-VN")}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={settings.show_sku && settings.show_discount_column ? 5 : settings.show_sku || settings.show_discount_column ? 4 : 3} className="text-right py-1 font-bold pt-2">
              Tổng cộng:
            </td>
            <td className="text-right py-1 font-bold pt-2 text-primary">
              {total.toLocaleString("vi-VN")}đ
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Bank Info */}
      {settings.show_bank_info && (
        <div className="border rounded p-2 mb-2 text-xs bg-gray-50">
          <div className="font-semibold mb-1">Thông tin chuyển khoản:</div>
          <div>{SAMPLE_ORDER.bank_name} — {SAMPLE_ORDER.bank_account}</div>
          <div>{SAMPLE_ORDER.bank_holder}</div>
          {settings.show_qr_code && (
            <div className="mt-2 flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                QR Code
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {settings.footer_text && (
        <div className="text-center text-xs text-gray-500 pt-2 border-t italic">
          {settings.footer_text}
        </div>
      )}
    </div>
  );
}

export function PrintTemplateSettingsTab() {
  const [settings, setSettings] = useState<PrintTemplateSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast({ title: "Đã lưu cài đặt mẫu in thành công." });
    } catch {
      toast({ title: "Lỗi khi lưu cài đặt.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    toast({ title: "Đã đặt lại về mặc định." });
  };

  const toggle = (field: keyof PrintTemplateSettings) =>
    setSettings((s) => ({ ...s, [field]: !s[field] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            Cài đặt mẫu in hóa đơn
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tùy chỉnh bố cục và nội dung in hóa đơn bán hàng
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" /> Đặt lại
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" /> Lưu cài đặt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Settings form */}
        <div className="space-y-4">
          {/* Tổng quát */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Nội dung cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Tiêu đề hóa đơn</Label>
                <Input
                  value={settings.header_text}
                  onChange={(e) => setSettings((s) => ({ ...s, header_text: e.target.value }))}
                  placeholder="HÓA ĐƠN BÁN HÀNG"
                />
              </div>
              <div className="space-y-1">
                <Label>Lời cảm ơn (footer)</Label>
                <Input
                  value={settings.footer_text}
                  onChange={(e) => setSettings((s) => ({ ...s, footer_text: e.target.value }))}
                  placeholder="Cảm ơn quý khách đã mua hàng!"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Khổ giấy</Label>
                  <Select
                    value={settings.paper_size}
                    onValueChange={(v) =>
                      setSettings((s) => ({ ...s, paper_size: v as PrintTemplateSettings["paper_size"] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="80mm">Khổ 80mm (nhiệt)</SelectItem>
                      <SelectItem value="A5">A5</SelectItem>
                      <SelectItem value="A4">A4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Cỡ chữ</Label>
                  <Select
                    value={settings.font_size}
                    onValueChange={(v) =>
                      setSettings((s) => ({ ...s, font_size: v as PrintTemplateSettings["font_size"] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12px">12px (nhỏ)</SelectItem>
                      <SelectItem value="13px">13px (mặc định)</SelectItem>
                      <SelectItem value="14px">14px (lớn)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Logo cửa hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show_logo">Hiện logo trên hóa đơn</Label>
                <Switch
                  id="show_logo"
                  checked={settings.show_logo}
                  onCheckedChange={() => toggle("show_logo")}
                />
              </div>
              {settings.show_logo && (
                <div className="space-y-1">
                  <Label>URL logo (để trống dùng placeholder)</Label>
                  <Input
                    value={settings.logo_url}
                    onChange={(e) => setSettings((s) => ({ ...s, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cột sản phẩm */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Các cột hiển thị trong bảng sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { field: "show_sku" as const, label: "Hiện cột Mã SKU" },
                { field: "show_variant" as const, label: "Hiện tên biến thể (màu/size…)" },
                { field: "show_discount_column" as const, label: "Hiện cột chiết khấu %" },
              ].map(({ field, label }) => (
                <div key={field} className="flex items-center justify-between">
                  <Label htmlFor={field}>{label}</Label>
                  <Switch
                    id={field}
                    checked={settings[field] as boolean}
                    onCheckedChange={() => toggle(field)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Thanh toán */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Thông tin thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show_bank_info">Hiện thông tin chuyển khoản</Label>
                <Switch
                  id="show_bank_info"
                  checked={settings.show_bank_info}
                  onCheckedChange={() => toggle("show_bank_info")}
                />
              </div>
              {settings.show_bank_info && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="show_qr_code">Hiện mã QR thanh toán</Label>
                  <Switch
                    id="show_qr_code"
                    checked={settings.show_qr_code}
                    onCheckedChange={() => toggle("show_qr_code")}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Eye className="h-4 w-4" />
            Xem trước hóa đơn
            <Badge variant="secondary" className="text-xs">Dữ liệu mẫu</Badge>
          </div>
          <InvoicePreview settings={settings} />
        </div>
      </div>
    </div>
  );
}
