import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Fingerprint, Loader2 } from "lucide-react";

export function VNeIDTab() {
  const { user } = useAuth();
  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const [vneidNumber, setVneidNumber] = useState("");
  const [verifying, setVerifying] = useState(false);

  const { data: verification, refetch } = useQuery({
    queryKey: ["vneid-verification", user?.id, companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("vneid_verifications")
        .select("*")
        .eq("user_id", user!.id)
        .eq("company_id", companyId!)
        .maybeSingle();
      return data as any;
    },
    enabled: !!user?.id && !!companyId,
  });

  const handleVerify = async () => {
    if (!vneidNumber) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-vneid", {
        body: { vneid_number: vneidNumber },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Xác thực thành công", description: "Định danh VNeID đã được ghi nhận" });
      setVneidNumber("");
      refetch();
    } catch (e: any) {
      toast({ title: "Lỗi xác thực", description: e.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const statusColors: Record<string, string> = {
    verified: "default",
    pending: "secondary",
    rejected: "destructive",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />Xác thực định danh VNeID
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {verification ? (
            <div className="p-6 rounded-lg bg-muted space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Trạng thái xác thực</p>
                  <Badge variant={statusColors[verification.verification_status] as any || "secondary"}>
                    {verification.verification_status === "verified" ? "Đã xác thực" : verification.verification_status === "pending" ? "Đang chờ" : "Bị từ chối"}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-mono">Hash: {verification.vneid_hash?.slice(0, 16)}...</p>
              {verification.verified_at && (
                <p className="text-xs text-muted-foreground">Xác thực lúc: {new Date(verification.verified_at).toLocaleString("vi-VN")}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Xác thực định danh qua VNeID để đảm bảo tính pháp lý cho các giao dịch cổ phiếu và token.
              </p>
              <div>
                <Label>Số định danh VNeID</Label>
                <Input
                  value={vneidNumber}
                  onChange={e => setVneidNumber(e.target.value)}
                  placeholder="Nhập số CCCD/VNeID"
                  type="password"
                />
              </div>
              <Button onClick={handleVerify} disabled={verifying || !vneidNumber}>
                {verifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang xác thực...</> : "Xác thực ngay"}
              </Button>
              <p className="text-xs text-muted-foreground">
                * Hệ thống chỉ lưu hash mã hóa, không lưu trữ số VNeID gốc
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
