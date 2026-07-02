import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Save, Plus, Edit2, Trash2, Settings, ShieldAlert, Award } from "lucide-react";

export function LoyaltySettingsTab() {
  const { toast } = useToast();

  // Left panel state
  const [isLoyaltyEnabled, setIsLoyaltyEnabled] = useState(true);
  const [pointRatioMoney, setPointRatioMoney] = useState("10.000");
  const [pointRatioPoints, setPointRatioPoints] = useState("1");
  const [redeemRatioPoints, setRedeemRatioPoints] = useState("1");
  const [redeemRatioMoney, setRedeemRatioMoney] = useState("1.000");
  const [excludedTiers, setExcludedTiers] = useState<string[]>(["Super", "VÀNG"]);
  
  const [noPointOnline, setNoPointOnline] = useState(false);
  const [noPointWholesale, setNoPointWholesale] = useState(false);
  const [noPointDiscounted, setNoPointDiscounted] = useState(true);
  const [pointByTier, setPointByTier] = useState(true);

  const [syncOption, setSyncOption] = useState("all");
  const [isSyncing, setIsSyncing] = useState(false);

  // Right panel state (Tiers)
  const [tiers, setTiers] = useState([
    { id: "1", name: "Super", type: "%", value: "25", minOrders: "0", minPoints: "0", minMoney: "20.000.000", ratio: "300,00", isActive: true, color: "bg-purple-600" },
    { id: "2", name: "VÀNG", type: "%", value: "2", minOrders: "10", minPoints: "30", minMoney: "8.000.000", ratio: "5.000,00", isActive: true, color: "bg-amber-500" },
    { id: "3", name: "SILVER", type: "Giá trị", value: "0", minOrders: "0", minPoints: "0", minMoney: "8.000.000", ratio: "0", isActive: true, color: "bg-blue-400" },
    { id: "4", name: "Thân thiết", type: "Giá trị", value: "50.000", minOrders: "0", minPoints: "0", minMoney: "5.000.000", ratio: "100,00", isActive: true, color: "bg-green-500" },
    { id: "5", name: "Giảm 15%", type: "%", value: "15", minOrders: "0", minPoints: "0", minMoney: "1.000.000", ratio: "0", isActive: true, color: "bg-emerald-500" },
    { id: "6", name: "Khách VIP", type: "Giá trị", value: "0", minOrders: "0", minPoints: "0", minMoney: "1.000.000", ratio: "0", isActive: true, color: "bg-pink-500" },
    { id: "7", name: "MEMBER", type: "Giá trị", value: "0", minOrders: "1", minPoints: "0", minMoney: "0", ratio: "10,00", isActive: true, color: "bg-green-600" },
    { id: "8", name: "Cấp 2", type: "Giá trị", value: "1.200.000", minOrders: "0", minPoints: "0", minMoney: "0", ratio: "5,00", isActive: true, color: "bg-blue-500" },
    { id: "9", name: "Thường", type: "%", value: "5", minOrders: "2", minPoints: "0", minMoney: "0", ratio: "0", isActive: true, color: "bg-green-400" },
  ]);

  const [cardExclusions, setCardExclusions] = useState("3");
  const [noApplyDiscountedItems, setNoApplyDiscountedItems] = useState(false);

  const handleSaveSettings = () => {
    toast({
      title: "Đã lưu cấu hình",
      description: "Cấu hình tích điểm và hạng thành viên đã được cập nhật thành công.",
    });
  };

  const handleSyncPoints = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: "Đồng bộ thành công",
        description: "Đã đồng bộ lại điểm thưởng của khách hàng theo cấu hình mới.",
      });
    }, 1500);
  };

  const toggleTier = (id: string) => {
    setTiers(tiers.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left Panel: Cấu hình tích điểm */}
      <Card className="xl:col-span-5 border border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b mb-4">
          <div>
            <CardTitle className="text-sm font-semibold">Cài đặt tích điểm</CardTitle>
            <CardDescription className="text-xs">Thiết lập công thức quy đổi điểm star</CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5 cursor-pointer">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 bg-popover z-50 space-y-4" align="end">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Đồng bộ lại tích điểm</h4>
                  <p className="text-xs text-muted-foreground">Chọn phương thức tính toán lại điểm cho toàn bộ hệ thống:</p>
                </div>
                <RadioGroup value={syncOption} onValueChange={setSyncOption} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="all" id="r-all" className="mt-1" />
                    <Label htmlFor="r-all" className="text-xs leading-normal cursor-pointer font-normal">
                      Đồng bộ lại tích điểm theo cấu hình hiện tại (Tất cả khách hàng)
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="skip_used" id="r-skip" className="mt-1" />
                    <Label htmlFor="r-skip" className="text-xs leading-normal cursor-pointer font-normal">
                      Đồng bộ lại tích điểm theo cấu hình hiện tại (Bỏ qua khách hàng đã sử dụng điểm)
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="history" id="r-history" className="mt-1" />
                    <Label htmlFor="r-history" className="text-xs leading-normal cursor-pointer font-normal">
                      Đồng bộ điểm thưởng khách nhận được qua các lần cấu hình tích điểm và trừ đi số điểm khách đã dùng
                    </Label>
                  </div>
                </RadioGroup>
                <Button 
                  onClick={handleSyncPoints} 
                  disabled={isSyncing} 
                  className="w-full h-8 text-xs bg-destructive hover:bg-destructive/90 cursor-pointer"
                >
                  {isSyncing ? "Đang đồng bộ..." : "Đồng bộ"}
                </Button>
              </PopoverContent>
            </Popover>

            <Button onClick={handleSaveSettings} size="sm" className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 cursor-pointer">
              <Save className="h-3.5 w-3.5" />
              Lưu
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="loyalty-toggle" className="text-xs font-semibold cursor-pointer">Kích hoạt tích điểm</Label>
            <Switch id="loyalty-toggle" checked={isLoyaltyEnabled} onCheckedChange={setIsLoyaltyEnabled} />
          </div>

          <div className="space-y-2.5">
            <Label className="text-xs font-medium text-muted-foreground">Tỉ lệ điểm nhận được trên giá trị đơn hàng:</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={pointRatioMoney} 
                onChange={(e) => setPointRatioMoney(e.target.value)} 
                className="h-9 text-xs w-28 text-center" 
              />
              <span className="text-xs text-muted-foreground">đ</span>
              <span className="text-xs">→</span>
              <Input 
                value={pointRatioPoints} 
                onChange={(e) => setPointRatioPoints(e.target.value)} 
                className="h-9 text-xs w-20 text-center" 
              />
              <span className="text-xs text-amber-500 font-semibold">★ star</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <Label className="text-xs font-medium text-muted-foreground">Tỉ lệ đổi khi thanh toán bằng điểm:</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={redeemRatioPoints} 
                onChange={(e) => setRedeemRatioPoints(e.target.value)} 
                className="h-9 text-xs w-20 text-center" 
              />
              <span className="text-xs text-amber-500 font-semibold">★ star</span>
              <span className="text-xs">→</span>
              <Input 
                value={redeemRatioMoney} 
                onChange={(e) => setRedeemRatioMoney(e.target.value)} 
                className="h-9 text-xs w-28 text-center" 
              />
              <span className="text-xs text-muted-foreground">đ</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Cấp độ không được sử dụng điểm và tích điểm:</Label>
            <div className="border rounded-lg p-2 flex flex-wrap gap-1.5 bg-muted/10 min-h-[44px]">
              {excludedTiers.map(t => (
                <Badge key={t} variant="secondary" className="text-[10px] gap-1 px-2 py-0.5">
                  {t}
                  <span 
                    onClick={() => setExcludedTiers(excludedTiers.filter(x => x !== t))}
                    className="cursor-pointer font-bold text-muted-foreground hover:text-foreground text-[8px]"
                  >
                    ×
                  </span>
                </Badge>
              ))}
              {excludedTiers.length === 0 && <span className="text-xs text-muted-foreground">Áp dụng cho tất cả cấp độ</span>}
            </div>
          </div>

          <div className="space-y-3.5 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="no-online" className="text-xs cursor-pointer text-muted-foreground">Không tích điểm với đơn online</Label>
              <Switch id="no-online" checked={noPointOnline} onCheckedChange={setNoPointOnline} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="no-wholesale" className="text-xs cursor-pointer text-muted-foreground">Không tích điểm với đơn sỉ</Label>
              <Switch id="no-wholesale" checked={noPointWholesale} onCheckedChange={setNoPointWholesale} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="no-discount" className="text-xs cursor-pointer text-muted-foreground">Tích 0% số điểm với những SP giảm giá</Label>
              <Switch id="no-discount" checked={noPointDiscounted} onCheckedChange={setNoPointDiscounted} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="point-by-tier" className="text-xs cursor-pointer text-muted-foreground">Tích điểm theo cấp độ khách hàng</Label>
              <Switch id="point-by-tier" checked={pointByTier} onCheckedChange={setPointByTier} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Panel: Các cấp khách hàng */}
      <Card className="xl:col-span-7 border border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b mb-4">
          <div>
            <CardTitle className="text-sm font-semibold">Các cấp khách hàng (Hạng thẻ)</CardTitle>
            <CardDescription className="text-xs">Quản lý nâng hạng tự động và đặc quyền giảm giá</CardDescription>
          </div>
          <Button size="sm" className="h-8 gap-1.5 bg-primary hover:bg-primary/90 cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            Thêm mới
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div className="overflow-x-auto px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Kích hoạt</TableHead>
                  <TableHead className="text-xs">Tên cấp độ</TableHead>
                  <TableHead className="text-xs">Kiểu</TableHead>
                  <TableHead className="text-xs">Giá trị giảm giá</TableHead>
                  <TableHead className="text-xs text-center">Đơn hàng tối thiểu</TableHead>
                  <TableHead className="text-xs text-center">Điểm tối thiểu</TableHead>
                  <TableHead className="text-xs">Số tiền tối thiểu</TableHead>
                  <TableHead className="text-xs text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((tier) => (
                  <TableRow key={tier.id} className="hover:bg-muted/30">
                    <TableCell className="py-2.5">
                      <Switch checked={tier.isActive} onCheckedChange={() => toggleTier(tier.id)} className="scale-75 origin-left" />
                    </TableCell>
                    <TableCell className="py-2.5 font-medium">
                      <div className="flex flex-col gap-1">
                        <Badge className={`${tier.color} text-white font-semibold text-[10px] w-fit px-1.5 py-0.5 rounded`}>
                          {tier.name}
                        </Badge>
                        {Number(tier.ratio.replace(/,/g, '')) > 0 && (
                          <span className="text-[9px] text-muted-foreground">
                            Tỉ lệ nhận: {tier.ratio} ★ / 10k
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground">{tier.type}</TableCell>
                    <TableCell className="py-2.5 text-xs font-semibold">
                      {tier.value}{tier.type === "%" ? "%" : "đ"}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-center">{tier.minOrders}</TableCell>
                    <TableCell className="py-2.5 text-xs text-center">{tier.minPoints}</TableCell>
                    <TableCell className="py-2.5 text-xs font-medium">{tier.minMoney}đ</TableCell>
                    <TableCell className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/5 cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t space-y-4 bg-muted/5 rounded-b-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Cấu hình thẻ khách hàng không áp dụng cấp độ:</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={cardExclusions} 
                    onChange={(e) => setCardExclusions(e.target.value)} 
                    className="h-9 text-xs w-28 text-center" 
                  />
                  <span className="text-xs text-muted-foreground">Thẻ</span>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end sm:gap-4 h-full pt-6">
                <Label htmlFor="no-apply-discount" className="text-xs cursor-pointer text-muted-foreground">Không áp dụng cho các SP đã giảm giá</Label>
                <Switch id="no-apply-discount" checked={noApplyDiscountedItems} onCheckedChange={setNoApplyDiscountedItems} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
