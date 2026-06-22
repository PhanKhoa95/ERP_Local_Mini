import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Sparkles, MessageSquare, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PolicyRecommendationsTab() {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [advice, setAdvice] = useState<string | null>(null);

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

  const currentPolicies = [
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

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
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
            <Button onClick={handleAiAdvice} disabled={loading} className="w-full gap-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Hệ thống quy định hiện hành
            </CardTitle>
            <CardDescription>Danh sách văn bản pháp quy đang áp dụng trong doanh nghiệp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentPolicies.map((p, idx) => (
              <div key={idx} className="p-3 border rounded-lg hover:bg-muted/10 transition-colors space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{p.title}</span>
                  <Badge variant={p.status === "Đang áp dụng" ? "secondary" : "destructive"} className="text-[10px]">
                    {p.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground font-mono">{p.code}</div>
                <p className="text-xs text-muted-foreground mt-2">{p.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
