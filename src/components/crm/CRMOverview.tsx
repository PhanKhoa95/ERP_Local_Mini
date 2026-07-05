import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Coins, CalendarDays, AlertTriangle, Play, Sparkles, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

interface CRMOverviewProps {
  leads: any[];
  deals: any[];
  appointments: any[];
  tickets: any[];
  tasks: any[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function CRMOverview({ leads, deals, appointments, tickets, tasks }: CRMOverviewProps) {
  // Aggregate Metrics
  const totalLeads = leads.length;
  const activeDeals = deals.filter(d => d.stage !== "won" && d.stage !== "lost");
  const totalDealValue = activeDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
  const pendingApts = appointments.filter(a => a.status === "scheduled").length;
  const activeTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;

  // Chart 1: Lead Sources
  const sourceCounts = leads.reduce((acc: Record<string, number>, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {});

  const sourceData = Object.entries(sourceCounts).map(([key, val]) => ({
    name: key.toUpperCase(),
    value: val
  }));

  // Chart 2: Deals by Stage
  const stageLabels: Record<string, string> = {
    new: "Mới tạo",
    consulting: "Tư vấn",
    quote: "Báo giá",
    negotiating: "Thương lượng",
    won: "Chốt thành công",
    lost: "Thất bại"
  };

  const stageCounts = deals.reduce((acc: Record<string, number>, d) => {
    acc[d.stage] = (acc[d.stage] || 0) + 1;
    return acc;
  }, {});

  const stageData = Object.entries(stageLabels).map(([stage, label]) => ({
    name: label,
    count: stageCounts[stage] || 0
  }));

  return (
    <div className="space-y-6">
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Khách tiềm năng (Leads)</CardTitle>
            <div className="h-8 w-8 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center">
              <Users className="h-4.5 w-4.5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{totalLeads}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Từ các nguồn quảng cáo & Fanpage</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Giá trị phễu cơ hội (Deals)</CardTitle>
            <div className="h-8 w-8 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-center justify-center">
              <Coins className="h-4.5 w-4.5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {totalDealValue.toLocaleString("vi-VN")}đ
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{activeDeals.length} cơ hội bán hàng đang chăm sóc</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Lịch hẹn sắp diễn ra</CardTitle>
            <div className="h-8 w-8 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center">
              <CalendarDays className="h-4.5 w-4.5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{pendingApts}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Lịch demo sản phẩm & gọi điện</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Sự cố cần giải quyết</CardTitle>
            <div className="h-8 w-8 bg-rose-50 dark:bg-rose-950/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{activeTickets}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Khiếu nại/bảo hành chưa xử lý xong</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Kanban pipeline graph */}
        <Card className="lg:col-span-8 border border-border/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-500" /> Phân tích Phễu Cơ hội bán hàng (Deals Pipeline)
            </CardTitle>
            <CardDescription className="text-xs">Số lượng cơ hội bán hàng phân bổ theo từng giai đoạn tư vấn</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Sources Pie Chart */}
        <Card className="lg:col-span-4 border border-border/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-blue-500" /> Nguồn khách tiềm năng
            </CardTitle>
            <CardDescription className="text-xs">Tỷ lệ lead thu thập được phân theo kênh quảng cáo</CardDescription>
          </CardHeader>
          <CardContent className="h-[220px] flex items-center justify-center">
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={8} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs italic text-muted-foreground">Chưa có dữ liệu nguồn lead</div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
