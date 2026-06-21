import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { enableLocalDemoAuth, isLocalDemoCredentials } from "@/lib/localDemoAuth";

const authSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

function getAuthErrorMessage(error: { message: string; code?: string }) {
  if (error.code === "email_not_confirmed" || error.message === "Email not confirmed") {
    return "Email chưa được xác nhận. Hãy mở email xác nhận từ Supabase rồi đăng nhập lại.";
  }

  if (error.message === "Invalid login credentials") {
    return "Email hoặc mật khẩu không đúng";
  }

  if (error.message === "User already registered") {
    return "Email đã được đăng ký";
  }

  return error.message;
}

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", fullName: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);

  const validateForm = () => {
    try {
      authSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        err.errors.forEach((error) => {
          if (error.path[0] === "email") fieldErrors.email = error.message;
          if (error.path[0] === "password") fieldErrors.password = error.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocalDemoCredentials(formData.email, formData.password)) {
      enableLocalDemoAuth();
      setAuthNotice(null);
      setCanResendConfirmation(false);
      toast({ title: "Đăng nhập demo thành công", description: "Bạn đang dùng tài khoản local admin/admin." });
      navigate("/");
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      if (error.code === "email_not_confirmed" || error.message === "Email not confirmed") {
        setAuthNotice(getAuthErrorMessage(error));
        setCanResendConfirmation(true);
      }
      toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description: getAuthErrorMessage(error),
      });
    } else {
      setAuthNotice(null);
      setCanResendConfirmation(false);
      toast({ title: "Đăng nhập thành công!" });
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: formData.fullName },
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Đăng ký thất bại",
        description: getAuthErrorMessage(error),
      });
    } else if (data.session) {
      setAuthNotice(null);
      setCanResendConfirmation(false);
      toast({ title: "Đăng ký thành công!", description: "Phiên đăng nhập đã được tạo." });
      navigate("/");
    } else {
      const message = "Đã gửi email xác nhận. Hãy mở email đó trước khi đăng nhập.";
      setAuthNotice(message);
      setCanResendConfirmation(true);
      toast({ title: "Đăng ký thành công!", description: message });
    }
    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    const emailCheck = z.string().email().safeParse(formData.email);
    if (!emailCheck.success) {
      setErrors((current) => ({ ...current, email: "Nhập email cần gửi lại xác nhận" }));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: formData.email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Không gửi lại được email",
        description: getAuthErrorMessage(error),
      });
    } else {
      const message = "Đã gửi lại email xác nhận. Hãy kiểm tra hộp thư đến hoặc thư rác.";
      setAuthNotice(message);
      toast({ title: "Đã gửi lại email", description: message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">E</span>
            </div>
            <span className="text-2xl font-bold text-foreground">ERP Mini</span>
          </div>
          <p className="text-muted-foreground">Hệ thống quản lý kinh doanh đa kênh</p>
        </div>

        <Card>
          <Tabs defaultValue="login">
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                <TabsTrigger value="signup">Đăng ký</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="mb-4 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                Không có tài khoản mặc định. Hãy đăng ký bằng email thật, xác nhận email rồi quay lại đăng nhập.
                {import.meta.env.DEV && (
                  <span className="mt-2 block">Local dev: có thể dùng admin / admin để vào nhanh bản demo.</span>
                )}
              </div>
              {authNotice && (
                <div className="mb-4 space-y-2 rounded-md border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
                  <p>{authNotice}</p>
                  {canResendConfirmation && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={loading}
                      onClick={handleResendConfirmation}
                    >
                      Gửi lại email xác nhận
                    </Button>
                  )}
                </div>
              )}

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mật khẩu</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Đăng nhập
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Họ tên</Label>
                    <Input
                      id="signup-name"
                      placeholder="Nguyễn Văn A"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mật khẩu</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Đăng ký
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
