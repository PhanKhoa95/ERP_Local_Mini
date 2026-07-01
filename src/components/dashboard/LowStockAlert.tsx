import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCompanyContext } from "@/hooks/useCompanyContext";

import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export function LowStockAlert() {
  const { companyId } = useCompanyContext();

  const { data: lowStockItems = [], isLoading } = useQuery({
    queryKey: ["low-stock-products", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      if (isLocalDemoAuthEnabled()) {
        const rawProducts = localStorage.getItem("erp-mini-local-demo-products");
        const products = rawProducts ? JSON.parse(rawProducts) : [];
        return products
          .filter((p: any) => p.company_id === companyId && !p.is_service && (p.stock_quantity || 0) <= (p.min_stock || 0))
          .sort((a: any, b: any) => (a.stock_quantity || 0) - (b.stock_quantity || 0))
          .slice(0, 10);
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("company_id", companyId!)
        .order("stock_quantity", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data.filter(p => (p.stock_quantity || 0) <= (p.min_stock || 0));
    },
  });


  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Cảnh báo tồn kho</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Cảnh báo tồn kho</CardTitle>
        {lowStockItems.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {lowStockItems.length}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lowStockItems.slice(0, 5).map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.sku}</p>
              </div>
              <div className="text-right ml-4">
                <p className="text-sm font-bold text-destructive">{item.stock_quantity || 0}</p>
                <p className="text-xs text-muted-foreground">/ {item.min_stock || 0}</p>
              </div>
            </div>
          ))}
          {lowStockItems.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Tất cả sản phẩm đều đủ hàng
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
