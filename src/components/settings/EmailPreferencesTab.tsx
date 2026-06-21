import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Save, Key } from "lucide-react";

export function EmailPreferencesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [resendApiKey, setResendApiKey] = useState("");
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    document_processed: true,
    document_failed: true,
    weekly_trending: true,
    frequency: "realtime",
  });

  // Fetch existing preferences
  const { data: existingPreferences, isLoading } = useQuery({
    queryKey: ["email-preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("email_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch Resend API key from system settings
  const { data: systemSettings } = useQuery({
    queryKey: ["system-settings", "resend_api_key"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "resend_api_key")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existingPreferences) {
      setPreferences({
        email_enabled: existingPreferences.email_enabled ?? true,
        document_processed: existingPreferences.document_processed ?? true,
        document_failed: existingPreferences.document_failed ?? true,
        weekly_trending: existingPreferences.weekly_trending ?? true,
        frequency: existingPreferences.frequency ?? "realtime",
      });
    }
  }, [existingPreferences]);

  useEffect(() => {
    if (systemSettings?.value) {
      const value = systemSettings.value as any;
      setResendApiKey(value.key ? "••••••••" : "");
    }
  }, [systemSettings]);

  const savePreferences = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from("email_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-preferences"] });
      toast({ title: "Đã lưu cài đặt email" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  const saveResendKey = useMutation({
    mutationFn: async () => {
      if (!resendApiKey || resendApiKey === "••••••••") return;
      
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key: "resend_api_key",
          value: { key: resendApiKey },
          description: "Resend API Key for sending emails",
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      setResendApiKey("••••••••");
      toast({ title: "Đã lưu Resend API Key" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: error.message });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resend API Key - Admin only */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cấu hình Resend API
          </CardTitle>
          <CardDescription>
            Nhập API key từ resend.com để gửi email thông báo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="re_xxxxxx..."
              value={resendApiKey}
              onChange={(e) => setResendApiKey(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => saveResendKey.mutate()}
              disabled={saveResendKey.isPending || !resendApiKey || resendApiKey === "••••••••"}
            >
              {saveResendKey.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Đăng ký tại <a href="https://resend.com" target="_blank" className="underline">resend.com</a> và 
            tạo API key tại <a href="https://resend.com/api-keys" target="_blank" className="underline">đây</a>.
            Đừng quên xác minh domain tại <a href="https://resend.com/domains" target="_blank" className="underline">đây</a>.
          </p>
        </CardContent>
      </Card>

      {/* User preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Tùy chọn email cá nhân
          </CardTitle>
          <CardDescription>
            Chọn loại thông báo bạn muốn nhận qua email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Bật thông báo email</Label>
              <p className="text-sm text-muted-foreground">Nhận thông báo qua email</p>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, email_enabled: checked })
              }
            />
          </div>

          <div className="space-y-4 pl-4 border-l-2 border-border">
            <div className="flex items-center justify-between">
              <div>
                <Label>Xử lý tài liệu thành công</Label>
                <p className="text-sm text-muted-foreground">Thông báo khi tài liệu được xử lý xong</p>
              </div>
              <Switch
                checked={preferences.document_processed}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, document_processed: checked })
                }
                disabled={!preferences.email_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Lỗi xử lý tài liệu</Label>
                <p className="text-sm text-muted-foreground">Thông báo khi có lỗi xử lý</p>
              </div>
              <Switch
                checked={preferences.document_failed}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, document_failed: checked })
                }
                disabled={!preferences.email_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Báo cáo trending tuần</Label>
                <p className="text-sm text-muted-foreground">Nhận báo cáo câu hỏi phổ biến hàng tuần</p>
              </div>
              <Switch
                checked={preferences.weekly_trending}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, weekly_trending: checked })
                }
                disabled={!preferences.email_enabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Tần suất gửi</Label>
              <Select
                value={preferences.frequency}
                onValueChange={(value) => 
                  setPreferences({ ...preferences, frequency: value })
                }
                disabled={!preferences.email_enabled}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Ngay lập tức</SelectItem>
                  <SelectItem value="daily">Tổng hợp hàng ngày</SelectItem>
                  <SelectItem value="weekly">Tổng hợp hàng tuần</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={() => savePreferences.mutate()}
            disabled={savePreferences.isPending}
          >
            {savePreferences.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lưu cài đặt
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
