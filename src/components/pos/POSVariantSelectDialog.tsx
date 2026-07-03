import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Layers } from "lucide-react";
import { calculateCompositeVariantStock } from "@/lib/wholesaleControl";

interface POSVariantSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  variants: any[];
  allComponents: any[];
  allVariants: any[];
  onSelect: (variant: any) => void;
}

export function POSVariantSelectDialog({
  open,
  onOpenChange,
  product,
  variants,
  allComponents,
  allVariants,
  onSelect
}: POSVariantSelectDialogProps) {
  if (!product) return null;

  const handleSelect = (variant: any) => {
    onSelect(variant);
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-bold truncate">
            Chọn mẫu mã - {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 p-1">
          {variants.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Không có mẫu mã nào khả dụng cho sản phẩm này.
            </p>
          ) : (
            variants.map((v) => {
              // Calculate composite variant stock
              const actualStock = calculateCompositeVariantStock(v, allComponents, allVariants);
              const isOutOfStock = actualStock <= 0;
              const hasComponents = allComponents.some(c => c.parent_variant_id === v.id);

              return (
                <Card 
                  key={v.id} 
                  className={`hover:border-primary transition-colors cursor-pointer ${isOutOfStock ? "opacity-60 cursor-not-allowed" : ""}`}
                  onClick={() => !isOutOfStock && handleSelect(v)}
                >
                  <CardContent className="p-3 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs truncate">{v.name}</span>
                        {hasComponents && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700">
                            Set/Combo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                        <span>SKU: {v.sku}</span>
                        <span>•</span>
                        <span>
                          Tồn khả dụng: {" "}
                          <span className={`font-semibold ${isOutOfStock ? "text-destructive" : "text-foreground"}`}>
                            {actualStock}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        {Object.entries(v.attributes || {}).map(([key, val]) => (
                          <Badge key={key} variant="outline" className="text-[8px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200">
                            {key}: {val as string}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <p className="text-xs font-bold text-foreground">{formatCurrency(v.selling_price || 0)}</p>
                      <Button 
                        size="sm" 
                        className="h-7 text-[10px] px-2 gap-1" 
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(v);
                        }}
                      >
                        <ShoppingCart className="h-3 w-3" /> Chọn
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-3 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
