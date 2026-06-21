import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { invalidateWarehouseRelated } from "@/lib/queryInvalidation";
import { z } from "zod";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { createLocalInventoryTransaction } from "@/lib/localInventoryStore";

const transactionSchema = z.object({
  product_id: z.string().min(1, "Vui lòng chọn sản phẩm"),
  transaction_type: z.enum(["in", "out"]),
  quantity: z.number().min(1, "Số lượng phải lớn hơn 0"),
  notes: z.string().max(500).optional(),
});

interface StockTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "in" | "out";
}

export function StockTransactionDialog({
  open,
  onOpenChange,
  defaultType = "in",
}: StockTransactionDialogProps) {
  const { products } = useProducts();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    product_id: "",
    transaction_type: defaultType as "in" | "out",
    quantity: 1,
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        product_id: "",
        transaction_type: defaultType,
        quantity: 1,
        notes: "",
      });
      setErrors({});
    }
  }, [open, defaultType]);

  const selectedProduct = products.find((p) => p.id === formData.product_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      transactionSchema.parse(formData);
      setErrors({});
      setIsLoading(true);

      // Check stock for outbound
      if (formData.transaction_type === "out" && selectedProduct) {
        if ((selectedProduct.stock_quantity || 0) < formData.quantity) {
          toast({
            variant: "destructive",
            title: "Lỗi",
            description: `Không đủ tồn kho. Chỉ còn ${selectedProduct.stock_quantity} sản phẩm.`,
          });
          setIsLoading(false);
          return;
        }
      }

      if (isLocalDemoAuthEnabled()) {
        createLocalInventoryTransaction({
          product_id: formData.product_id,
          transaction_type: formData.transaction_type,
          quantity: formData.quantity,
          notes: formData.notes || null,
        });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
        invalidateWarehouseRelated(queryClient);
        toast({
          title: formData.transaction_type === "in" ? "Nhap kho local thanh cong" : "Xuat kho local thanh cong",
        });
        onOpenChange(false);
        return;
      }

      // Create transaction
      const { error: txError } = await supabase
        .from("inventory_transactions")
        .insert({
          product_id: formData.product_id,
          transaction_type: formData.transaction_type,
          quantity:
            formData.transaction_type === "in"
              ? formData.quantity
              : -formData.quantity,
          notes: formData.notes || null,
        });

      if (txError) throw txError;

      // Update product stock atomically via RPC
      const delta = formData.transaction_type === "in" ? formData.quantity : -formData.quantity;
      const { error: rpcError } = await supabase.rpc("increment_stock_quantity", {
        p_product_id: formData.product_id,
        p_quantity: delta,
      });
      if (rpcError) throw rpcError;

      // Also update default warehouse_stock to keep in sync
      if (!selectedProduct?.company_id) throw new Error("Missing product company");

      const { data: defaultWh } = await supabase
        .from("warehouses")
        .select("id")
        .eq("company_id", selectedProduct.company_id)
        .eq("is_default", true)
        .maybeSingle();

      if (defaultWh) {
        const { data: existingWs } = await supabase
          .from("warehouse_stock")
          .select("id, quantity")
          .eq("warehouse_id", defaultWh.id)
          .eq("product_id", formData.product_id)
          .maybeSingle();

        if (existingWs) {
          await supabase
            .from("warehouse_stock")
            .update({ quantity: Math.max(0, existingWs.quantity + delta) })
            .eq("id", existingWs.id);
        } else if (formData.transaction_type === "in") {
          await supabase
            .from("warehouse_stock")
            .insert({
              warehouse_id: defaultWh.id,
              product_id: formData.product_id,
              quantity: formData.quantity,
            });
        }
      }

      invalidateWarehouseRelated(queryClient);

      toast({
        title: formData.transaction_type === "in" ? "Nhập kho thành công" : "Xuất kho thành công",
      });

      onOpenChange(false);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) fieldErrors[error.path[0] as string] = error.message;
        });
        setErrors(fieldErrors);
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: (err as Error).message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.transaction_type === "in" ? (
              <>
                <ArrowDownLeft className="h-5 w-5 text-success" />
                Nhập kho
              </>
            ) : (
              <>
                <ArrowUpRight className="h-5 w-5 text-destructive" />
                Xuất kho
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Loại giao dịch</Label>
            <Select
              value={formData.transaction_type}
              onValueChange={(value: "in" | "out") =>
                setFormData({ ...formData, transaction_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-success" />
                    Nhập kho
                  </div>
                </SelectItem>
                <SelectItem value="out">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-destructive" />
                    Xuất kho
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sản phẩm *</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) =>
                setFormData({ ...formData, product_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn sản phẩm" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center justify-between gap-4">
                      <span>
                        {product.sku} - {product.name}
                      </span>
                      <span className="text-muted-foreground">
                        (Tồn: {product.stock_quantity || 0})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.product_id && (
              <p className="text-xs text-destructive">{errors.product_id}</p>
            )}
          </div>

          {selectedProduct && (
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tồn kho hiện tại:</span>
                <span className="font-semibold text-foreground">
                  {selectedProduct.stock_quantity || 0} {selectedProduct.unit}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Sau giao dịch:</span>
                <span
                  className={`font-semibold ${
                    formData.transaction_type === "in"
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {(selectedProduct.stock_quantity || 0) +
                    (formData.transaction_type === "in"
                      ? formData.quantity
                      : -formData.quantity)}{" "}
                  {selectedProduct.unit}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Số lượng *</Label>
            <Input
              type="number"
              min={1}
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: Number(e.target.value) })
              }
            />
            {errors.quantity && (
              <p className="text-xs text-destructive">{errors.quantity}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Lý do nhập/xuất kho..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={
                formData.transaction_type === "in"
                  ? "bg-success hover:bg-success/90"
                  : "bg-destructive hover:bg-destructive/90"
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formData.transaction_type === "in" ? "Nhập kho" : "Xuất kho"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
