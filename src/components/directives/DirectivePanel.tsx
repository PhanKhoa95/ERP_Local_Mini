import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useDirectives, Directive } from "@/hooks/useDirectives";
import {
  Bot, Send, Loader2, FileText, ArrowRight, CheckCircle2, Clock,
  AlertTriangle, Zap, ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Nháp", color: "bg-muted text-muted-foreground", icon: FileText },
  dispatched: { label: "Đã phân phối", color: "bg-primary/10 text-primary", icon: Send },
  in_progress: { label: "Đang thực hiện", color: "bg-warning/10 text-warning", icon: Clock },
  completed: { label: "Hoàn thành", color: "bg-success/10 text-success", icon: CheckCircle2 },
};

export function DirectivePanel() {
  const {
    directives, isLoading, stats,
    transcribeToTasks, dispatchDirective, breakdownWbs,
  } = useDirectives();

  const [inputText, setInputText] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [wbsOpen, setWbsOpen] = useState(false);
  const [wbsDirectiveId, setWbsDirectiveId] = useState("");
  const [wbsSuggestions, setWbsSuggestions] = useState("");

  const handleTranscribe = async () => {
    if (!inputText.trim()) return;
    const result = await transcribeToTasks.mutateAsync(inputText);
    setPreviewData(result);
    setPreviewOpen(true);
    setInputText("");
  };

  const handleDispatch = async () => {
    if (!previewData?.directive?.id) return;
    await dispatchDirective.mutateAsync(previewData.directive.id);
    setPreviewOpen(false);
    setPreviewData(null);
  };

  const handleWbs = async () => {
    if (!wbsDirectiveId) return;
    await breakdownWbs.mutateAsync({ directiveId: wbsDirectiveId, suggestions: wbsSuggestions });
    setWbsOpen(false);
    setWbsSuggestions("");
  };

  return (
    <div className="space-y-4">
      {/* Link to full dashboard */}
      <div className="flex justify-end">
        <Link to="/directive-dashboard" className="text-sm text-primary hover:underline flex items-center gap-1">
          Xem Dashboard chi tiết →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng chỉ thị", value: stats.total, icon: FileText },
          { label: "Chờ phân phối", value: stats.draft, icon: Clock },
          { label: "Đang thực hiện", value: stats.inProgress, icon: Zap },
          { label: "Hoàn thành", value: stats.completed, icon: CheckCircle2 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            AI Bóc tách chỉ thị
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Dán nội dung biên bản họp, tờ trình, hoặc chỉ thị ở đây... AI sẽ tự động bóc tách công việc."
            rows={5}
            className="resize-none"
          />
          <Button
            onClick={handleTranscribe}
            disabled={!inputText.trim() || transcribeToTasks.isPending}
            className="gap-2"
          >
            {transcribeToTasks.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            {transcribeToTasks.isPending ? "Đang phân tích..." : "AI Bóc tách"}
          </Button>
        </CardContent>
      </Card>

      {/* Directives List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Danh sách chỉ thị</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !directives?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Chưa có chỉ thị nào</p>
            </div>
          ) : (
            <div className="space-y-2">
              {directives.map((d: Directive) => {
                const config = statusConfig[d.status] || statusConfig.draft;
                const taskCount = d.source_data?.ai_extracted?.tasks?.length || 0;
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{d.title}</span>
                        <Badge variant="outline" className={cn("text-xs shrink-0", config.color)}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ListChecks className="h-3 w-3" />
                          {taskCount} việc
                        </span>
                        {d.deadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(d.deadline).toLocaleDateString("vi-VN")}
                          </span>
                        )}
                        {d.escalation_count > 0 && (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            Nhắc {d.escalation_count} lần
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {d.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPreviewData({ directive: d, tasks: d.source_data?.ai_extracted?.tasks || [] });
                            setPreviewOpen(true);
                          }}
                          className="gap-1 text-xs"
                        >
                          <Send className="h-3 w-3" /> Phân phối
                        </Button>
                      )}
                      {d.status === "dispatched" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setWbsDirectiveId(d.id); setWbsOpen(true); }}
                          className="gap-1 text-xs"
                        >
                          <Zap className="h-3 w-3" /> Chia WBS
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Xem trước công việc bóc tách</DialogTitle>
          </DialogHeader>
          {previewData && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{previewData.directive?.title}</p>
              </div>
              {(previewData.tasks || []).map((t: any, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 border rounded-lg">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t.title}</p>
                    {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{t.priority}</Badge>
                      {t.assignee_name && (
                        <Badge variant="secondary" className="text-xs">{t.assignee_name}</Badge>
                      )}
                      {t.deadline_days && (
                        <Badge variant="outline" className="text-xs">{t.deadline_days} ngày</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Đóng</Button>
            <Button
              onClick={handleDispatch}
              disabled={dispatchDirective.isPending}
              className="gap-2"
            >
              {dispatchDirective.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Phân phối & Giao việc
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WBS Dialog */}
      <Dialog open={wbsOpen} onOpenChange={setWbsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chia nhỏ WBS (AI)</DialogTitle>
          </DialogHeader>
          <Textarea
            value={wbsSuggestions}
            onChange={(e) => setWbsSuggestions(e.target.value)}
            placeholder="Gợi ý cho AI (tuỳ chọn): chia theo nhóm, ưu tiên..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setWbsOpen(false)}>Hủy</Button>
            <Button onClick={handleWbs} disabled={breakdownWbs.isPending} className="gap-2">
              {breakdownWbs.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              AI Chia nhỏ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
