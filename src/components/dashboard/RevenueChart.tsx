import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { startOfMonth, subMonths, format } from "date-fns";

export function RevenueChart() {
  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ["revenue-by-channel-chart"],
    queryFn: async () => {
      const sixMonthsAgo = subMonths(new Date(), 5);
      
      const [channelsRes, ordersRes] = await Promise.all([
        supabase.from("sales_channels").select("*"),
        supabase
          .from("orders")
          .select("channel_id, total, status, created_at")
          .gte("created_at", startOfMonth(sixMonthsAgo).toISOString())
          .eq("status", "delivered"),
      ]);

      if (channelsRes.error) throw channelsRes.error;
      if (ordersRes.error) throw ordersRes.error;

      const channels = channelsRes.data || [];
      const orders = ordersRes.data || [];

      // Create monthly data structure
      const monthlyData: Record<string, Record<string, number>> = {};
      
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthKey = format(monthStart, "yyyy-MM");
        monthlyData[monthKey] = {};
        channels.forEach((ch) => {
          monthlyData[monthKey][ch.code] = 0;
        });
      }

      // Aggregate orders by month and channel
      orders.forEach((order) => {
        const monthKey = format(new Date(order.created_at), "yyyy-MM");
        const channel = channels.find((ch) => ch.id === order.channel_id);
        if (monthlyData[monthKey] && channel) {
          monthlyData[monthKey][channel.code] =
            (monthlyData[monthKey][channel.code] || 0) +
            (Number(order.total) || 0) / 1000000; // Convert to millions
        }
      });

      // Convert to chart format
      const data = Object.entries(monthlyData).map(([key, values]) => ({
        name: `T${new Date(key).getMonth() + 1}`,
        ...values,
      }));

      return { data, channels };
    },
  });

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Doanh thu theo kênh</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const channels = (chartData as any)?.channels || [];
  const data = (chartData as any)?.data || [];

  if (data.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Doanh thu theo kênh</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px] text-muted-foreground">
          Chưa có dữ liệu doanh thu
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Doanh thu theo kênh (triệu đồng)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {channels.map((ch: any) => (
                  <linearGradient key={ch.code} id={`gradient-${ch.code}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ch.color || "#3B82F6"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ch.color || "#3B82F6"} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value.toFixed(1)} triệu`, ""]}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
              />
              {channels.map((ch: any) => (
                <Area
                  key={ch.code}
                  type="monotone"
                  dataKey={ch.code}
                  name={ch.name}
                  stroke={ch.color || "#3B82F6"}
                  strokeWidth={2}
                  fill={`url(#gradient-${ch.code})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
