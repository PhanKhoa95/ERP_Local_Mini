import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users, TrendingUp, AlertTriangle, UserMinus, Sparkles, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { cn } from "@/lib/utils";

interface RFMSegment {
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  description: string;
  action: string;
  partners: any[];
}

const SEGMENT_COLORS = [
  "hsl(var(--success))",
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

export function CustomerInsights() {
  const { companyId } = useCompanyContext();

  const { data: rfmData, isLoading } = useQuery({
    queryKey: ["customer-rfm", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      // Get partners with their orders
      const { data: partners } = await supabase
        .from("partners")
        .select("id, name, code, total_spent, loyalty_points")
        .eq("company_id", companyId)
        .in("partner_type", ["customer", "both"]);

      if (!partners?.length) return { segments: [], total: 0 };

      const partnerIds = partners.map(p => p.id);
      const { data: orders } = await supabase
        .from("orders")
        .select("partner_id, order_date, total, status")
        .in("partner_id", partnerIds)
        .neq("status", "cancelled");

      // Calculate RFM per partner
      const now = new Date();
      const partnerRFM = partners.map(partner => {
        const partnerOrders = (orders || []).filter(o => o.partner_id === partner.id);
        const deliveredOrders = partnerOrders.filter(o => o.status === "delivered");

        const lastOrderDate = partnerOrders.length > 0
          ? new Date(partnerOrders.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())[0].order_date)
          : null;

        const recency = lastOrderDate ? Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;
        // B2 fix: Use delivered orders count for frequency consistency with monetary
        const frequency = deliveredOrders.length;
        const monetary = deliveredOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);

        return { ...partner, recency, frequency, monetary };
      });

      // B1 fix: Use true percentile scoring instead of indexOf
      const score = (arr: number[], val: number, invert = false) => {
        if (arr.length <= 1) return 3;
        const countBelow = arr.filter(v => v <= val).length;
        const pct = countBelow / arr.length;
        const s = Math.ceil((invert ? 1 - pct : pct) * 5) || 1;
        return Math.min(5, Math.max(1, s));
      };

      const recencies = partnerRFM.map(p => p.recency);
      const frequencies = partnerRFM.map(p => p.frequency);
      const monetaries = partnerRFM.map(p => p.monetary);

      const scored = partnerRFM.map(p => ({
        ...p,
        rScore: score(recencies, p.recency, true), // lower recency = higher score
        fScore: score(frequencies, p.frequency),
        mScore: score(monetaries, p.monetary),
      }));

      // Segment
      const segments: RFMSegment[] = [
        { name: "Champions", icon: Sparkles, color: "text-success", bgColor: "bg-success/10", description: "Mua gần đây, thường xuyên, giá trị cao", action: "Giữ chân bằng ưu đãi VIP", partners: [] },
        { name: "Loyal", icon: TrendingUp, color: "text-primary", bgColor: "bg-primary/10", description: "Mua thường xuyên, tổng chi tiêu tốt", action: "Upsell sản phẩm cao cấp", partners: [] },
        { name: "Potential", icon: Users, color: "text-info", bgColor: "bg-info/10", description: "Khách mới hoặc có tiềm năng", action: "Nurture bằng email/khuyến mãi", partners: [] },
        { name: "At Risk", icon: AlertTriangle, color: "text-warning", bgColor: "bg-warning/10", description: "Từng mua nhiều nhưng lâu không quay lại", action: "Gửi ưu đãi win-back", partners: [] },
        { name: "Lost", icon: UserMinus, color: "text-destructive", bgColor: "bg-destructive/10", description: "Lâu không mua, giá trị thấp", action: "Chiến dịch tái kích hoạt", partners: [] },
      ];

      scored.forEach(p => {
        const avg = (p.rScore + p.fScore + p.mScore) / 3;
        if (p.rScore >= 4 && p.fScore >= 4 && p.mScore >= 4) segments[0].partners.push(p);
        else if (p.fScore >= 3 && p.mScore >= 3) segments[1].partners.push(p);
        else if (avg >= 3 || (p.rScore >= 4 && p.fScore <= 2)) segments[2].partners.push(p);
        else if (p.rScore <= 2 && p.fScore >= 3) segments[3].partners.push(p);
        else segments[4].partners.push(p);
      });

      return { segments, total: scored.length };
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!rfmData || rfmData.total === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-8 w-8 text-muted-foreground opacity-40 mb-3" />
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu khách hàng để phân tích</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = rfmData.segments
    .filter(s => s.partners.length > 0)
    .map((s, i) => ({ name: s.name, value: s.partners.length, color: SEGMENT_COLORS[i] }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Chart + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phân bố khách hàng RFM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tổng quan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rfmData.segments.map((seg, i) => {
              const Icon = seg.icon;
              return (
                <div key={seg.name} className={cn("flex items-center justify-between p-3 rounded-lg", seg.bgColor)}>
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5", seg.color)} />
                    <div>
                      <p className={cn("font-medium text-sm", seg.color)}>{seg.name}</p>
                      <p className="text-xs text-muted-foreground">{seg.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold">
                    {seg.partners.length}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Segments detail */}
      {rfmData.segments.filter(s => s.partners.length > 0).map(seg => {
        const Icon = seg.icon;
        return (
          <Card key={seg.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className={cn("h-5 w-5", seg.color)} />
                  {seg.name} ({seg.partners.length})
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {seg.action}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Khách hàng</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Lần mua cuối</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Số đơn</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Tổng chi tiêu</th>
                  </tr>
                </thead>
                <tbody>
                  {seg.partners.slice(0, 5).map((p: any) => (
                    <tr key={p.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="p-3">
                        <p className="font-medium text-sm text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.code}</p>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {p.recency < 999 ? `${p.recency} ngày trước` : "Chưa mua"}
                      </td>
                      <td className="p-3 text-sm font-medium text-foreground">{p.frequency}</td>
                      <td className="p-3 text-sm font-semibold text-foreground">
                        {p.monetary.toLocaleString("vi-VN")}đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {seg.partners.length > 5 && (
                <p className="text-xs text-muted-foreground p-3">
                  và {seg.partners.length - 5} khách hàng khác...
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
