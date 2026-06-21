import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function ChannelPieChart() {
  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ["channel-revenue-pie"],
    queryFn: async () => {
      const [channelsRes, ordersRes] = await Promise.all([
        supabase.from("sales_channels").select("*"),
        supabase.from("orders").select("channel_id, total, status"),
      ]);

      if (channelsRes.error) throw channelsRes.error;
      if (ordersRes.error) throw ordersRes.error;

      const channels = channelsRes.data || [];
      const orders = ordersRes.data || [];

      const deliveredOrders = orders.filter(o => o.status === "delivered");
      const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      return channels.map(channel => {
        const channelOrders = deliveredOrders.filter(o => o.channel_id === channel.id);
        const revenue = channelOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const percentage = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0;
        return {
          name: channel.name,
          value: percentage,
          color: channel.color || "#3B82F6",
        };
      }).filter(item => item.value > 0);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tỷ lệ doanh thu</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tỷ lệ doanh thu</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          Chưa có dữ liệu doanh thu
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Tỷ lệ doanh thu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value}%`, "Tỷ lệ"]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
