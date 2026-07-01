import React from "react";
import { useGlobalDateFilter, DatePreset } from "@/contexts/GlobalDateFilterContext";
import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export const GlobalDateFilterBar: React.FC = () => {
  const { startDate, endDate, activePreset, selectPreset, setCustomRange } = useGlobalDateFilter();

  const presetsList: { value: DatePreset; label: string }[] = [
    { value: "all", label: "Tất cả thời gian" },
    { value: "today", label: "Hôm nay" },
    { value: "this-month", label: "Tháng này" },
    { value: "last-30-days", label: "30 ngày qua" },
    { value: "last-90-days", label: "90 ngày qua" },
    { value: "this-year", label: "Năm nay" },
    { value: "custom", label: "Tùy chọn..." },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-1.5 border border-border rounded-lg bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Calendar className="h-4 w-4 text-primary" />
        <span>Kỳ báo cáo:</span>
      </div>

      <Select value={activePreset} onValueChange={(val) => selectPreset(val as DatePreset)}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="Chọn kỳ báo cáo" />
        </SelectTrigger>
        <SelectContent>
          {presetsList.map((p) => (
            <SelectItem key={p.value} value={p.value} className="text-xs">
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activePreset === "custom" && (
        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setCustomRange(e.target.value, endDate)}
            className="w-[125px] h-8 text-xs p-1"
          />
          <span className="text-xs text-muted-foreground">—</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setCustomRange(startDate, e.target.value)}
            className="w-[125px] h-8 text-xs p-1"
          />
        </div>
      )}

      {activePreset !== "custom" && activePreset !== "all" && startDate && endDate && (
        <div className="text-[11px] text-muted-foreground bg-muted px-2 py-1 rounded">
          {startDate} đến {endDate}
        </div>
      )}
    </div>
  );
};
