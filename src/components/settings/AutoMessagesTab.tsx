import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Mail, Plus, Edit2, Trash2, Save, Link2, Key, History, HelpCircle } from "lucide-react";

interface AutoMessageTemplate {
  id: string;
  name: string;
  triggerStatus: string;
  source: string;
  carrier: string;
  content: string;
  imageUrl?: string;
  isActive: boolean;
}

export function AutoMessagesTab() {
  const { toast } = useToast();

  // Tab 1: Pancake settings
  const [autoSendInvoice, setAutoSendInvoice] = useState(true);
  const [invoiceTriggerStatus, setInvoiceTriggerStatus] = useState("Đang đóng hàng");
  const [sendProductPrice, setSendProductPrice] = useState(true);
  const [sendDiscountedPrice, setSendDiscountedPrice] = useState(true);
  const [sendProductImage, setSendProductImage] = useState(true);
  const [useSkuCode, setUseSkuCode] = useState(false);
  const [sendNetTotal, setSendNetTotal] = useState(true);
  const [businessHoursOnly, setBusinessHoursOnly] = useState(false);
  const [hideTrackingLocation, setHideTrackingLocation] = useState(false);
  const [hideAttributes, setHideAttributes] = useState(false);

  const [templates, setTemplates] = useState<AutoMessageTemplate[]>([
    {
      id: "tpl-1",
      name: "Thông báo tạo đơn thành công",
      triggerStatus: "Xác nhận đơn hàng",
      source: "Tất cả",
      carrier: "Tất cả",
      content: "Chào {customer_name}, đơn hàng {order_number} của bạn đã được xác nhận. Tổng tiền: {total_amount}đ. Cảm ơn bạn đã mua sắm!",
      isActive: true
    },
    {
      id: "tpl-2",
      name: "Thông báo đang giao hàng",
      triggerStatus: "Gửi hàng đi",
      source: "Shopee",
      carrier: "Giao Hàng Tiết Kiệm",
      content: "Đơn hàng {order_number} đang được vận chuyển qua GHTK. Mã vận đơn của bạn: {tracking_number}. Theo dõi hành trình đơn tại link sau: {tracking_url}",
      isActive: true
    }
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AutoMessageTemplate | null>(null);

  // Template form states
  const [formName, setFormName] = useState("");
  const [formTrigger, setFormTrigger] = useState("Mới");
  const [formSource, setFormSource] = useState("Tất cả");
  const [formCarrier, setFormCarrier] = useState("Tất cả");
  const [formContent, setFormContent] = useState("");

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormName("");
    setFormTrigger("Mới");
    setFormSource("Tất cả");
    setFormCarrier("Tất cả");
    setFormContent("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (tpl: AutoMessageTemplate) => {
    setEditingTemplate(tpl);
    setFormName(tpl.name);
    setFormTrigger(tpl.triggerStatus);
    setFormSource(tpl.source);
    setFormCarrier(tpl.carrier);
    setFormContent(tpl.content);
    setDialogOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast({ title: "Đã xoá kịch bản", description: "Kịch bản tin nhắn tự động đã được gỡ bỏ." });
  };

  const handleSaveTemplate = () => {
    if (!formName.trim() || !formContent.trim()) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng điền đầy đủ Tên và Nội dung tin nhắn" });
      return;
    }

    if (editingTemplate) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...t, name: formName, triggerStatus: formTrigger, source: formSource, carrier: formCarrier, content: formContent } : t));
      toast({ title: "Cập nhật thành công", description: "Đã lưu kịch bản thông báo." });
    } else {
      const newTpl: AutoMessageTemplate = {
        id: "tpl-" + Date.now(),
        name: formName,
        triggerStatus: formTrigger,
        source: formSource,
        carrier: formCarrier,
        content: formContent,
        isActive: true
      };
      setTemplates([...templates, newTpl]);
      toast({ title: "Tạo thành công", description: "Kịch bản tin nhắn tự động mới đã được thêm." });
    }
    setDialogOpen(false);
  };

  // Tab 2: SMS gateway settings
  const [smsConnected, setSmsConnected] = useState(false);
  const [smsProvider, setSmsProvider] = useState("esms");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [brandname, setBrandname] = useState("");

  const handleConnectSms = () => {
    if (!apiKey.trim() || !secretKey.trim()) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng nhập API Key và Secret Key của đối tác." });
      return;
    }
    setSmsConnected(true);
    toast({ title: "Kết nối thành công", description: "Đã liên kết cổng SMS/Zalo ZNS thành công với hệ thống." });
  };

  return (
    <>
      <Tabs defaultValue="pancake" className="w-full space-y-6">
      <TabsList className="grid grid-cols-2 max-w-md">
        <TabsTrigger value="pancake" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Pancake Messenger
        </TabsTrigger>
        <TabsTrigger value="sms" className="gap-2">
          <Mail className="h-4 w-4" />
          SMS / Zalo ZNS Gateway
        </TabsTrigger>
      </TabsList>

      {/* Tab Pancake */}
      <TabsContent value="pancake" className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Cấu hình hiển thị tin nhắn (Trái) */}
        <Card className="xl:col-span-5 border border-border">
          <CardHeader className="border-b pb-3 mb-4">
            <CardTitle className="text-sm font-semibold">Cấu hình hiển thị hoá đơn</CardTitle>
            <CardDescription className="text-xs">Thiết lập cách thông tin đơn hàng/hoá đơn hiển thị khi gửi tự động qua Messenger cho khách hàng.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="send-inv" className="text-xs font-semibold cursor-pointer">Tự động gửi hoá đơn khi đổi trạng thái</Label>
              <Switch id="send-inv" checked={autoSendInvoice} onCheckedChange={setAutoSendInvoice} />
            </div>

            {autoSendInvoice && (
              <div className="space-y-1.5 pl-4 border-l-2 border-primary/30">
                <Label className="text-xs text-muted-foreground">Trạng thái kích hoạt gửi hoá đơn:</Label>
                <Select value={invoiceTriggerStatus} onValueChange={setInvoiceTriggerStatus}>
                  <SelectTrigger className="h-8 text-xs max-w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectTrigger className="hidden" />
                  <SelectContent className="bg-popover text-foreground z-50">
                    <SelectItem value="Mới" className="text-xs">Mới</SelectItem>
                    <SelectItem value="Xác nhận đơn hàng" className="text-xs">Xác nhận đơn hàng</SelectItem>
                    <SelectItem value="Đang đóng hàng" className="text-xs">Đang đóng hàng</SelectItem>
                    <SelectItem value="Gửi hàng đi" className="text-xs">Gửi hàng đi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="send-p" className="text-xs cursor-pointer text-muted-foreground">Gửi kèm giá sản phẩm</Label>
                <Switch id="send-p" checked={sendProductPrice} onCheckedChange={setSendProductPrice} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="send-d" className="text-xs cursor-pointer text-muted-foreground">Gửi giá sau khi trừ khuyến mãi</Label>
                <Switch id="send-d" checked={sendDiscountedPrice} onCheckedChange={setSendDiscountedPrice} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="send-img" className="text-xs cursor-pointer text-muted-foreground">Gửi hình ảnh sản phẩm</Label>
                <Switch id="send-img" checked={sendProductImage} onCheckedChange={setSendProductImage} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="use-sku" className="text-xs cursor-pointer text-muted-foreground">Gửi mã mẫu thay vì tên sản phẩm</Label>
                <Switch id="use-sku" checked={useSkuCode} onCheckedChange={setUseSkuCode} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="send-net" className="text-xs cursor-pointer text-muted-foreground">Gửi tổng tiền sau trả trước</Label>
                <Switch id="send-net" checked={sendNetTotal} onCheckedChange={setSendNetTotal} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="b-hours" className="text-xs cursor-pointer text-muted-foreground">Chỉ gửi trong giờ hành chính</Label>
                <Switch id="b-hours" checked={businessHoursOnly} onCheckedChange={setBusinessHoursOnly} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="hide-loc" className="text-xs cursor-pointer text-muted-foreground">Ẩn vị trí đơn khi theo dõi đơn hàng</Label>
                <Switch id="hide-loc" checked={hideTrackingLocation} onCheckedChange={setHideTrackingLocation} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="hide-attr" className="text-xs cursor-pointer text-muted-foreground">Ẩn thuộc tính sản phẩm</Label>
                <Switch id="hide-attr" checked={hideAttributes} onCheckedChange={setHideAttributes} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danh sách kịch bản tự động (Phải) */}
        <Card className="xl:col-span-7 border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b mb-4">
            <div>
              <CardTitle className="text-sm font-semibold">Kịch bản thông báo tự động</CardTitle>
              <CardDescription className="text-xs">Thiết lập các tin nhắn gửi đến khách hàng khi đơn hàng thay đổi trạng thái chi tiết.</CardDescription>
            </div>
            <Button onClick={handleOpenCreate} size="sm" className="h-8 gap-1.5 cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              Thêm mới
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Kích hoạt</TableHead>
                    <TableHead className="text-xs">Tên kịch bản</TableHead>
                    <TableHead className="text-xs">Trạng thái gửi</TableHead>
                    <TableHead className="text-xs">Nguồn / ĐVVC</TableHead>
                    <TableHead className="text-xs text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((tpl) => (
                    <TableRow key={tpl.id} className="hover:bg-muted/30">
                      <TableCell className="py-2.5">
                        <Switch
                          checked={tpl.isActive}
                          onCheckedChange={(checked) => setTemplates(templates.map(x => x.id === tpl.id ? { ...x, isActive: checked } : x))}
                          className="scale-75 origin-left"
                        />
                      </TableCell>
                      <TableCell className="py-2.5 font-medium text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span>{tpl.name}</span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">{tpl.content}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="secondary" className="text-[9px] font-semibold">
                          {tpl.triggerStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-muted-foreground">
                        {tpl.source} / {tpl.carrier}
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => handleOpenEdit(tpl)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/5 cursor-pointer" onClick={() => handleDeleteTemplate(tpl.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab SMS / Zalo Gateway */}
      <TabsContent value="sms">
        <Card className="border border-border">
          <CardHeader className="border-b pb-3 mb-4">
            <CardTitle className="text-sm font-semibold">Liên kết cổng đối tác gửi tin</CardTitle>
            <CardDescription className="text-xs">Hỗ trợ gửi tin nhắn SMS CSKH, thông báo đơn hàng qua Brandname SMS hoặc Zalo ZNS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Đối tác liên kết</Label>
                <Select value={smsProvider} onValueChange={setSmsProvider}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectTrigger className="hidden" />
                  <SelectContent className="bg-popover text-foreground z-50">
                    <SelectItem value="esms" className="text-xs">Cổng eSMS.vn (SMS/ZNS)</SelectItem>
                    <SelectItem value="zalocloud" className="text-xs">Zalo Cloud API (ZNS)</SelectItem>
                    <SelectItem value="vietguys" className="text-xs">VietGuys SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-name" className="text-xs">Brandname hiển thị (SMS)</Label>
                <Input
                  id="b-name"
                  value={brandname}
                  onChange={(e) => setBrandname(e.target.value)}
                  placeholder="VD: PANCAKESTORE"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="api-k" className="text-xs">API Key / App ID *</Label>
                <Input
                  id="api-k"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="eSMS API Key..."
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sec-k" className="text-xs">Secret Key *</Label>
                <Input
                  id="sec-k"
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="eSMS Secret Key..."
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2">
                <Badge variant={smsConnected ? "default" : "secondary"} className={smsConnected ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}>
                  {smsConnected ? "Đã kết nối" : "Chưa kết nối"}
                </Badge>
                {smsConnected && <span className="text-xs text-muted-foreground">Tài khoản eSMS của bạn đang hoạt động bình thường.</span>}
              </div>
              <Button onClick={handleConnectSms} size="sm" className="h-8 gap-1.5 cursor-pointer">
                <Link2 className="h-3.5 w-3.5" />
                {smsConnected ? "Cập nhật kết nối" : "Kết nối ngay"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

      {/* Dialog create/edit template */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editingTemplate ? "Cập nhật kịch bản tin nhắn" : "Thêm mới kịch bản tin nhắn"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập điều kiện gửi tự động và biên soạn nội dung tin nhắn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="t-name" className="text-xs">Tên kịch bản *</Label>
                <Input
                  id="t-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Cảm ơn khách hàng"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sử dụng khi đơn hàng chuyển sang:</Label>
                <Select value={formTrigger} onValueChange={setFormTrigger}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectTrigger className="hidden" />
                  <SelectContent className="bg-popover text-foreground z-50">
                    <SelectItem value="Mới" className="text-xs">Mới</SelectItem>
                    <SelectItem value="Xác nhận đơn hàng" className="text-xs">Xác nhận đơn hàng</SelectItem>
                    <SelectItem value="Đang đóng hàng" className="text-xs">Đang đóng hàng</SelectItem>
                    <SelectItem value="Gửi hàng đi" className="text-xs">Gửi hàng đi</SelectItem>
                    <SelectItem value="Huỷ đơn" className="text-xs">Huỷ đơn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nguồn áp dụng</Label>
                <Select value={formSource} onValueChange={setFormSource}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectTrigger className="hidden" />
                  <SelectContent className="bg-popover text-foreground z-50">
                    <SelectItem value="Tất cả" className="text-xs">Tất cả nguồn đơn</SelectItem>
                    <SelectItem value="Facebook" className="text-xs">Facebook Messenger</SelectItem>
                    <SelectItem value="Shopee" className="text-xs">Shopee</SelectItem>
                    <SelectItem value="Lazada" className="text-xs">Lazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Đơn vị vận chuyển</Label>
                <Select value={formCarrier} onValueChange={setFormCarrier}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectTrigger className="hidden" />
                  <SelectContent className="bg-popover text-foreground z-50">
                    <SelectItem value="Tất cả" className="text-xs">Tất cả ĐVVC</SelectItem>
                    <SelectItem value="Giao Hàng Tiết Kiệm" className="text-xs">Giao Hàng Tiết Kiệm</SelectItem>
                    <SelectItem value="Viettel Post" className="text-xs">Viettel Post</SelectItem>
                    <SelectItem value="Giao Hàng Nhanh" className="text-xs">Giao Hàng Nhanh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="t-content" className="text-xs font-semibold">Nội dung tin nhắn *</Label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Chèn nhanh:</span>
                  {["{customer_name}", "{order_number}", "{total_amount}", "{tracking_number}"].map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[9px] cursor-pointer hover:bg-secondary"
                      onClick={() => setFormContent(formContent + tag)}
                    >
                      {tag.replace("{", "").replace("}", "")}
                    </Badge>
                  ))}
                </div>
              </div>
              <Textarea
                id="t-content"
                rows={4}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Nhập kịch bản tin nhắn gửi khách..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="h-8 text-xs cursor-pointer">
              Hủy
            </Button>
            <Button size="sm" onClick={handleSaveTemplate} className="h-8 text-xs cursor-pointer bg-blue-600 hover:bg-blue-700">
              <Save className="h-3.5 w-3.5 mr-1" />
              Lưu kịch bản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
