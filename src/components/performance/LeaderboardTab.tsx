import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Crown, Zap, Download } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { EmptyLeaderboardState } from "./empty-states/EmptyLeaderboardState";
import { exportToExcel } from "@/lib/exportExcel";
import { toast } from "sonner";

export function LeaderboardTab() {
  const { leaderboard, currentUserRank, isLoading } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
                <div className="h-6 w-16 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return <EmptyLeaderboardState />;
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-warning" />;
      case 2:
        return <Medal className="h-6 w-6 text-muted-foreground" />;
      case 3:
        return <Medal className="h-6 w-6 text-warning/70" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-success" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const handleExport = () => {
    if (!leaderboard?.length) return;
    exportToExcel(
      leaderboard.map(e => ({
        rank: e.rank,
        name: e.name || "Ẩn danh",
        title: e.title || "",
        xp: e.xp,
        change: e.change > 0 ? `+${e.change}` : e.change === 0 ? "—" : `${e.change}`,
      })),
      [
        { key: "rank", header: "Hạng", width: 8 },
        { key: "name", header: "Nhân viên", width: 25 },
        { key: "title", header: "Chức danh", width: 20 },
        { key: "xp", header: "XP", width: 10 },
        { key: "change", header: "Thay đổi", width: 10 },
      ],
      "Bang_xep_hang"
    );
    toast.success("Đã xuất bảng xếp hạng");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bảng xếp hạng</h2>
          <p className="text-muted-foreground">
            Xếp hạng dựa trên tổng XP tích lũy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Xuất Excel
          </Button>
          {currentUserRank && (
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Trophy className="h-4 w-4 mr-2" />
              Xếp hạng của bạn: #{currentUserRank}
            </Badge>
          )}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {leaderboard.slice(0, 3).map((entry, index) => {
          const rank = index + 1;
          const heights = ["h-32", "h-24", "h-20"];
          const orders = ["order-2", "order-1", "order-3"];
          
          return (
            <Card
              key={entry.employee_id}
              className={`${orders[index]} flex flex-col items-center justify-end p-4 ${
                rank === 1 ? "bg-gradient-to-t from-warning/10 to-transparent" : ""
              }`}
            >
              <div className="mb-2">{getRankIcon(rank)}</div>
              <Avatar className="h-12 w-12 mb-2">
                <AvatarFallback>
                  {entry.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold text-sm text-center truncate max-w-full">
                {entry.name || "Ẩn danh"}
              </p>
              <Badge className="mt-1">
                <Zap className="h-3 w-3 mr-1" />
                {entry.xp.toLocaleString()} XP
              </Badge>
              <div className={`w-full ${heights[index]} bg-primary/10 rounded-t-lg mt-2`} />
            </Card>
          );
        })}
      </div>

      {/* Rest of leaderboard */}
      <div className="space-y-2">
        {leaderboard.slice(3).map((entry, index) => (
          <Card key={entry.employee_id} className="hover:shadow-sm transition-shadow">
            <CardContent className="py-3">
              <div className="flex items-center gap-4">
                <div className="w-8 text-center">
                  {getRankIcon(index + 4)}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {entry.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{entry.name || "Ẩn danh"}</p>
                  <p className="text-sm text-muted-foreground">{entry.title || "Nhân viên"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(entry.change || 0)}
                  <Badge variant="secondary">
                    <Zap className="h-3 w-3 mr-1" />
                    {entry.xp.toLocaleString()} XP
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
