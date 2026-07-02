import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useSalesChannels } from "@/hooks/useSalesChannels";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { User, Store, Shield, Loader2, Plus, Pencil, Trash2, CreditCard, Ticket, Truck, Users, History, FolderOpen, Mail, Bot, Building2, UsersRound, Link2, HardDrive, ShieldCheck, Activity, Tags, Zap, Award, ArrowLeft, MessageSquare, Facebook } from "lucide-react";
import { usePlatformSync } from "@/hooks/usePlatformSync";
import { BankSettingsTab } from "@/components/settings/BankSettingsTab";
import { VouchersTab } from "@/components/settings/VouchersTab";
import { ShippingZonesTab } from "@/components/settings/ShippingZonesTab";
import { ShippingCarriersTab } from "@/components/settings/ShippingCarriersTab";
import { CompanyMembersTab } from "@/components/settings/CompanyMembersTab";
import { AuditLogsTab } from "@/components/settings/AuditLogsTab";
import { DynamicRbacTab } from "@/components/settings/DynamicRbacTab";
import { CustomerGroupsTab } from "@/components/settings/CustomerGroupsTab";
import { CategoriesTab } from "@/components/settings/CategoriesTab";
import { EmailPreferencesTab } from "@/components/settings/EmailPreferencesTab";
import { AISettingsTab } from "@/components/settings/AISettingsTab";
import { CompanyInfoSection } from "@/components/settings/CompanyInfoSection";
import { BackupTab } from "@/components/settings/BackupTab";
import { PermissionPoliciesTab } from "@/components/settings/PermissionPoliciesTab";
import { AgentPermissionsTab } from "@/components/settings/AgentPermissionsTab";
import { SystemHealthTab } from "@/components/settings/SystemHealthTab";
import { PriceListsTab } from "@/components/settings/PriceListsTab";
import { SubscriptionsTab } from "@/components/settings/SubscriptionsTab";
import { EventBusMonitorTab } from "@/components/settings/EventBusMonitorTab";
import { SalesPoliciesTab } from "@/components/settings/SalesPoliciesTab";
import { LoyaltySettingsTab } from "@/components/settings/LoyaltySettingsTab";
import { CommissionSettingsTab } from "@/components/settings/CommissionSettingsTab";
import { AutoMessagesTab } from "@/components/settings/AutoMessagesTab";
import { EventSyncTab } from "@/components/settings/EventSyncTab";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

