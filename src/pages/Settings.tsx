import { useState, useEffect } from "react";
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
import { User, Store, Shield, Loader2, Plus, Pencil, Trash2, CreditCard, Ticket, Truck, Users, History, FolderOpen, Mail, Bot, Building2, UsersRound, Link2, HardDrive, ShieldCheck, Activity, Tags, Zap } from "lucide-react";
import { usePlatformSync } from "@/hooks/usePlatformSync";
import { BankSettingsTab } from "@/components/settings/BankSettingsTab";
import { VouchersTab } from "@/components/settings/VouchersTab";
import { ShippingZonesTab } from "@/components/settings/ShippingZonesTab";
import { ShippingCarriersTab } from "@/components/settings/ShippingCarriersTab";
import { CompanyMembersTab } from "@/components/settings/CompanyMembersTab";
import { AuditLogsTab } from "@/components/settings/AuditLogsTab";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const { getAuthUrl } = usePlatformSync();
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

  return (
    <MainLayout>
      <Header title="Cài đặt" subtitle="Quản lý tài khoản và cấu hình hệ thống" />

      <div className="p-4 sm:p-6">
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="w-full flex flex-wrap h-auto gap-1">
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
        </Tabs>
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
