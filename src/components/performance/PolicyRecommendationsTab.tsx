import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Sparkles, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useShopSettings } from "@/hooks/useShopSettings";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Policy {
  title: string;
  code: string;
  status: string;
  summary: string;
}

const DEFAULT_POLICIES: Policy[] = [
  {
    title: "Chính sách chuyên cần & chấm công",
    code: "QD-2026-HR01",
    status: "Đang áp dụng",
    summary: "Yêu cầu check-in trước 08:30 sáng và check-out sau 17:30 chiều. Đi muộn quá 3 lần/tháng sẽ tính vào phép năm."
  },
  {
    title: "Chế độ nghỉ phép & nghỉ lễ",
    code: "QD-2026-HR02",
    status: "Đang áp dụng",
    summary: "Mỗi nhân viên chính thức có 12 ngày phép năm. Đăng ký nghỉ phép trực tuyến trước ít nhất 48 giờ để được duyệt."
  },
  {
    title: "Chính sách Thử việc & Đào tạo nội bộ",
    code: "QD-2026-HR03",
    status: "Cần cập nhật",
    summary: "Nhân viên mới tham gia tối thiểu 3 khóa học bắt buộc trong 2 tháng thử việc trước khi đánh giá ký hợp đồng."
  }
];

export function PolicyRecommendationsTab() {
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();
  const { updateSetting } = useShopSettings();

  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [advice, setAdvice] = useState<string | null>(null);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Policy>({
    title: "",
    code: "",
    status: "Đang áp dụng",
    summary: ""
  });

  // Query dynamic policies
  const { data: dbPolicies = [], isLoading: isPoliciesLoading } = useQuery({
    queryKey: ["shop_settings", "hr_policies", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("shop_settings" as any) as any)
        .select("value")
        .eq("company_id", companyId!)
        .eq("key", "hr_policies")
        .maybeSingle();
      if (error) throw error;
      return (data?.value as Policy[]) || [];
    }
  });

  const policies = useMemo(() => {
    return dbPolicies.length > 0 ? dbPolicies : DEFAULT_POLICIES;
  }, [dbPolicies]);

  const handleAiAdvice = async () => {
    if (!prompt) {
      toast.warning("Vui lòng nhập chủ đề chính sách cần tư vấn");
      return;
    }
    setLoading(true);
    try {
      // Mock AI recommendation based on standard HR policies
      setTimeout(() => {
        setAdvice(
          `## Đề xuất sửa đổi chính sách: ${prompt}\n\n` +
          `**1. Phân tích hiện trạng:**\n` +
          `- Hiện tại cơ chế ghi nhận và theo dõi đang gặp khó khăn trong việc chuẩn hóa quy trình báo cáo.\n` +
          `- Cần áp dụng chuyển đổi số tự động qua hệ thống ERP để tối ưu hóa thời gian.\n\n` +
          `**2. Đề xuất cải tiến:**\n` +
          `- **Giai đoạn 1 (Tuần đầu):** Ban hành tài liệu chỉ dẫn nhanh về quy định chấm công và báo cáo tuần.\n` +
          `- **Giai đoạn 2 (Tháng tiếp theo):** Tích hợp chấm công định vị thực địa và đối soát tự động với bảng lương.\n\n` +
          `**3. Đánh giá rủi ro & hiệu quả:**\n` +
          `- *Hiệu quả:* Tăng 35% độ chính xác dữ liệu chấm công, giảm 15% thời gian đối soát công nợ & lương.\n` +
          `- *Rủi ro:* Nhân sự cần thời gian làm quen với phần mềm mới. Cần tổ chức 2 buổi workshop đào tạo nội bộ.`
        );
        toast.success("AI đã phân tích và đưa ra đề xuất chính sách thành công!");
        setLoading(false);
      }, 1500);
    } catch (e: any) {
      toast.error("Không thể kết nối AI: " + e.message);
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingPolicy(null);
    setEditingIndex(null);
    setFormData({
      title: "",
      code: `QD-${new Date().getFullYear()}-HR0${policies.length + 1}`,
      status: "Đang áp dụng",
      summary: ""
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (policy: Policy, index: number) => {
    setEditingPolicy(policy);
    setEditingIndex(index);
    setFormData({ ...policy });
    setDialogOpen(true);
  };

  const handleSavePolicy = async () => {
    if (!formData.title || !formData.code || !formData.summary) {
      toast.warning("Vui lòng điền đầy đủ thông tin");
      return;
    }

    let updatedPolicies = [...policies];
    if (editingIndex !== null) {
      updatedPolicies[editingIndex] = formData;
    } else {
      updatedPolicies.push(formData);
    }

    updateSetting.mutate(
      { key: "hr_policies", value: updatedPolicies },
      {
        onSuccess: () => {
          setDialogOpen(false);
        }
      }
    );
  };

  const handleDeletePolicy = async (index: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chính sách này không?")) return;

    const updatedPolicies = policies.filter((_, idx) => idx !== index);
    updateSetting.mutate({ key: "hr_policies", value: updatedPolicies });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-primary font-bold">
              <Sparkles className="h-5 w-5 animate-pulse" />
              Tư vấn cải tiến chính sách bằng AI
            </CardTitle>
            <CardDescription>Nhập vấn đề HR/Vận hành của công ty để AI đề xuất chính sách phù hợp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Ví dụ: Quy chế thưởng nóng cho Sales đạt doanh số vượt 200%..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            <Button onClick={handleAiAdvice} disabled={loading} className="w-full gap-2 font-medium">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "AI đang lập luận..." : "Phân tích & Đề xuất"}
            </Button>

            {advice && (
              <div className="p-4 bg-muted/40 rounded-lg border text-sm overflow-y-auto max-h-[300px] prose dark:prose-invert">
                <div className="whitespace-pre-line font-mono text-xs">{advice}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-primary font-bold">
                <FileText className="h-5 w-5" />
                Hệ thống quy định hiện hành
              </CardTitle>
              <CardDescription>Danh sách văn bản pháp quy đang áp dụng trong doanh nghiệp</CardDescription>
            </div>
            <Button size="sm" onClick={handleOpenAdd} className="gap-1 px-2.5">
              <Plus className="h-4 w-4" /> Thêm quy định
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPoliciesLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : policies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Chưa có quy định nào được cấu hình.
              </div>
            ) : (
              <div className="space-y-3">
                {policies.map((p, idx) => (
                  <div key={idx} className="p-4 border rounded-xl hover:bg-muted/10 transition-all space-y-1 relative group">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{p.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={p.status === "Đang áp dụng" ? "secondary" : "destructive"} className="text-[10px] px-2 py-0">
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{p.code}</div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{p.summary}</p>
                    
                    <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-lg border shadow-sm">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleOpenEdit(p, idx)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeletePolicy(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary">
              {editingIndex !== null ? "Chỉnh sửa quy định" : "Thêm quy định mới"}
            </DialogTitle>
            <DialogDescription>
              Cập nhật thông tin chi tiết về chính sách hoặc quy chế vận hành nội bộ của doanh nghiệp.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right font-medium">Tiêu đề *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="col-span-3"
                placeholder="Ví dụ: Quy chế làm việc từ xa"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right font-medium">Mã số *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="col-span-3 font-mono"
                placeholder="Ví dụ: QD-2026-HR04"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right font-medium">Trạng thái *</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Đang áp dụng">Đang áp dụng</option>
                <option value="Cần cập nhật">Cần cập nhật</option>
                <option value="Nháp">Nháp</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="summary" className="text-right font-medium pt-2">Tóm tắt *</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                className="col-span-3 min-h-[100px] leading-relaxed"
                placeholder="Nội dung tóm tắt chi tiết của quy định..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSavePolicy} disabled={updateSetting.isPending} className="gap-1">
              {updateSetting.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
