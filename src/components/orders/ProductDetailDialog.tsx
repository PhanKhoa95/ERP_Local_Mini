import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Package, Plus, Minus, MapPin, Truck, Warehouse, CheckCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Product = Tables<"products">;

interface Warehouse {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  quantity: number;
}

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  warehouses: Warehouse[];
  onAddToCart: (product: Product, quantity: number, pickupWarehouse?: Warehouse) => void;
}

export function ProductDetailDialog({ 
  open, 
  onOpenChange, 
  product, 
  warehouses,
  onAddToCart 
}: ProductDetailDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  if (!product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const availableWarehouses = warehouses.filter(w => w.quantity > 0);
  const maxQuantity = deliveryType === "pickup" && selectedWarehouse 
    ? warehouses.find(w => w.id === selectedWarehouse)?.quantity || 0
    : product.stock_quantity || 0;

  const handleAddToCart = () => {
    const pickupWarehouse = deliveryType === "pickup" && selectedWarehouse
      ? warehouses.find(w => w.id === selectedWarehouse)
      : undefined;
    onAddToCart(product, quantity, pickupWarehouse);
    setQuantity(1);
    setDeliveryType("delivery");
    setSelectedWarehouse(null);
    onOpenChange(false);
  };

  const isValid = deliveryType === "delivery" || (deliveryType === "pickup" && selectedWarehouse);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">Chi tiết sản phẩm</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Image */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h3 className="text-xl font-bold">{product.name}</h3>
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
            {product.description && (
              <p className="text-sm mt-2 text-muted-foreground">{product.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <span className="text-2xl font-bold text-primary">
                {formatPrice(product.selling_price || 0)}
              </span>
              <Badge variant="outline">
                Còn {product.stock_quantity} {product.unit}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Quantity Selector */}
          <div className="space-y-2">
            <Label>Số lượng</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-bold text-lg">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                disabled={quantity >= maxQuantity}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                (Tối đa: {maxQuantity})
              </span>
            </div>
          </div>

          <Separator />

          {/* Delivery Type */}
          <div className="space-y-3">
            <Label>Hình thức nhận hàng</Label>
            <RadioGroup 
              value={deliveryType} 
              onValueChange={(v) => {
                setDeliveryType(v as "delivery" | "pickup");
                setSelectedWarehouse(null);
                setQuantity(1);
              }}
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    <span className="font-medium">Giao hàng tận nơi</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Chúng tôi sẽ giao đến địa chỉ của bạn
                  </p>
                </Label>
              </div>
              <div className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
                <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-primary" />
                    <span className="font-medium">Nhận tại kho</span>
                    <Badge variant="secondary" className="text-xs">Tiết kiệm phí ship</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Đến kho gần nhất để nhận hàng và tiết kiệm chi phí vận chuyển
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Warehouse Selection */}
          {deliveryType === "pickup" && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> 
                Chọn kho nhận hàng
              </Label>
              {availableWarehouses.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  Không có kho nào còn hàng. Vui lòng chọn giao hàng tận nơi.
                </p>
              ) : (
                <div className="space-y-2">
                  {availableWarehouses.map((warehouse) => (
                    <div
                      key={warehouse.id}
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer transition-all",
                        selectedWarehouse === warehouse.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => {
                        setSelectedWarehouse(warehouse.id);
                        setQuantity(Math.min(quantity, warehouse.quantity));
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Warehouse className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{warehouse.name}</span>
                            {selectedWarehouse === warehouse.id && (
                              <CheckCircle className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          {warehouse.address && (
                            <p className="text-sm text-muted-foreground mt-1 ml-6">
                              {warehouse.address}
                            </p>
                          )}
                          {warehouse.phone && (
                            <p className="text-sm text-muted-foreground ml-6">
                              ĐT: {warehouse.phone}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-2">
                          Còn {warehouse.quantity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Tạm tính:</span>
            <span className="text-primary">
              {formatPrice((product.selling_price || 0) * quantity)}
            </span>
          </div>

          {/* Add to Cart Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleAddToCart}
            disabled={!isValid || quantity <= 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm vào giỏ hàng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
