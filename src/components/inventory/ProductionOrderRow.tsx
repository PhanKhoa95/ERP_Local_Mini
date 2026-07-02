import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProductBom } from "@/hooks/useProductBom";
import { 
  ChevronDown, 
  ChevronRight, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Activity 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductionOrderRowProps {
  po: any;
  statusConfig: Record<string, { label: string; color: string; icon: any }>;
  nextStatus: string | null;
  onUpdateStatus: (id: string, status: string) => void;
  onEdit: (po: any) => void;
  isPending: boolean;
}

export function ProductionOrderRow({
  po,
  statusConfig,
  nextStatus,
  onUpdateStatus,
  onEdit,
  isPending,
}: ProductionOrderRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { checkMaterialAvailability, bomItems } = useProductBom(po.product_id);

  const materialsStatus = po.status !== "completed" && po.status !== "cancelled" && po.quantity > 0
    ? checkMaterialAvailability(po.quantity)
    : [];

  const hasBom = bomItems.length > 0;
  const isMissingMaterials = materialsStatus.some((m) => !m.isAvailable);

  const config = statusConfig[po.status] || statusConfig.draft;
  const StatusIcon = config.icon;

  // Timeline Step calculation (4 Steps)
  const getStepStatus = (step: "created" | "materials" | "in_progress" | "end") => {
    if (step === "created") {
      return { isActive: true, time: po.created_at, label: "Đã tạo lệnh" };
    }
    if (step === "materials") {
      if (po.status === "completed" || po.status === "in_progress") {
        return { isActive: true, status: "success", label: "Đã cấp vật tư" };
      }
      if (po.status === "cancelled") {
        return { isActive: true, status: "error", label: "Đã hủy" };
      }
      // Draft state
      if (!hasBom) {
        return { isActive: true, status: "success", label: "Không yêu cầu BOM" };
      }
      if (isMissingMaterials) {
        return { isActive: true, status: "warning", label: "Thiếu vật tư (Cần bổ sung)" };
      }
      return { isActive: true, status: "success", label: "Đủ vật tư (Sẵn sàng)" };
    }
    if (step === "in_progress") {
      const active = po.actual_start || po.status === "in_progress" || po.status === "completed";
      return { 
        isActive: !!active, 
        time: po.actual_start || null, 
        label: active ? "Đang sản xuất" : "Chờ sản xuất" 
      };
    }
    if (step === "end") {
      if (po.status === "completed") {
        return { isActive: true, isError: false, time: po.actual_end || po.updated_at, label: "Hoàn thành" };
      }
      if (po.status === "cancelled") {
        return { isActive: true, isError: true, time: po.updated_at, label: "Đã hủy" };
      }
      return { isActive: false, isError: false, time: null, label: "Chờ hoàn thành" };
    }
    return { isActive: false, time: null, label: "" };
  };

  const step1 = getStepStatus("created");
  const step2 = getStepStatus("materials");
  const step3 = getStepStatus("in_progress");
  const step4 = getStepStatus("end");

  return (
    <>
      {/* Main Row */}
      <tr className="border-b border-border/60 hover:bg-secondary/15 transition-colors">
        <td className="p-3 align-middle text-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-primary" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </td>
        <td className="p-3 align-middle">
          <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
            {po.production_number}
          </span>
        </td>
        <td className="p-3 align-middle">
          <div>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="font-bold text-xs text-foreground text-left hover:text-primary hover:underline"
            >
              {po.products?.name || "N/A"}
            </button>
            <p className="text-[10px] text-muted-foreground">SKU: {po.products?.sku || "N/A"}</p>
          </div>
        </td>
        <td className="p-3 align-middle font-mono font-bold text-xs text-right">
          {po.quantity} <span className="text-[10px] text-muted-foreground font-normal">{(po.products?.unit || "cái").toLowerCase()}</span>
        </td>
        <td className="p-3 align-middle text-center">
          <Badge className={cn("text-[9px] font-semibold py-0.5 px-2 rounded-full border shadow-none", config.color)}>
            <StatusIcon className="h-2.5 w-2.5 mr-1" />
            {config.label}
          </Badge>
        </td>
        <td className="p-3 align-middle text-center">
          {hasBom ? (
            po.status === "completed" || po.status === "cancelled" ? (
              <span className="text-[10px] text-muted-foreground italic">-</span>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] py-0 px-2 font-medium shadow-none border",
                  isMissingMaterials
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-success/10 text-success border-success/20"
                )}
              >
                {isMissingMaterials ? "Thiếu vật tư" : "Đủ vật tư"}
              </Badge>
            )
          ) : (
            <span className="text-[10px] text-gray-400 italic">Không có BOM</span>
          )}
        </td>
        <td className="p-3 align-middle text-muted-foreground max-w-[150px] truncate text-[11px]">
          {po.notes || <span className="text-gray-300 italic">Không có</span>}
        </td>
        <td className="p-3 align-middle text-muted-foreground font-mono text-[10px] text-center">
          {po.created_at ? new Date(po.created_at).toLocaleDateString("vi-VN") : "-"}
        </td>
        <td className="p-3 align-middle text-right">
          <div className="flex items-center justify-end gap-1.5">
            {nextStatus && (
              <Button
                size="sm"
                className={cn(
                  "h-7 text-[10px] font-semibold px-2.5 shadow-none",
                  nextStatus === "in_progress"
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-success hover:bg-success/90 text-success-foreground"
                )}
                onClick={() => onUpdateStatus(po.id, nextStatus)}
                disabled={isPending}
              >
                {nextStatus === "in_progress" ? (
                  <>
                    <Play className="h-3 w-3 mr-1 fill-current" />
                    Bắt đầu
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Hoàn thành
                  </>
                )}
              </Button>
            )}
            {(po.status === "draft" || po.status === "in_progress") && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] font-medium border-border hover:bg-secondary/20 px-2"
                  onClick={() => onEdit(po)}
                  disabled={isPending}
                >
                  Sửa
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] text-destructive hover:bg-destructive/5 px-2"
                  onClick={() => onUpdateStatus(po.id, "cancelled")}
                  disabled={isPending}
                >
                  Hủy
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Sub-Row containing Timeline and BOM consumption details */}
      {isExpanded && (
        <tr className="bg-secondary/5 border-b border-border/40">
          <td colSpan={9} className="p-3">
            <div className="mx-8 p-4 rounded-lg border border-border/80 bg-card shadow-inner space-y-4">
              
              {/* Timeline tracker heading */}
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                <Activity className="h-3.5 w-3.5 text-primary" />
                Quá trình thực hiện lệnh sản xuất:
              </div>

              {/* Steps Layout Timeline (4 Steps) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full max-w-3xl mx-auto py-2 gap-4 sm:gap-2">
                {/* Step 1: Tạo lệnh */}
                <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center flex-1">
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-success/15 border border-success text-success font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-foreground">{step1.label}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">
                      {step1.time ? new Date(step1.time).toLocaleString("vi-VN") : ""}
                    </p>
                  </div>
                </div>

                {/* Connection line 1 */}
                <div className="hidden sm:block h-[2px] flex-1 bg-success mx-2" />

                {/* Step 2: Chuẩn bị nguyên vật liệu */}
                <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center flex-1">
                  <div className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full font-bold border transition-colors duration-300",
                    step2.status === "success" && "bg-success/15 border-success text-success",
                    step2.status === "warning" && "bg-warning/15 border-warning text-warning animate-pulse",
                    step2.status === "error" && "bg-destructive/15 border-destructive text-destructive"
                  )}>
                    {step2.status === "warning" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : step2.status === "error" ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className={cn(
                      "text-[10px] font-bold",
                      step2.status === "success" && "text-success",
                      step2.status === "warning" && "text-warning",
                      step2.status === "error" && "text-destructive"
                    )}>
                      {step2.label}
                    </p>
                  </div>
                </div>

                {/* Connection line 2 */}
                <div className={cn(
                  "hidden sm:block h-[2px] flex-1 bg-border mx-2",
                  step3.isActive && "bg-success"
                )} />

                {/* Step 3: Đang sản xuất */}
                <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center flex-1">
                  <div className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full font-bold border transition-colors duration-300",
                    step3.isActive
                      ? "bg-success/15 border-success text-success"
                      : "bg-muted border-muted-foreground/30 text-muted-foreground"
                  )}>
                    {step3.isActive ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div className="space-y-0.5">
                    <p className={cn("text-[10px] font-bold", step3.isActive ? "text-foreground" : "text-muted-foreground")}>
                      {step3.label}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-mono">
                      {step3.time ? new Date(step3.time).toLocaleString("vi-VN") : "-"}
                    </p>
                  </div>
                </div>

                {/* Connection line 3 */}
                <div className={cn(
                  "hidden sm:block h-[2px] flex-1 bg-border mx-2",
                  step4.isActive && (step4.isError ? "bg-destructive" : "bg-success")
                )} />

                {/* Step 4: Kết thúc */}
                <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center flex-1">
                  <div className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full font-bold border transition-colors duration-300",
                    step4.isActive
                      ? step4.isError
                        ? "bg-destructive/15 border-destructive text-destructive"
                        : "bg-success/15 border-success text-success"
                      : "bg-muted border-muted-foreground/30 text-muted-foreground"
                  )}>
                    {step4.isActive ? (
                      step4.isError ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className={cn("text-[10px] font-bold", step4.isActive ? "text-foreground" : "text-muted-foreground")}>
                      {step4.label}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-mono">
                      {step4.time ? new Date(step4.time).toLocaleString("vi-VN") : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expandable BOM consumption details (only for draft or in_progress with BOM) */}
              {hasBom && (po.status === "draft" || po.status === "in_progress") && (
                <div className="space-y-2 pt-2 border-t border-border/80">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    Định mức nguyên vật liệu tiêu hao dự kiến:
                  </div>
                  <div className="border border-border/60 rounded-md overflow-hidden bg-card text-[10px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-secondary/40 border-b border-border text-muted-foreground font-semibold">
                          <th className="p-2">Nguyên vật liệu</th>
                          <th className="p-2 text-right">Định mức</th>
                          <th className="p-2 text-right">Cần tiêu dùng</th>
                          <th className="p-2 text-right">Tồn kho hiện tại</th>
                          <th className="p-2 text-center">Tình trạng vật tư</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materialsStatus.map((m: any, idx: number) => (
                          <tr key={idx} className="border-b border-border/30 hover:bg-secondary/5">
                            <td className="p-2 font-medium text-foreground">{m.material?.name}</td>
                            <td className="p-2 text-right font-mono text-muted-foreground">
                              {m.bomQuantity} {m.unit}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-primary">
                              {m.consumption} {m.unit}
                            </td>
                            <td className="p-2 text-right font-mono text-muted-foreground">
                              {m.currentStock} {m.unit}
                            </td>
                            <td className="p-2 text-center align-middle">
                              {m.isAvailable ? (
                                <span className="text-success font-bold bg-success/5 px-2 py-0.5 rounded border border-success/15">Đủ hàng</span>
                              ) : (
                                <span className="text-destructive font-bold bg-destructive/5 px-2 py-0.5 rounded border border-destructive/15">
                                  Thiếu {m.shortage}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
