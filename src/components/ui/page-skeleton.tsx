import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <Skeleton className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 lg:h-4 w-20" />
                <Skeleton className="h-6 lg:h-8 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] lg:h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] lg:h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-4 lg:space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Orders Kanban Skeleton
export function OrdersKanbanSkeleton() {
  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex lg:grid lg:grid-cols-5 gap-4 min-w-max lg:min-w-0">
        {[...Array(5)].map((_, colIdx) => (
          <div key={colIdx} className="w-[260px] sm:w-[280px] lg:w-auto flex-shrink-0 lg:flex-shrink">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-8 ml-auto rounded-full" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, cardIdx) => (
                <Card key={cardIdx}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-16 rounded" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Orders List Skeleton
export function OrdersListSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                {["Mã đơn", "Khách hàng", "Kênh", "Sản phẩm", "Tổng tiền", "Trạng thái", "Ngày", ""].map((_, i) => (
                  <th key={i} className="p-3 sm:p-4">
                    <Skeleton className="h-4 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(8)].map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b border-border">
                  <td className="p-3 sm:p-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-3 sm:p-4">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </td>
                  <td className="p-3 sm:p-4"><Skeleton className="h-5 w-16 rounded" /></td>
                  <td className="p-3 sm:p-4"><Skeleton className="h-4 w-12" /></td>
                  <td className="p-3 sm:p-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-3 sm:p-4"><Skeleton className="h-7 w-24 rounded" /></td>
                  <td className="p-3 sm:p-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-3 sm:p-4"><Skeleton className="h-8 w-8 rounded" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Inventory Table Skeleton
export function InventoryTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-border">
              {["SKU", "Sản phẩm", "Danh mục", "Giá nhập", "Giá bán", "Tồn kho", "Trạng thái", "Thao tác"].map((_, i) => (
                <th key={i} className="p-3 sm:p-4">
                  <Skeleton className="h-4 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, rowIdx) => (
              <tr key={rowIdx} className="border-b border-border">
                <td className="p-3 sm:p-4"><Skeleton className="h-4 w-20" /></td>
                <td className="p-3 sm:p-4"><Skeleton className="h-4 w-32" /></td>
                <td className="p-3 sm:p-4"><Skeleton className="h-4 w-20" /></td>
                <td className="p-3 sm:p-4"><Skeleton className="h-4 w-20" /></td>
                <td className="p-3 sm:p-4"><Skeleton className="h-4 w-20" /></td>
                <td className="p-3 sm:p-4"><Skeleton className="h-4 w-16" /></td>
                <td className="p-3 sm:p-4"><Skeleton className="h-6 w-16 rounded" /></td>
                <td className="p-3 sm:p-4">
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// Stats Cards Skeleton
export function StatsCardsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Report Chart Skeleton
export function ReportChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

// Table Skeleton Generic
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {[...Array(cols)].map((_, i) => (
                <th key={i} className="p-3 sm:p-4">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(rows)].map((_, rowIdx) => (
              <tr key={rowIdx} className="border-b border-border">
                {[...Array(cols)].map((_, colIdx) => (
                  <td key={colIdx} className="p-3 sm:p-4">
                    <Skeleton className="h-4 w-full max-w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
