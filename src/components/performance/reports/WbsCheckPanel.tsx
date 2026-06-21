import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Link2,
  ExternalLink,
} from "lucide-react";
import { ClassificationResult, ClassifiedItem } from "@/hooks/useReportClassifier";

interface WbsCheckPanelProps {
  result: ClassificationResult;
  onAcceptSuggestion: (item: string, directiveId: string) => void;
  isAccepting: boolean;
}

export function WbsCheckPanel({ result, onAcceptSuggestion, isAccepting }: WbsCheckPanelProps) {
  const { matched, unmatched, stats } = result;

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Kết quả kiểm tra WBS
          </CardTitle>
          <Badge variant={stats.coverage_rate >= 80 ? "default" : stats.coverage_rate >= 50 ? "secondary" : "destructive"}>
            {stats.coverage_rate}% trong WBS
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded text-center">
            <p className="text-muted-foreground">Trong WBS</p>
            <p className="font-bold text-green-600">{stats.matched_count}</p>
          </div>
          <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded text-center">
            <p className="text-muted-foreground">Ngoài WBS</p>
            <p className="font-bold text-orange-600">{stats.unmatched_count}</p>
          </div>
          <div className="p-2 bg-muted rounded text-center">
            <p className="text-muted-foreground">Tỷ lệ</p>
            <p className="font-bold">{stats.coverage_rate}%</p>
          </div>
        </div>

        {/* Matched items */}
        {matched.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              Đã khớp WBS ({matched.length})
            </h4>
            <div className="space-y-1">
              {matched.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span>{item.report_item}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {Math.round(item.confidence * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unmatched items */}
        {unmatched.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
              Ngoài WBS ({unmatched.length})
            </h4>
            <div className="space-y-2">
              {unmatched.map((item, idx) => (
                <div key={idx} className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded text-sm space-y-1">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <span>{item.report_item}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                    </div>
                  </div>
                  {item.suggested_directive_id && (
                    <div className="flex items-center gap-2 ml-5">
                      <span className="text-xs text-muted-foreground">Gợi ý:</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.suggested_directive_title || "Chỉ thị"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs gap-1"
                        onClick={() => onAcceptSuggestion(item.report_item, item.suggested_directive_id!)}
                        disabled={isAccepting}
                      >
                        <Link2 className="h-3 w-3" />
                        Gán
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
