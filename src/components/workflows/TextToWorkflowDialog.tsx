import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WorkflowFlowData } from "@/hooks/useWorkflows";
import { toast } from "sonner";

interface TextToWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (data: { name: string; description: string; trigger_type: string; flow_data: WorkflowFlowData }) => void;
}

export function TextToWorkflowDialog({ open, onOpenChange, onGenerated }: TextToWorkflowDialogProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ name: string; description: string; trigger_type: string; flow_data: WorkflowFlowData } | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) { toast.error("Vui lòng mô tả workflow"); return; }
    setLoading(true);
    setPreview(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-build-workflow", {
        body: { description },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPreview(data);
      toast.success("AI đã tạo workflow, xem trước và xác nhận!");
    } catch (e: any) {
      toast.error(e.message || "Không thể tạo workflow");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    onGenerated(preview);
    setDescription("");
    setPreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Tạo Workflow
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Mô tả quy trình bạn muốn tự động hóa, AI sẽ thiết kế workflow cho bạn
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="VD: Khi có đơn hàng mới trên 5 triệu, tự động tạo phê duyệt cho manager. Nếu duyệt xong thì gửi thông báo và cập nhật trạng thái đơn."
            rows={4}
            disabled={loading}
          />

          {preview && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="font-medium text-sm">{preview.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{preview.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Trigger: {preview.trigger_type}</span>
                <span>·</span>
                <span>{preview.flow_data.nodes.length} nodes</span>
                <span>·</span>
                <span>{preview.flow_data.edges.length} connections</span>
              </div>
              <div className="mt-2 space-y-1">
                {preview.flow_data.nodes.map((node, i) => (
                  <div key={i} className="text-xs flex items-center gap-2 px-2 py-1 bg-background rounded">
                    <span className={`w-2 h-2 rounded-full ${
                      node.type === "trigger" ? "bg-green-500" : node.type === "condition" ? "bg-yellow-500" : "bg-blue-500"
                    }`} />
                    <span>{node.label || node.trigger_type || node.condition_type || node.action_type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); setPreview(null); setDescription(""); }}>
            Hủy
          </Button>
          {preview ? (
            <Button onClick={handleConfirm}>
              <Check className="h-4 w-4 mr-1" /> Xác nhận & Mở Canvas
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={loading || !description.trim()}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              {loading ? "Đang tạo..." : "AI Tạo workflow"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