const channelSchema = z.object({
  name: z.string().min(1, "Tên kênh không được để trống").max(100),
  code: z.string().min(1, "Mã kênh không được để trống").max(20),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Màu không hợp lệ"),
  description: z.string().max(500).optional(),
  platform_type: z.string().default("manual"),
  api_credentials: z.record(z.string()).optional(),
});

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { profile, isLoading: profileLoading, updateProfile } = useProfile();
  const { role } = useCompanyContext();
  const isAdmin = role === "admin";
  const { channels, createChannel, updateChannel, deleteChannel } = useSalesChannels();
  const { products = [] } = useProducts();
  const { getAuthUrl } = usePlatformSync();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  useEffect(() => {
    const tabVal = searchParams.get("tab");
    if (tabVal) {
      setActiveTab(tabVal);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };

  const [connectingId, setConnectingId] = useState<string | null>(null);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" });
  useEffect(() => {
    if (profile) {
      setProfileForm({ full_name: profile.full_name || "", phone: profile.phone || "" });
    }
  }, [profile]);

  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);

  // Product Mappings State
  const [productMappings, setProductMappings] = useState<any[]>([]);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [newMapping, setNewMapping] = useState({ channel_id: "", external_name: "", external_sku: "", product_id: "" });

  useEffect(() => {
    const rawMappings = localStorage.getItem("erp-mini-local-demo-product-mappings");
    if (rawMappings) {
      try {
        setProductMappings(JSON.parse(rawMappings));
      } catch (e) {
        setProductMappings([]);
      }
    } else {
      const defaultMappings = [
        { id: "map-1", channel_id: channels[0]?.id || "chan-1", external_name: "Áo sơ mi nam công sở cotton", external_sku: "SHP-SHIRT-COTTON", product_id: "prod-1" },
        { id: "map-2", channel_id: channels[1]?.id || "chan-2", external_name: "Chỉ may bò dập dày", external_sku: "LZD-CHI-MAY", product_id: "CHI" }
      ];
      setProductMappings(defaultMappings);
      localStorage.setItem("erp-mini-local-demo-product-mappings", JSON.stringify(defaultMappings));
    }
  }, [channels]);

  const handleCreateMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapping.channel_id || !newMapping.external_name.trim() || !newMapping.external_sku.trim() || !newMapping.product_id) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ các trường", variant: "destructive" });
      return;
    }
    const created = {
      id: `map-${Date.now()}`,
      ...newMapping
    };
    const updated = [...productMappings, created];
    setProductMappings(updated);
    localStorage.setItem("erp-mini-local-demo-product-mappings", JSON.stringify(updated));
    setNewMapping({ channel_id: "", external_name: "", external_sku: "", product_id: "" });
    setMappingDialogOpen(false);
    toast({ title: "Đã liên kết sản phẩm thành công" });
  };

  const handleDeleteMapping = (id: string) => {
    if (confirm("Hủy liên kết sản phẩm này?")) {
      const updated = productMappings.filter((m) => m.id !== id);
      setProductMappings(updated);
      localStorage.setItem("erp-mini-local-demo-product-mappings", JSON.stringify(updated));
      toast({ title: "Đã hủy liên kết sản phẩm" });
    }
  };
  const [channelForm, setChannelForm] = useState({ name: "", code: "", color: "#3B82F6", description: "", platform_type: "manual", api_credentials: {} as Record<string, string> });
  const [channelErrors, setChannelErrors] = useState<Record<string, string>>({});

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      passwordSchema.parse(passwordForm);
      setPasswordErrors({});
      setPasswordLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast({ title: "Đổi mật khẩu thành công" });
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach(e => { if (e.path[0]) errors[e.path[0] as string] = e.message; });
        setPasswordErrors(errors);
      } else {
        toast({ variant: "destructive", title: "Lỗi", description: (err as Error).message });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileSave = async () => {
    await updateProfile.mutateAsync(profileForm);
  };

  const openChannelDialog = (channel?: any) => {
    if (channel) {
      setEditingChannel(channel);
      setChannelForm({
        name: channel.name,
        code: channel.code,
        color: channel.color || "#3B82F6",
        description: channel.description || "",
        platform_type: channel.platform_type || "manual",
        api_credentials: channel.api_credentials || {},
      });
    } else {
      setEditingChannel(null);
      setChannelForm({ name: "", code: "", color: "#3B82F6", description: "", platform_type: "manual", api_credentials: {} });
    }
    setChannelErrors({});
    setChannelDialogOpen(true);
  };

  const handleChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      channelSchema.parse(channelForm);
      setChannelErrors({});

      if (editingChannel) {
        await updateChannel.mutateAsync({ id: editingChannel.id, ...channelForm });
      } else {
        await createChannel.mutateAsync(channelForm);
      }
      setChannelDialogOpen(false);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach(e => { if (e.path[0]) errors[e.path[0] as string] = e.message; });
        setChannelErrors(errors);
      }
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa kênh bán hàng này?")) {
      await deleteChannel.mutateAsync(id);
    }
  };

  const handleConnectPlatform = async (channel: any) => {
    const pt = channel.platform_type;
    if (pt === "tiki") {
      // Token-based: auto-enable if api_token exists
      const creds = channel.api_credentials || {};
      if (creds.api_token) {
        await updateChannel.mutateAsync({ id: channel.id, sync_enabled: true } as any);
      } else {
        toast({ variant: "destructive", title: "Thiếu API Token", description: "Vui lòng nhập API Token từ Tiki Seller Center trước." });
      }
      return;
    }
    setConnectingId(channel.id);
    try {
      const redirectUri = window.location.origin + "/platform-callback?state=" + channel.id;
      const url = await getAuthUrl.mutateAsync({ channelId: channel.id, redirectUri });
      if (url) window.location.href = url;
    } catch {
      setConnectingId(null);
    }
  };

  const SettingsOverview = () => {
    const sections = [
      {
        title: "Cấu hình chung",
        icon: Store,
        items: [
          { label: "Cửa hàng", tab: "shop", desc: "Thông tin shop, mẫu in hoá đơn" },
          { label: "Tài khoản cá nhân", tab: "account", desc: "Đổi mật khẩu, cập nhật profile" },
          { label: "Thông tin công ty", tab: "company", desc: "Thiết lập thông tin pháp lý doanh nghiệp" },
          { label: "Danh mục sản phẩm", tab: "categories", desc: "Quản lý danh mục sản phẩm, nguyên vật liệu" },
          { label: "Bảng giá", tab: "price_lists", desc: "Thiết lập bảng giá bán sỉ/bán lẻ" }
        ]
      },
      {
        title: "Bán hàng & Kênh sàn",
        icon: Link2,
        items: [
          { label: "Kênh bán hàng", tab: "channels", desc: "Quản lý kết nối Shopee, Lazada, TikTok Shop" },
          { label: "Mã giảm giá (Vouchers)", tab: "vouchers", desc: "Thiết lập mã giảm giá cho shop" }
        ]
      },
      {
        title: "Nhân viên & Phân quyền",
        icon: UsersRound,
        items: [
          { label: "Danh sách nhân viên", tab: "members", desc: "Quản lý tài khoản nhân viên" },
          { label: "Cấu hình hoa hồng", tab: "commissions", desc: "Thiết lập hoa hồng bán hàng cho sales" },
          { label: "Quy trình phân quyền", tab: "permissions", desc: "Cài đặt phân quyền chi tiết vai trò" },
          { label: "Vai trò & Nhóm quyền động", tab: "dynamic_rbac", desc: "Tùy biến nhóm quyền và vai trò chi tiết" }
        ]
      },
      {
        title: "Khách hàng & Đối tác",
        icon: Users,
        items: [
          { label: "Nhóm khách hàng", tab: "customers", desc: "Cài đặt nhóm khách hàng, phân loại" },
          { label: "Tích điểm & Hạng thẻ", tab: "loyalty", desc: "Cấu hình tích điểm và hạng thành viên" }
        ]
      },
      {
        title: "Thanh toán",
        icon: CreditCard,
        items: [
          { label: "Tài khoản ngân hàng", tab: "bank", desc: "Cấu hình tài khoản nhận tiền thanh toán" }
        ]
      },
      {
        title: "Vận chuyển",
        icon: Truck,
        items: [
          { label: "Khu vực vận chuyển", tab: "shipping", desc: "Thiết lập phí ship theo khu vực" },
          { label: "Hãng giao hàng (Pancake)", tab: "carriers", desc: "Cài đặt hãng vận chuyển mặc định" }
        ]
      },
      {
        title: "Thông báo & CSKH",
        icon: MessageSquare,
        items: [
          { label: "Tin nhắn tự động", tab: "auto_messages", desc: "Tự động gửi hoá đơn, CSKH qua Messenger & SMS" },
          { label: "Cấu hình Email", tab: "email", desc: "Cấu hình mail server gửi hóa đơn" }
        ]
      },
      {
        title: "AI & Tự động hóa",
        icon: Bot,
        items: [
          { label: "Cài đặt AI", tab: "ai", desc: "Cấu hình API Key, Prompt cho AI Copilot" },
          { label: "AI Agent", tab: "agents", desc: "Quản lý quyền hạn và tác vụ của Agent" }
        ]
      },
      {
        title: "Nâng cao & Hệ thống",
        icon: Zap,
        items: [
          { label: "Đồng bộ sự kiện (CAPI)", tab: "event_sync", desc: "Đồng bộ Facebook Conversions API & Pixel" },
          { label: "Chính sách bán hàng", tab: "policies", desc: "Quản lý chính sách công nợ, đổi trả" },
          { label: "Sao lưu & Khôi phục", tab: "backup", desc: "Quản lý dữ liệu hệ thống" },
          { label: "Gói dịch vụ", tab: "subscriptions", desc: "Quản lý gói dịch vụ và thời hạn sử dụng" },
          { label: "Nhật ký hệ thống", tab: "audit", desc: "Tra cứu lịch sử thao tác hệ thống" },
          { label: "Sức khỏe hệ thống", tab: "health", desc: "Giám sát hiệu suất ứng dụng và DB" },
          { label: "Event Bus Monitor", tab: "event_bus", desc: "Theo dõi luồng sự kiện thời gian thực" }
        ]
      }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sections.map((section, idx) => (
            <Card key={idx} className="border border-border hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center gap-2.5 pb-2 border-b">
                <section.icon className="h-5 w-5 text-primary shrink-0" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    onClick={() => handleTabChange(item.tab)}
                    className="group cursor-pointer block text-left"
                  >
                    <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700 transition-colors block">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground block leading-relaxed">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <Header title="Cài đặt" subtitle="Quản lý tài khoản và cấu hình hệ thống" />

      <div className="p-4 sm:p-6 space-y-6">
        {activeTab !== "overview" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTabChange("overview")}
            className="gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer -mt-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại cài đặt tổng quan
          </Button>
        )}

        {activeTab === "overview" ? (
          <SettingsOverview />
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="hidden flex-wrap h-auto gap-1">
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Tài khoản</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="company" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Công ty</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="members" className="gap-2">
                <UsersRound className="h-4 w-4" />
                <span className="hidden sm:inline">Thành viên</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="shop" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Cửa hàng</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Danh mục</span>
            </TabsTrigger>
            <TabsTrigger value="channels" className="gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Kênh bán</span>
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="gap-2">
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Voucher</span>
            </TabsTrigger>
            <TabsTrigger value="shipping" className="gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Vận chuyển</span>
            </TabsTrigger>
            <TabsTrigger value="carriers" className="gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Hãng giao hàng</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Nhóm KH</span>
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Tích điểm & Hạng thẻ</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Chính sách</span>
            </TabsTrigger>
            <TabsTrigger value="price_lists" className="gap-2">
              <Tags className="h-4 w-4" />
              <span className="hidden sm:inline">Bảng giá</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Gói dịch vụ</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="audit" className="gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Nhật ký</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="permissions" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Phân quyền</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="dynamic_rbac" className="gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Vai trò & Quyền</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="agents" className="gap-2">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">AI Agent</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="backup" className="gap-2">
                <HardDrive className="h-4 w-4" />
                <span className="hidden sm:inline">Sao lưu</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="health" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Sức khỏe</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="event_bus" className="gap-2">
                <Zap className="h-4 w-4 text-warning" />
                <span className="hidden sm:inline">Event Bus</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cá nhân</CardTitle>
                  <CardDescription>Cập nhật hồ sơ của bạn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-foreground">
                        {(profile?.full_name || user?.email || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{profile?.full_name || "Chưa đặt tên"}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 max-w-lg">
                    <div className="space-y-2">
                      <Label>Họ và tên</Label>
                      <Input
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        placeholder="Nhập họ tên"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Số điện thoại</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="Nhập SĐT"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-lg">
                    <Label>Email</Label>
                    <Input value={user?.email || ""} disabled />
                  </div>
                  <Button
                    onClick={handleProfileSave}
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Lưu hồ sơ
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Đổi mật khẩu</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Mật khẩu mới</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      />
                      {passwordErrors.newPassword && (
                        <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>
                    <Button type="submit" disabled={passwordLoading}>
                      {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Đổi mật khẩu
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Button variant="destructive" onClick={signOut}>
                Đăng xuất
              </Button>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="company">
              <CompanyInfoSection />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="members">
              <CompanyMembersTab />
            </TabsContent>
          )}

          <TabsContent value="shop">
            <BankSettingsTab />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>

          <TabsContent value="channels">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Kênh bán hàng</CardTitle>
                  <CardDescription>Quản lý các kênh bán hàng đa sàn</CardDescription>
                </div>
                <Button onClick={() => openChannelDialog()} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm kênh
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {channels.map((channel) => {
                    const platformLabels: Record<string, string> = { shopee: "Shopee", lazada: "Lazada", tiktok: "TikTok", tiki: "Tiki", vieterp: "VietERP Platform" };
                    const pt = (channel as any).platform_type;
                    return (
                    <div
                      key={channel.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-primary-foreground font-bold"
                          style={{ backgroundColor: channel.color || "#3B82F6" }}
                        >
                          {channel.code?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{channel.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">{channel.code}</p>
                            {pt && pt !== "manual" && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {platformLabels[pt] || pt}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={channel.is_active ? "default" : "secondary"}>
                          {channel.is_active ? "Hoạt động" : "Tắt"}
                        </Badge>
                        {pt && pt !== "manual" && (
                          (channel as any).sync_enabled ? (
                            <Badge className="text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
                              Đã kết nối
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleConnectPlatform(channel)}
                              disabled={connectingId === channel.id}
                            >
                              {connectingId === channel.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Link2 className="h-3 w-3 mr-1" />
                                  Kết nối
                                </>
                              )}
                            </Button>
                          )
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openChannelDialog(channel)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteChannel(channel.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Product Mappings Section */}
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <div>
                  <CardTitle className="text-sm font-bold">Liên kết sản phẩm đa sàn</CardTitle>
                  <CardDescription className="text-[11px] mt-1">
                    Thiết lập ánh xạ mã SKU từ các sàn Shopee, Lazada, TikTok sang sản phẩm nội bộ để trừ tồn kho chính xác.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setMappingDialogOpen(true)} className="h-8 text-xs font-semibold gap-1">
                  <Plus className="h-3.5 w-3.5" /> Tạo liên kết
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/20 text-muted-foreground text-left">
                        <th className="p-3 font-medium">Kênh bán</th>
                        <th className="p-3 font-medium">Sản phẩm trên Sàn (SKU Sàn)</th>
                        <th className="p-3 font-medium">Sản phẩm liên kết POS (SKU POS)</th>
                        <th className="p-3 font-center font-medium text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productMappings.map((m) => {
                        const channel = channels.find((c) => c.id === m.channel_id);
                        const product = products.find((p) => p.id === m.product_id);
                        return (
                          <tr key={m.id} className="border-b hover:bg-secondary/15 transition-colors">
                            <td className="p-3">
                              <Badge style={{ backgroundColor: channel?.color || "#e2e8f0" }} className="text-[9px] px-1.5 py-0 font-bold text-white">
                                {channel?.name || "Kênh bán"}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-foreground">{m.external_name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">SKU Sàn: {m.external_sku}</div>
                            </td>
                            <td className="p-3">
                              {product ? (
                                <>
                                  <div className="font-semibold text-foreground">{product.name}</div>
                                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">SKU POS: {product.sku || product.id}</div>
                                </>
                              ) : (
                                <span className="text-red-500 font-semibold">Sản phẩm đã bị xóa khỏi POS</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMapping(m.id)}
                                className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/20"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {productMappings.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-muted-foreground">
                            Chưa có sản phẩm nào được liên kết đa sàn.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Dialog: Create Product Mapping */}
            <Dialog open={mappingDialogOpen} onOpenChange={setMappingDialogOpen}>
              <DialogContent className="max-w-md bg-card border border-border">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-foreground">
                    <Link2 className="h-5 w-5 text-blue-600" /> Tạo liên kết sản phẩm mới
                  </DialogTitle>
                  <DialogDescription>
                    Thiết lập ánh xạ SKU từ sàn thương mại điện tử sang kho hàng POS.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateMapping} className="space-y-4 text-foreground text-xs">
                  <div className="space-y-1">
                    <Label className="font-semibold">Kênh bán hàng</Label>
                    <Select
                      value={newMapping.channel_id}
                      onValueChange={(val) => setNewMapping({ ...newMapping, channel_id: val })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Chọn kênh..." /></SelectTrigger>
                      <SelectContent className="bg-popover text-foreground z-[100]">
                        {channels.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="extName" className="font-semibold">Tên sản phẩm trên Sàn</Label>
                    <Input id="extName" className="h-8" placeholder="Ví dụ: Áo khoác dù chống nắng" value={newMapping.external_name} onChange={(e) => setNewMapping({ ...newMapping, external_name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="extSku" className="font-semibold">Mã SKU trên Sàn</Label>
                    <Input id="extSku" className="h-8 font-mono" placeholder="Ví dụ: SHP-JACKET-RED-M" value={newMapping.external_sku} onChange={(e) => setNewMapping({ ...newMapping, external_sku: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold">Sản phẩm POS tương ứng</Label>
                    <Select
                      value={newMapping.product_id}
                      onValueChange={(val) => setNewMapping({ ...newMapping, product_id: val })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Chọn sản phẩm POS..." /></SelectTrigger>
                      <SelectContent className="bg-popover text-foreground z-[100] max-h-[200px] overflow-y-auto">
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku || p.id})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setMappingDialogOpen(false)}>Hủy</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">Tạo liên kết</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="vouchers">
            <VouchersTab />
          </TabsContent>

          <TabsContent value="shipping">
            <ShippingZonesTab />
          </TabsContent>

          <TabsContent value="carriers">
            <ShippingCarriersTab />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerGroupsTab />
          </TabsContent>

          <TabsContent value="loyalty">
            <LoyaltySettingsTab />
          </TabsContent>

          <TabsContent value="policies">
            <SalesPoliciesTab />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="audit">
              <AuditLogsTab />
            </TabsContent>
          )}

          <TabsContent value="email">
            <EmailPreferencesTab />
          </TabsContent>

          <TabsContent value="ai">
            <AISettingsTab />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="permissions">
              <PermissionPoliciesTab />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="dynamic_rbac">
              <DynamicRbacTab />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="agents">
              <AgentPermissionsTab />
            </TabsContent>
          )}

          <TabsContent value="backup">
            <BackupTab />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="health">
              <SystemHealthTab />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="event_bus">
              <EventBusMonitorTab />
            </TabsContent>
          )}

          <TabsContent value="price_lists">
            <PriceListsTab />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionsTab />
          </TabsContent>

          <TabsContent value="commissions">
            <CommissionSettingsTab />
          </TabsContent>

          <TabsContent value="auto_messages">
            <AutoMessagesTab />
          </TabsContent>

          <TabsContent value="event_sync">
            <EventSyncTab />
          </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Channel Dialog */}
      <Dialog open={channelDialogOpen} onOpenChange={setChannelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingChannel ? "Sửa kênh bán hàng" : "Thêm kênh bán hàng"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChannelSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Loại kênh *</Label>
              <select
                value={channelForm.platform_type}
                onChange={(e) => {
                  const pt = e.target.value;
                  const colors: Record<string, string> = { shopee: "#EE4D2D", lazada: "#0F146D", tiktok: "#000000", tiki: "#1A94FF", vieterp: "#EF4444", manual: "#3B82F6" };
                  setChannelForm({ ...channelForm, platform_type: pt, color: colors[pt] || channelForm.color });
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={!!editingChannel}
              >
                <option value="manual">Thủ công</option>
                <option value="shopee">Shopee</option>
                <option value="lazada">Lazada</option>
                <option value="tiktok">TikTok Shop</option>
                <option value="tiki">Tiki</option>
                <option value="vieterp">VietERP Platform</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên kênh *</Label>
                <Input
                  value={channelForm.name}
                  onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                />
                {channelErrors.name && <p className="text-xs text-destructive">{channelErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Mã kênh *</Label>
                <Input
                  value={channelForm.code}
                  onChange={(e) => setChannelForm({ ...channelForm, code: e.target.value.toUpperCase() })}
                  disabled={!!editingChannel}
                />
                {channelErrors.code && <p className="text-xs text-destructive">{channelErrors.code}</p>}
              </div>
            </div>

            {channelForm.platform_type === "shopee" && (
              <div className="space-y-3 p-3 rounded-lg bg-secondary/30">
                <p className="text-sm font-medium text-foreground">Cấu hình Shopee API</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Partner ID</Label>
                    <Input
                      value={channelForm.api_credentials.partner_id || ""}
                      onChange={(e) => setChannelForm({ ...channelForm, api_credentials: { ...channelForm.api_credentials, partner_id: e.target.value } })}
                      placeholder="Partner ID"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Shop ID</Label>
                    <Input
                      value={channelForm.api_credentials.shop_id || ""}
                      onChange={(e) => setChannelForm({ ...channelForm, api_credentials: { ...channelForm.api_credentials, shop_id: e.target.value } })}
                      placeholder="Shop ID"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Partner Key</Label>
                  <Input
                    type="password"
                    value={channelForm.api_credentials.partner_key || ""}
                    onChange={(e) => setChannelForm({ ...channelForm, api_credentials: { ...channelForm.api_credentials, partner_key: e.target.value } })}
                    placeholder="Partner Key"
                  />
                </div>
              </div>
            )}

            {(channelForm.platform_type === "lazada" || channelForm.platform_type === "tiktok") && (
              <div className="space-y-3 p-3 rounded-lg bg-secondary/30">
                <p className="text-sm font-medium text-foreground">Cấu hình {channelForm.platform_type === "lazada" ? "Lazada" : "TikTok Shop"} API</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">App Key</Label>
                    <Input
                      value={channelForm.api_credentials.app_key || ""}
                      onChange={(e) => setChannelForm({ ...channelForm, api_credentials: { ...channelForm.api_credentials, app_key: e.target.value } })}
                      placeholder="App Key"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">App Secret</Label>
                    <Input
                      type="password"
                      value={channelForm.api_credentials.app_secret || ""}
                      onChange={(e) => setChannelForm({ ...channelForm, api_credentials: { ...channelForm.api_credentials, app_secret: e.target.value } })}
                      placeholder="App Secret"
                    />
                  </div>
                </div>
              </div>
            )}

            {channelForm.platform_type === "tiki" && (
              <div className="space-y-3 p-3 rounded-lg bg-secondary/30">
                <p className="text-sm font-medium text-foreground">Cấu hình Tiki API</p>
                <div className="space-y-1">
                  <Label className="text-xs">API Token</Label>
                  <Input
                    type="password"
                    value={channelForm.api_credentials.api_token || ""}
                    onChange={(e) => setChannelForm({ ...channelForm, api_credentials: { ...channelForm.api_credentials, api_token: e.target.value } })}
                    placeholder="API Token từ Tiki Seller Center"
                  />
                </div>
              </div>
            )}

            {channelForm.platform_type === "vieterp" && (
              <div className="space-y-3 p-3 rounded-lg bg-secondary/30">
                <p className="text-sm font-medium text-foreground">Cấu hình VietERP API</p>
                <div className="space-y-1">
                  <Label className="text-xs">Base URL</Label>
                  <Input
                    value={channelForm.api_credentials.base_url || ""}
                    onChange={(e) => setChannelForm({ ...channelForm, api_credentials: { ...channelForm.api_credentials, base_url: e.target.value } })}
                    placeholder="VD: http://localhost:8000/api/v1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">API Key / Token</Label>
                    <Input
                      type="password"
                      value={channelForm.api_credentials.api_key || ""}
                      onChange={(e) => setChannelForm({ ...channelForm, api_credentials: { ...channelForm.api_credentials, api_key: e.target.value } })}
                      placeholder="vierp_live_..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tenant ID</Label>
                    <Input
                      value={channelForm.api_credentials.tenant_id || ""}
                      onChange={(e) => setChannelForm({ ...channelForm, api_credentials: { ...channelForm.api_credentials, tenant_id: e.target.value } })}
                      placeholder="tenant-123"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Màu sắc</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={channelForm.color}
                  onChange={(e) => setChannelForm({ ...channelForm, color: e.target.value })}
                  className="h-10 w-20 rounded cursor-pointer"
                />
                <Input
                  value={channelForm.color}
                  onChange={(e) => setChannelForm({ ...channelForm, color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Input
                value={channelForm.description}
                onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setChannelDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createChannel.isPending || updateChannel.isPending}>
                {(createChannel.isPending || updateChannel.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingChannel ? "Cập nhật" : "Thêm mới"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Settings;
