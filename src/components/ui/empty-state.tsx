import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Package,
  ShoppingCart,
  Users,
  FileText,
  Inbox,
  Search,
  Plus,
  type LucideIcon,
} from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "search" | "orders" | "products" | "partners" | "documents";
  className?: string;
}

const variantIcons: Record<string, LucideIcon> = {
  default: Inbox,
  search: Search,
  orders: ShoppingCart,
  products: Package,
  partners: Users,
  documents: FileText,
};

const variantColors: Record<string, string> = {
  default: "text-muted-foreground",
  search: "text-info",
  orders: "text-primary",
  products: "text-warning",
  partners: "text-success",
  documents: "text-destructive",
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const IconComponent = icon || variantIcons[variant];
  const iconColor = variantColors[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {/* Decorative background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 blur-2xl opacity-20 bg-gradient-to-br from-primary to-info rounded-full scale-150" />
        <div className={cn(
          "relative p-4 rounded-2xl bg-muted/50 border border-border/50",
          "transition-transform duration-300 hover:scale-105"
        )}>
          <IconComponent className={cn("h-12 w-12", iconColor)} strokeWidth={1.5} />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      )}

      {/* Action Button */}
      {action && (
        <Button onClick={action.onClick} className="gap-2">
          <Plus className="h-4 w-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function EmptyOrdersState({ onCreateOrder }: { onCreateOrder?: () => void }) {
  return (
    <EmptyState
      variant="orders"
      title="Chưa có đơn hàng nào"
      description="Đơn hàng sẽ xuất hiện ở đây khi bạn tạo mới hoặc nhận đơn từ các kênh bán hàng."
      action={onCreateOrder ? { label: "Tạo đơn hàng", onClick: onCreateOrder } : undefined}
    />
  );
}

export function EmptyProductsState({ onAddProduct }: { onAddProduct?: () => void }) {
  return (
    <EmptyState
      variant="products"
      title="Chưa có sản phẩm nào"
      description="Thêm sản phẩm đầu tiên để bắt đầu quản lý kho hàng và bán hàng."
      action={onAddProduct ? { label: "Thêm sản phẩm", onClick: onAddProduct } : undefined}
    />
  );
}

export function EmptyPartnersState({ onAddPartner }: { onAddPartner?: () => void }) {
  return (
    <EmptyState
      variant="partners"
      title="Chưa có đối tác nào"
      description="Thêm khách hàng hoặc nhà cung cấp để quản lý quan hệ đối tác."
      action={onAddPartner ? { label: "Thêm đối tác", onClick: onAddPartner } : undefined}
    />
  );
}

export function EmptySearchState({ searchTerm }: { searchTerm?: string }) {
  return (
    <EmptyState
      variant="search"
      title="Không tìm thấy kết quả"
      description={
        searchTerm
          ? `Không có kết quả phù hợp với "${searchTerm}". Thử thay đổi từ khóa tìm kiếm.`
          : "Không tìm thấy kết quả phù hợp với bộ lọc hiện tại."
      }
    />
  );
}

export function EmptyDocumentsState() {
  return (
    <EmptyState
      variant="documents"
      title="Chưa có dữ liệu"
      description="Dữ liệu sẽ xuất hiện ở đây khi có giao dịch hoặc hoạt động."
    />
  );
}
