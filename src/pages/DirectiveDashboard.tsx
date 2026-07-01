import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { useDirectiveDashboard } from "@/hooks/useDirectiveDashboard";
import { useDirectives } from "@/hooks/useDirectives";
import { useGlobalDateFilter } from "@/contexts/GlobalDateFilterContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { DirectiveProgressCard } from "@/components/directives/DirectiveProgressCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Send, Clock, CheckCircle2, ListChecks, Target, AlertTriangle, TrendingUp,
  Sparkles, Loader2, Users,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

export default function DirectiveDashboard() {
  const { startDate, endDate } = useGlobalDateFilter();
  const {
    directiveStats, taskStats, directivesWithProgress,
    orgUnitMetrics, timelineData, taskStatusDistribution, isLoading,
  } = useDirectiveDashboard(startDate, endDate);

  const { transcribeToTasks, dispatchDirective, breakdownWbs } = useDirectives();
  const [inputText, setInputText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleTranscribe = () => {
    if (!inputText.trim()) return;
    transcribeToTasks.mutate(inputText, {
      onSuccess: () => setInputText(""),
    });
  };

  const filteredDirectives = directivesWithProgress.filter(d => {
    if (statusFilter === "all") return true;
    return d.status === statusFilter;
  });

  if (isLoading) {
    return (
      <MainLayout>
        <Header title="Dashboard Chỉ thị" subtitle="Đang tải..." />
        <div className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  const completionRate = taskStats.total > 0
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0;

  return (
    <MainLayout>
      <Header
        title="Dashboard Chỉ thị Lãnh đạo"
        subtitle="Theo dõi tiến độ chỉ thị, tỷ lệ hoàn thành task và hiệu suất từng cấp"
      />
      <div className="p-6 space-y-6">
        {/* AI Bóc tách chỉ thị */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Bóc tách chỉ thị
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Dán nội dung biên bản họp, email chỉ đạo, hoặc ghi chú cuộc gọi... AI sẽ tự động bóc tách thành chỉ thị và công việc."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
            />
            <Button
              onClick={handleTranscribe}
              disabled={!inputText.trim() || transcribeToTasks.isPending}
              className="gap-2"
            >
              {transcribeToTasks.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Bóc tách & Tạo chỉ thị
            </Button>
          </CardContent>
        </Card>

        {/* Row 1: Directive Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard title="Tổng chỉ thị" value={String(directiveStats.total)} icon={FileText} iconColor="text-primary" iconBgColor="bg-primary/10" />
          <StatCard title="Đã phân phối" value={String(directiveStats.dispatched)} icon={Send} iconColor="text-primary" iconBgColor="bg-primary/10" />
          <StatCard title="Đang thực hiện" value={String(directiveStats.inProgress)} icon={Clock} iconColor="text-accent-foreground" iconBgColor="bg-accent" />
          <StatCard title="Hoàn thành" value={String(directiveStats.completed)} icon={CheckCircle2} iconColor="text-success" iconBgColor="bg-success/10" />
        </div>

        {/* Row 2: Task Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard title="Tổng task" value={String(taskStats.total)} icon={ListChecks} />
          <StatCard title="Task hoàn thành" value={String(taskStats.completed)} icon={Target} iconColor="text-success" iconBgColor="bg-success/10" />
          <StatCard title="Tỷ lệ hoàn thành" value={`${completionRate}%`} icon={TrendingUp} iconColor="text-primary" iconBgColor="bg-primary/10" />
          <StatCard title="Task quá hạn" value={String(taskStats.overdue)} icon={AlertTriangle} iconColor="text-destructive" iconBgColor="bg-destructive/10" />
        </div>

        {/* Row 3: Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tiến độ 7 ngày gần nhất</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={timelineData}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="created" name="Chỉ thị mới" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Task hoàn thành" fill="hsl(var(--success, 142 71% 45%))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Phân bổ trạng thái Task</CardTitle>
            </CardHeader>
            <CardContent>
              {taskStatusDistribution.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                  Chưa có dữ liệu
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={taskStatusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {taskStatusDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 4: Org Unit Performance */}
        {orgUnitMetrics.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Hiệu suất theo phòng ban
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orgUnitMetrics.map((o) => (
                  <div key={o.org_unit_name} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-40 truncate">{o.org_unit_name}</span>
                    <div className="flex-1">
                      <Progress value={o.completion_rate} className="h-2.5" />
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right">
                      {o.completed_tasks}/{o.total_tasks} ({o.completion_rate}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Row 5: Directives with Progress — filterable & expandable */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">Chỉ thị & Phân phối công việc</CardTitle>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs h-7">Tất cả</TabsTrigger>
                  <TabsTrigger value="draft" className="text-xs h-7">Nháp</TabsTrigger>
                  <TabsTrigger value="dispatched" className="text-xs h-7">Đã phân</TabsTrigger>
                  <TabsTrigger value="in_progress" className="text-xs h-7">Đang làm</TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs h-7">Xong</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {filteredDirectives.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                {statusFilter === "all"
                  ? "Chưa có chỉ thị nào — Sử dụng form AI Bóc tách ở trên để tạo chỉ thị đầu tiên"
                  : "Không có chỉ thị nào ở trạng thái này"}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDirectives.map((d) => (
                  <DirectiveProgressCard
                    key={d.id}
                    id={d.id}
                    title={d.title}
                    status={d.status}
                    deadline={d.deadline}
                    totalTasks={d.total_tasks}
                    completedTasks={d.completed_tasks}
                    overdueTasks={d.overdue_tasks}
                    escalationCount={d.escalation_count}
                    assignedManagerName={d.assigned_manager_name}
                    tasks={d.tasks}
                    onDispatch={(id) => dispatchDirective.mutate(id)}
                    onBreakdownWbs={(id) => breakdownWbs.mutate({ directiveId: id })}
                    isDispatching={dispatchDirective.isPending}
                    isBreakingDown={breakdownWbs.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
