import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link2, Server, Loader2 } from "lucide-react";

export function BlockchainConfigTab() {
  const { companyId } = useCompanyContext();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["blockchain-config", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("blockchain_config")
        .select("*")
        .eq("company_id", companyId!)
        .maybeSingle();
      return data as any;
    },
    enabled: !!companyId,
  });

  const [form, setForm] = useState({
    chain_name: "", chain_id: "", contract_address: "", rpc_url: "", gas_limit: "", is_active: false,
  });

  useEffect(() => {
    if (config) {
      setForm({
        chain_name: config.chain_name || "",
        chain_id: config.chain_id || "",
        contract_address: config.contract_address || "",
        rpc_url: config.rpc_url || "",
        gas_limit: config.gas_limit?.toString() || "",
        is_active: config.is_active || false,
      });
    }
  }, [config]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        company_id: companyId!,
        chain_name: form.chain_name,
        chain_id: form.chain_id || null,
        contract_address: form.contract_address || null,
        rpc_url: form.rpc_url || null,
        gas_limit: form.gas_limit ? Number(form.gas_limit) : null,
        is_active: form.is_active,
      };
      if (config?.id) {
        const { error } = await supabase.from("blockchain_config").update(payload).eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blockchain_config").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blockchain-config"] });
      toast({ title: "Đã lưu cấu hình blockchain" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />Cấu hình Blockchain</CardTitle>
          <CardDescription>
            Kết nối Smart Contract để đẩy token lên on-chain. Khi chưa cấu hình, hệ thống hoạt động ở chế độ nội bộ (Database).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div>
              <p className="font-medium text-foreground">Chế độ hoạt động</p>
              <p className="text-sm text-muted-foreground">{form.is_active ? "On-chain (Blockchain)" : "Nội bộ (Database)"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={form.is_active ? "default" : "secondary"}>{form.is_active ? "Active" : "Offline"}</Badge>
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Chain Name</Label><Input value={form.chain_name} onChange={e => setForm(f => ({ ...f, chain_name: e.target.value }))} placeholder="Ethereum, Polygon, BSC..." /></div>
            <div><Label>Chain ID</Label><Input value={form.chain_id} onChange={e => setForm(f => ({ ...f, chain_id: e.target.value }))} placeholder="1, 137, 56..." /></div>
            <div className="md:col-span-2"><Label>Contract Address</Label><Input value={form.contract_address} onChange={e => setForm(f => ({ ...f, contract_address: e.target.value }))} placeholder="0x..." /></div>
            <div className="md:col-span-2"><Label>RPC URL</Label><Input value={form.rpc_url} onChange={e => setForm(f => ({ ...f, rpc_url: e.target.value }))} placeholder="https://rpc...." /></div>
            <div><Label>Gas Limit</Label><Input type="number" value={form.gas_limit} onChange={e => setForm(f => ({ ...f, gas_limit: e.target.value }))} placeholder="300000" /></div>
          </div>

          <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
            {save.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang lưu...</> : "Lưu cấu hình"}
          </Button>

          <p className="text-xs text-muted-foreground">
            * Khi bật chế độ On-chain, mọi giao dịch token sẽ được đồng bộ lên Blockchain. Đảm bảo Smart Contract đã được deploy trước khi bật.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
