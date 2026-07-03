import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useOrders } from "@/hooks/useOrders";
import { Tag, Plus, Check, X, FolderKanban, Settings } from "lucide-react";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { supabase } from "@/integrations/supabase/client";

interface BulkTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: any[];
}

// Default static tags configuration
export const TAG_GROUPS = [
  {
    id: "group-priority",
    name: "Ưu tiên xử lý",
    allowMultiple: false, // Rule: Max 1 tag from this group per order
    tags: [
      { name: "Đơn gấp", color: "#ef4444", bg: "bg-red-500/10 text-red-500 border-red-500/20" },
      { name: "Khách VIP", color: "#eab308", bg: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
      { name: "Đơn sỉ", color: "#10b981", bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    ]
  },
  {
    id: "group-operations",
    name: "Nghiệp vụ",
    allowMultiple: true, // Rule: Multiple tags from this group allowed
    tags: [
      { name: "Thiếu thông tin", color: "#f97316", bg: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
      { name: "Cần xác nhận", color: "#3b82f6", bg: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
      { name: "Gửi lại", color: "#8b5cf6", bg: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    ]
  }
];

export const BulkTagDialog: React.FC<BulkTagDialogProps> = ({
  open,
  onOpenChange,
  selectedOrders,
}) => {
  const { toast } = useToast();
  const { orders } = useOrders();
  const [actionType, setActionType] = useState<"add" | "remove">("add");
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedTagNames([]);
      setActionType("add");
    }
  }, [open]);

  const handleToggleTag = (tagName: string) => {
    setSelectedTagNames(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleApplyTags = async () => {
    if (selectedTagNames.length === 0) {
      toast({
        variant: "destructive",
        title: "Chưa chọn thẻ",
        description: "Vui lòng chọn ít nhất một thẻ đơn hàng để thao tác."
      });
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;

    try {
      if (isLocalDemoAuthEnabled()) {
        const rawOrders = localStorage.getItem("erp-mini-local-demo-orders");
        if (rawOrders) {
          const allOrders = JSON.parse(rawOrders);
          const selectedIds = selectedOrders.map(o => o.id);

          allOrders.forEach((order: any, idx: number) => {
            if (selectedIds.includes(order.id)) {
              let currentTags = order.tags ? order.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];

              if (actionType === "add") {
                // Add selected tags
                selectedTagNames.forEach(newTag => {
                  // Find tag group
                  const group = TAG_GROUPS.find(g => g.tags.some(t => t.name === newTag));
                  
                  if (group && !group.allowMultiple) {
                    // Rule check: Remove all existing tags from this group
                    const groupTagNames = group.tags.map(t => t.name);
                    currentTags = currentTags.filter((t: string) => !groupTagNames.includes(t));
                  }

                  if (!currentTags.includes(newTag)) {
                    currentTags.push(newTag);
                  }
                });
              } else {
                // Remove selected tags
                currentTags = currentTags.filter((t: string) => !selectedTagNames.includes(t));
              }

              allOrders[idx].tags = currentTags.join(", ");
              allOrders[idx].updated_at = new Date().toISOString();
            }
          });

          localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(allOrders));
          successCount = selectedIds.length;
        }
      } else {
        // Supabase Mode
        for (const order of selectedOrders) {
          let currentTags = order.tags ? order.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];

          if (actionType === "add") {
            selectedTagNames.forEach(newTag => {
              const group = TAG_GROUPS.find(g => g.tags.some(t => t.name === newTag));
              if (group && !group.allowMultiple) {
                const groupTagNames = group.tags.map(t => t.name);
                currentTags = currentTags.filter((t: string) => !groupTagNames.includes(t));
              }
              if (!currentTags.includes(newTag)) {
                currentTags.push(newTag);
              }
            });
          } else {
            currentTags = currentTags.filter((t: string) => !selectedTagNames.includes(t));
          }

          const { error } = await supabase
            .from("orders")
            .update({
              tags: currentTags.join(", "),
              updated_at: new Date().toISOString()
            })
            .eq("id", order.id);

          if (!error) successCount++;
        }
      }

      toast({
        title: actionType === "add" ? "Đã gắn thẻ đơn hàng" : "Đã gỡ thẻ đơn hàng",
        description: `Đã cập nhật thành công cho ${successCount} đơn hàng.`
      });
      // Force refresh page context or call custom reload if orders hook supports it
      window.dispatchEvent(new Event("local-orders-updated"));
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Thao tác thất bại",
        description: err.message || "Không thể cập nhật thẻ đơn hàng."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl gap-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600 animate-bounce" />
            Cập nhật thẻ đơn hàng hàng loạt
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Thực hiện gắn thêm hoặc gỡ bỏ các thẻ nghiệp vụ cho {selectedOrders.length} đơn hàng đã chọn.
          </DialogDescription>
        </DialogHeader>

        {/* Action Type choice */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">1. Chọn hành động</Label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value as any)}
            className="w-full text-xs h-8.5 border rounded-md px-2.5 bg-background focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="add">Gắn thêm thẻ vào đơn hàng</option>
            <option value="remove">Gỡ thẻ ra khỏi đơn hàng</option>
          </select>
        </div>

        {/* Tags Selection Grid */}
        <div className="space-y-4 pt-1">
          <Label className="text-xs font-semibold flex items-center gap-1">
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
            2. Chọn thẻ đơn hàng
          </Label>

          <div className="space-y-3">
            {TAG_GROUPS.map((group) => (
              <div key={group.id} className="space-y-1.5 bg-slate-50 dark:bg-slate-900 border rounded-lg p-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {group.name}
                  </span>
                  <Badge variant="outline" className="text-[8px] font-mono leading-none h-4">
                    {group.allowMultiple ? "Gắn nhiều" : "Gắn tối đa 1 thẻ"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {group.tags.map((tag) => {
                    const isSelected = selectedTagNames.includes(tag.name);
                    return (
                      <button
                        key={tag.name}
                        type="button"
                        onClick={() => handleToggleTag(tag.name)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white font-semibold shadow-sm"
                            : "hover:bg-slate-200/50 bg-background border-border text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: isSelected ? "#ffffff" : tag.color }}
                        />
                        {tag.name}
                        {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning card for priority tags limit */}
        {actionType === "add" && selectedTagNames.some(t => TAG_GROUPS[0].tags.some(tg => tg.name === t)) && (
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 text-[10px] text-amber-600 dark:text-amber-400">
            💡 <strong>Ràng buộc nhóm thẻ:</strong> Thẻ thuộc nhóm <em>Ưu tiên xử lý</em> chỉ cho phép gắn tối đa 1 nhãn trên mỗi đơn. Khi gắn thẻ mới, thẻ cũ cùng nhóm (nếu có) sẽ tự động gỡ ra.
          </div>
        )}

        <DialogFooter className="border-t pt-4 flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9 text-xs">
            Hủy bỏ
          </Button>
          <Button
            size="sm"
            onClick={handleApplyTags}
            disabled={isSubmitting || selectedTagNames.length === 0}
            className={`h-9 text-xs gap-1.5 text-white font-semibold ${
              actionType === "add" ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isSubmitting ? (
              <span className="animate-spin mr-1">⏳</span>
            ) : actionType === "add" ? (
              <Plus className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {actionType === "add" ? "Xác nhận gắn thẻ" : "Xác nhận gỡ thẻ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
