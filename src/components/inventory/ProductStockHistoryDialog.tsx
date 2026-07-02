import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { getLocalInventoryTransactions } from "@/lib/localInventoryStore";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { Loader2, History, ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductStockHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    sku: string;
  } | null;
}

export function ProductStockHistoryDialog({
  open,
  onOpenChange,
  product,
}: ProductStockHistoryDialogProps) {
  const { companyId } = useCompanyContext();

  const { data: transactions = [], isLoading } = useQuery<any[]>({
    queryKey: ["product-inventory-transactions", product?.id],
    queryFn: async () => {
      if (!product) return [];
      
      if (isLocalDemoAuthEnabled()) {
        if (!companyId) return [];
        const allLocal = getLocalInventoryTransactions(companyId);
        return allLocal
          .filter((tx: any) => tx.product_id === product.id)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      // Online logic (Supabase)
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select("*")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!product,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-lg text-foreground">
            <History className="h-5 w-5 text-primary" />
            Biến động kho sản phẩm
          </DialogTitle>
          <DialogDescription className="text-xs">
            Lịch sử nhập, xuất, và biến động kho chi tiết của sản phẩm: <span className="font-semibold text-foreground">{product?.name}</span> (SKU: {product?.sku})
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Đang tải lịch sử giao dịch...</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden mt-2 bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border text-muted-foreground font-semibold">
                    <th className="p-3">Loại</th>
                    <th className="p-3">Số lượng</th>
                    <th className="p-3">Ghi chú / Chi tiết giao dịch</th>
                    <th className="p-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                        Chưa có lịch sử giao dịch biến động kho nào cho sản phẩm này.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isIncoming = tx.quantity > 0;
                      return (
                        <tr key={tx.id} className="border-b border-border hover:bg-secondary/10 transition-colors">
                          <td className="p-3 align-middle">
                            <Badge
                              variant="outline"
                              className={cn(
                                "status-badge text-[10px] font-medium flex items-center w-fit gap-1",
                                isIncoming
                                  ? "bg-success/10 text-success border-success/20"
                                  : "bg-destructive/10 text-destructive border-destructive/20"
                              )}
                            >
                              {isIncoming ? (
                                <>
                                  <ArrowDownLeft className="h-3 w-3" />
                                  Nhập kho
                                </>
                              ) : (
                                <>
                                  <ArrowUpRight className="h-3 w-3" />
                                  Xuất kho
                                </>
                              )}
                            </Badge>
                          </td>
                          <td className="p-3 align-middle font-mono font-bold text-foreground">
                            {isIncoming ? "+" : ""}
                            {tx.quantity}
                          </td>
                          <td className="p-3 align-middle text-muted-foreground max-w-xs break-words">
                            {tx.notes || (
                              <span className="text-gray-400 italic">Không có ghi chú</span>
                            )}
                          </td>
                          <td className="p-3 align-middle text-muted-foreground font-mono">
                            {tx.created_at
                              ? new Date(tx.created_at).toLocaleString("vi-VN")
                              : "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
