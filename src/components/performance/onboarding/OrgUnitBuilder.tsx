import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Building2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { toast } from "sonner";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

interface OrgUnit {
  id: string;
  name: string;
  level_order: number;
}

export function OrgUnitBuilder() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const [newUnitName, setNewUnitName] = useState("");

  const { data: orgUnits, isLoading } = useQuery({
    queryKey: ["perf-org-units", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-perf-org-units");
        if (!raw) return [];
        try {
          return JSON.parse(raw) as OrgUnit[];
        } catch {
          return [];
        }
      }
      
      const { data, error } = await supabase
        .from("perf_org_units")
        .select("id, name, level_order")
        .eq("company_id", companyId)
        .order("level_order");
      
      if (error) throw error;
      return data as OrgUnit[];
    },
    enabled: !!companyId,
  });

  const addUnit = useMutation({
    mutationFn: async (name: string) => {
      if (!companyId) throw new Error("No company");
      
      const maxOrder = Math.max(0, ...(orgUnits?.map(u => u.level_order) || []));
      
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-perf-org-units");
        const list = raw ? JSON.parse(raw) : [];
        const newUnit: OrgUnit = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          name,
          level_order: maxOrder + 1,
        };
        list.push(newUnit);
        localStorage.setItem("erp-mini-local-demo-perf-org-units", JSON.stringify(list));
        return;
      }
      
      const { error } = await supabase
        .from("perf_org_units")
        .insert({
          company_id: companyId,
          name,
          level_order: maxOrder + 1,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perf-org-units", companyId] });
      queryClient.invalidateQueries({ queryKey: ["perf-org-units-count", companyId] });
      setNewUnitName("");
      toast.success("Đã thêm phòng ban");
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const deleteUnit = useMutation({
    mutationFn: async (id: string) => {
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-perf-org-units");
        if (raw) {
          const list = JSON.parse(raw);
          const filtered = list.filter((u: any) => u.id !== id);
          localStorage.setItem("erp-mini-local-demo-perf-org-units", JSON.stringify(filtered));
        }
        return;
      }
      
      const { error } = await supabase
        .from("perf_org_units")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perf-org-units", companyId] });
      queryClient.invalidateQueries({ queryKey: ["perf-org-units-count", companyId] });
      toast.success("Đã xóa phòng ban");
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const handleAdd = () => {
    if (newUnitName.trim()) {
      addUnit.mutate(newUnitName.trim());
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Thêm các phòng ban / khối trong công ty. Mỗi phòng ban có thể có trọng số K.B.I.F riêng.
      </p>

      {/* Add new unit */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Label htmlFor="unit-name" className="sr-only">Tên phòng ban</Label>
          <Input
            id="unit-name"
            placeholder="Tên phòng ban (VD: Kinh doanh, Marketing, IT...)"
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <Button onClick={handleAdd} disabled={!newUnitName.trim() || addUnit.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm
        </Button>
      </div>

      {/* List of units */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : orgUnits && orgUnits.length > 0 ? (
          orgUnits.map((unit) => (
            <Card key={unit.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{unit.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteUnit.mutate(unit.id)}
                  disabled={deleteUnit.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Chưa có phòng ban nào</p>
            <p className="text-sm">Thêm phòng ban đầu tiên ở trên</p>
          </div>
        )}
      </div>
    </div>
  );
}
