import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function CompanyInfoSection() {
  const { companyId, role } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = role === "admin";

  const { data: company, isLoading } = useQuery({
    queryKey: ["company-info", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const [form, setForm] = useState({ name: "", code: "" });

  useEffect(() => {
    if (company) {
      setForm({ name: company.name, code: company.code });
    }
  }, [company]);

  const updateCompany = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      const { error } = await supabase
        .from("companies")
        .update({ name: form.name })
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-info"] });
      toast({ title: "Đã cập nhật thông tin công ty" });
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "Lỗi", description: e.message });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Thông tin công ty
        </CardTitle>
        <CardDescription>Quản lý thông tin doanh nghiệp</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label>Tên công ty</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={!isAdmin}
          />
        </div>
        <div className="space-y-2">
          <Label>Mã công ty</Label>
          <Input value={form.code} disabled />
          <p className="text-xs text-muted-foreground">Mã công ty không thể thay đổi</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => updateCompany.mutate()}
            disabled={updateCompany.isPending || form.name === company?.name}
          >
            {updateCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
