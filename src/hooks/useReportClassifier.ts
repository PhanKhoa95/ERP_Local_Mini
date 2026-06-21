import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePerformanceEmployee } from "./usePerformanceEmployee";
import { toast } from "sonner";

export interface ClassifiedItem {
  report_item: string;
  report_index: number;
  directive_id?: string | null;
  task_id?: string | null;
  suggested_directive_id?: string | null;
  suggested_directive_title?: string | null;
  confidence: number;
  reason: string;
}

export interface ClassificationResult {
  matched: ClassifiedItem[];
  unmatched: ClassifiedItem[];
  stats: {
    matched_count: number;
    unmatched_count: number;
    coverage_rate: number;
  };
}

export function useReportClassifier() {
  const { employee } = usePerformanceEmployee();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const classify = useMutation({
    mutationFn: async (reportTasks: any[]) => {
      if (!employee?.id) throw new Error("No employee");

      const { data, error } = await supabase.functions.invoke("ai-report-classifier", {
        body: { report_tasks: reportTasks, employee_id: employee.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as ClassificationResult;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.stats.unmatched_count === 0) {
        toast.success("Tất cả công việc đều nằm trong WBS!");
      } else {
        toast.info(`${data.stats.unmatched_count} việc ngoài WBS, ${data.stats.matched_count} việc trong WBS`);
      }
    },
    onError: (error: any) => {
      if (error?.message?.includes("Rate limit")) {
        toast.error("Quá nhiều yêu cầu, vui lòng thử lại sau");
      } else if (error?.message?.includes("Payment")) {
        toast.error("Cần nạp thêm credits để sử dụng AI");
      } else {
        toast.error("Lỗi phân loại: " + (error?.message || "Unknown"));
      }
    },
  });

  const acceptSuggestion = useMutation({
    mutationFn: async ({
      reportItem,
      directiveId,
    }: {
      reportItem: string;
      directiveId: string;
    }) => {
      if (!employee?.id || !employee?.company_id) throw new Error("No employee");

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          company_id: employee.company_id,
          title: reportItem,
          directive_id: directiveId,
          assigned_to: employee.id,
          assigned_by: employee.user_id,
          source_type: "report",
          status: "done",
          org_unit_id: employee.org_unit_id,
          priority: "normal",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directive-dashboard-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks-stats"] });
      toast.success("Đã tạo task và gán vào chỉ thị");
    },
    onError: (error) => {
      toast.error("Lỗi tạo task: " + error.message);
    },
  });

  const clearResult = () => setResult(null);

  return {
    result,
    classify,
    acceptSuggestion,
    clearResult,
    isClassifying: classify.isPending,
  };
}
