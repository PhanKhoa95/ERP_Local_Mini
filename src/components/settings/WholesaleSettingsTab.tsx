import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Percent, Loader2, Save, AlertCircle, HelpCircle } from "lucide-react";
import { useWholesaleSettings, WholesaleSettings } from "@/hooks/useWholesaleSettings";

export function WholesaleSettingsTab() {
  const { settings, isLoadingSettings, updateSettings } = useWholesaleSettings();
  const [localSettings, setLocalSettings] = useState<WholesaleSettings | null>(null);
  const [orderTagsInput, setOrderTagsInput] = useState("");
  const [customerTagsInput, setCustomerTagsInput] = useState("");

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
      setOrderTagsInput((settings.apply_by_order_tags || []).join(", "));
      setCustomerTagsInput((settings.apply_by_customer_tags || []).join(", "));
    }
  }, [settings]);

  if (isLoadingSettings || !localSettings) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleToggle = (field: keyof WholesaleSettings) => {
    setLocalSettings({
      ...localSettings,
      [field]: !localSettings[field]
    } as WholesaleSettings);
  };

  const handleNumberChange = (field: keyof WholesaleSettings, value: number) => {
    setLocalSettings({
      ...localSettings,
      [field]: value
    } as WholesaleSettings);
  };

  const handleSave = async () => {
    // Process tags
    const order_tags = orderTagsInput
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);
      
    const customer_tags = customerTagsInput
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload = {
      ...localSettings,
      apply_by_order_tags: order_tags,
      apply_by_customer_tags: customer_tags
    };

    await updateSettings.mutateAsync(payload);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Percent className="h-5 w-5 text-blue-600" />
          Cấu hình nghiệp vụ Giá bán sỉ (Pancake POS)
        </h3>
        <p className="text-sm text-muted-foreground">
          Thiết lập các điều kiện và luật tự động áp dụng giá bán sỉ cho đơn hàng/POS của cửa hàng.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left column: Conditions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">1. Điều kiện áp giá sỉ theo số lượng</CardTitle>
              <CardDescription className="text-xs">
                Tự động kích hoạt giá sỉ khi số lượng hàng đạt các ngưỡng quy định.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Option 1: Apply by order qty */}
              <div className="flex items-start justify-between space-x-2 pb-4 border-b">
                <div className="space-y-1">
                  <Label htmlFor="apply_by_order_qty" className="text-xs font-semibold flex items-center gap-1 cursor-pointer">
                    Áp dụng theo tổng số lượng đơn hàng
                    <HelpCircle className="h-3 w-3 text-muted-foreground" title="Áp giá sỉ khi tổng số lượng của tất cả sản phẩm trong đơn >= ngưỡng" />
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Kích hoạt khi tổng tất cả các items trong giỏ đạt ngưỡng.
                  </p>
                  {localSettings.apply_by_order_qty_enabled && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-muted-foreground">Ngưỡng sỉ:</span>
                      <Input
                        type="number"
                        min="1"
                        value={localSettings.apply_by_order_qty_threshold}
                        onChange={(e) => handleNumberChange("apply_by_order_qty_threshold", parseInt(e.target.value) || 1)}
                        className="h-8 text-xs w-20 text-center"
                      />
                      <span className="text-[10px] text-muted-foreground">sản phẩm.</span>
                    </div>
                  )}
                </div>
                <Switch
                  id="apply_by_order_qty"
                  checked={localSettings.apply_by_order_qty_enabled}
                  onCheckedChange={() => handleToggle("apply_by_order_qty_enabled")}
                />
              </div>

              {/* Option 2: Apply by product variant sum */}
              <div className="flex items-start justify-between space-x-2 pb-4 border-b">
                <div className="space-y-1">
                  <Label htmlFor="apply_by_product_qty" className="text-xs font-semibold flex items-center gap-1 cursor-pointer">
                    Áp dụng khi mua nhiều mẫu mã của cùng sản phẩm
                    <HelpCircle className="h-3 w-3 text-muted-foreground" title="Áp giá sỉ khi tổng số lượng của các mẫu mã thuộc cùng 1 sản phẩm >= ngưỡng" />
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Ví dụ: Mua 3 áo thun đỏ + 2 áo thun xanh (cùng sản phẩm Áo thun) = 5 cái (đạt sỉ).
                  </p>
                  {localSettings.apply_by_product_qty_enabled && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-muted-foreground">Ngưỡng sỉ:</span>
                      <Input
                        type="number"
                        min="1"
                        value={localSettings.apply_by_product_qty_threshold}
                        onChange={(e) => handleNumberChange("apply_by_product_qty_threshold", parseInt(e.target.value) || 1)}
                        className="h-8 text-xs w-20 text-center"
                      />
                      <span className="text-[10px] text-muted-foreground">sản phẩm.</span>
                    </div>
                  )}
                </div>
                <Switch
                  id="apply_by_product_qty"
                  checked={localSettings.apply_by_product_qty_enabled}
                  onCheckedChange={() => handleToggle("apply_by_product_qty_enabled")}
                />
              </div>

              {/* Option 3: Apply by variant quantity */}
              <div className="flex items-start justify-between space-x-2">
                <div className="space-y-1">
                  <Label htmlFor="apply_by_variant_qty" className="text-xs font-semibold flex items-center gap-1 cursor-pointer">
                    Áp dụng theo từng mẫu mã cụ thể (Mặc định)
                    <HelpCircle className="h-3 w-3 text-muted-foreground" title="Áp dụng giá sỉ tương ứng với số lượng của riêng mẫu mã (variant) đó trong đơn" />
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    {"Ví dụ: Mua >= 5 áo thun đỏ thì áo thun đỏ được giá sỉ. Các mẫu mã khác dưới 5 cái không sỉ."}
                  </p>
                </div>
                <Switch
                  id="apply_by_variant_qty"
                  checked={localSettings.apply_by_variant_qty_enabled}
                  onCheckedChange={() => handleToggle("apply_by_variant_qty_enabled")}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Tags & Exclusions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">2. Điều kiện áp giá sỉ theo Thẻ (Tags)</CardTitle>
              <CardDescription className="text-xs">
                Kích hoạt giá sỉ ngay lập tức khi đơn hàng hoặc khách hàng có thẻ phù hợp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Option 4: Apply by order tags */}
              <div className="flex flex-col space-y-2 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <Label htmlFor="apply_by_order_tags_enabled" className="text-xs font-semibold flex items-center gap-1 cursor-pointer">
                    Áp dụng theo thẻ đơn hàng
                  </Label>
                  <Switch
                    id="apply_by_order_tags_enabled"
                    checked={localSettings.apply_by_order_tags_enabled}
                    onCheckedChange={() => handleToggle("apply_by_order_tags_enabled")}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Đơn hàng gắn các thẻ này sẽ tự động được áp giá sỉ (phân tách bằng dấu phẩy).
                </p>
                {localSettings.apply_by_order_tags_enabled && (
                  <Input
                    placeholder="VD: sỉ, đơn buôn, giá sỉ"
                    value={orderTagsInput}
                    onChange={(e) => setOrderTagsInput(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                )}
              </div>

              {/* Option 5: Apply by customer tags */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="apply_by_customer_tags_enabled" className="text-xs font-semibold flex items-center gap-1 cursor-pointer">
                    Áp dụng theo thẻ khách hàng
                  </Label>
                  <Switch
                    id="apply_by_customer_tags_enabled"
                    checked={localSettings.apply_by_customer_tags_enabled}
                    onCheckedChange={() => handleToggle("apply_by_customer_tags_enabled")}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Khách hàng có các thẻ này sẽ luôn được mua giá sỉ (phân tách bằng dấu phẩy).
                </p>
                {localSettings.apply_by_customer_tags_enabled && (
                  <Input
                    placeholder="VD: vip sỉ, đại lý, đối tác sỉ"
                    value={customerTagsInput}
                    onChange={(e) => setCustomerTagsInput(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">3. Tùy chọn Loại trừ Khuyến mãi</CardTitle>
              <CardDescription className="text-xs">
                Chống chồng chéo giảm giá khi đã áp dụng giá sỉ.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between space-x-2">
                <div className="space-y-1">
                  <Label htmlFor="no_other_discounts" className="text-xs font-semibold flex items-center gap-1 cursor-pointer text-amber-700">
                    Không cho phép chồng khuyến mãi khác
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Khi đơn hàng được áp giá bán sỉ, hệ thống sẽ tự động vô hiệu hóa các mã giảm giá (voucher) và chiết khấu khác của đơn hàng để bảo vệ lợi nhuận.
                  </p>
                </div>
                <Switch
                  id="no_other_discounts"
                  checked={localSettings.no_other_discounts}
                  onCheckedChange={() => handleToggle("no_other_discounts")}
                  className="data-[state=checked]:bg-amber-600"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button onClick={handleSave} disabled={updateSettings.isPending} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5">
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Lưu cài đặt
        </Button>
      </div>
    </div>
  );
}
