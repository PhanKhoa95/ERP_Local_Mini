import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bot, Terminal, BookOpen, HelpCircle, Copy, Check, ShieldAlert, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SAMPLE_CLAUDE_CONFIG = `{
  "mcpServers": {
    "pancake-pos": {
      "command": "npx",
      "args": [
        "-y",
        "@pancake-vn/mcp-server"
      ],
      "env": {
        "PANCAKE_API_KEY": "DÁN_MÃ_API_KEY_CỦA_BẠN_VÀO_ĐÂY"
      }
    }
  }
}`;

export function AiMcpTab() {
  const { toast } = useToast();
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast({ title: "Đã copy vào khay nhớ tạm" });
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Connection Details */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/15 dark:to-blue-950/15 border border-blue-200/50 dark:border-blue-900/40">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
                <Bot className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Trợ lý AI quản lý cửa hàng (MCP)</CardTitle>
                <CardDescription className="text-xs">
                  Kết nối trực tiếp Claude vào cửa hàng của bạn để hỏi doanh thu, kiểm tồn kho, tạo đơn bằng câu nói tự nhiên.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 bg-card border rounded-lg flex items-center justify-between">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Địa chỉ máy chủ MCP của Pancake POS</span>
                <span className="font-mono text-foreground font-semibold">https://pos.pancake.vn/mcp</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                onClick={() => handleCopy("https://pos.pancake.vn/mcp", "mcp-url")}
              >
                {copiedText === "mcp-url" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                Copy URL
              </Button>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 w-fit">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
              <span className="font-semibold text-[10px]">MCP Server is Online & Ready</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-xs font-bold flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-indigo-500" /> Fast Integration
            </CardTitle>
            <CardDescription className="text-[10px]">Tạo nhanh mã API Key dành riêng cho Trợ lý AI (MCP).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-[10px] text-muted-foreground">
              Nhấn nút bên dưới để chuyển sang Tab API Gateway, chọn loại đối tác **Trợ lý AI (MCP)** để hệ thống tự động gán các phạm vi quyền đọc đơn, đọc tồn kho và tạo đơn.
            </p>
            <Alert className="py-2 bg-yellow-500/5 text-yellow-800 dark:text-yellow-400 border-yellow-500/20">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <AlertDescription className="text-[9px] leading-relaxed">
                Giữ API key an toàn tuyệt đối. Mọi hành động ghi của AI đều sử dụng định danh này để ghi nhận lịch sử.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Main Documentation Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full md:w-fit bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-1.5"><BookOpen className="h-4 w-4" /> Giới thiệu</TabsTrigger>
          <TabsTrigger value="setup" className="gap-1.5"><Terminal className="h-4 w-4" /> Hướng dẫn kết nối</TabsTrigger>
          <TabsTrigger value="prompts" className="gap-1.5"><Bot className="h-4 w-4" /> Thư viện Prompt</TabsTrigger>
          <TabsTrigger value="faq" className="gap-1.5"><HelpCircle className="h-4 w-4" /> Hỗ trợ & FAQ</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Model Context Protocol (MCP) là gì?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground">
              <p>
                Trợ lý AI như Claude vốn chỉ trò chuyện chung chung dựa trên tri thức được học — nó không biết hôm nay shop bạn bán được bao nhiêu đơn, còn bao nhiêu sản phẩm trong kho.
              </p>
              <p>
                <strong className="text-foreground">MCP (Model Context Protocol)</strong> là cầu nối tiêu chuẩn do Anthropic phát triển, giúp trợ lý AI kết nối trực tiếp và an toàn vào dữ liệu Pancake POS của shop bạn. Sau khi kết nối thành công, bạn chỉ cần gõ hoặc nói một câu, AI sẽ tự động gọi các API tương ứng để tra cứu dữ liệu hoặc thực hiện thao tác thay bạn.
              </p>
              
              <div className="p-4 rounded-lg bg-secondary/20 border border-border space-y-2">
                <h4 className="font-bold text-foreground">Bạn có thể làm gì với Trợ lý AI?</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-foreground">Hỏi nhanh thông tin:</strong> "Hôm nay shop có bao nhiêu đơn?", "Sản phẩm Áo thun Polo còn bao nhiêu chiếc?"</li>
                  <li><strong className="text-foreground">Tạo và xử lý đơn hàng:</strong> "Tạo đơn mới cho khách Nguyễn Văn A, SĐT 0912345678, mua 1 Áo thun size M."</li>
                  <li><strong className="text-foreground">Tạo chương trình khuyến mãi:</strong> "Tạo giùm mình một mã giảm giá 10% cho đơn tối thiểu 200k, áp dụng tuần sau."</li>
                  <li><strong className="text-foreground">Tổng hợp báo cáo kinh doanh:</strong> "Liệt kê 5 sản phẩm bán chạy nhất tuần này dưới dạng bảng."</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Setup Instructions */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Kết nối Claude Desktop với Pancake POS</CardTitle>
              <CardDescription className="text-xs">Các bước chi tiết để cấu hình trợ lý AI cá nhân trên máy tính của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-xs text-muted-foreground leading-relaxed">
              <div className="space-y-3">
                <h4 className="font-bold text-foreground text-xs flex items-center gap-2">
                  <Badge variant="secondary" className="h-5 w-5 rounded-full flex items-center justify-center p-0">1</Badge>
                  Chuẩn bị thiết bị
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Máy tính chạy hệ điều hành <strong className="text-foreground">macOS</strong> hoặc <strong className="text-foreground">Windows</strong>.</li>
                  <li>Cài đặt ứng dụng **Claude Desktop** (tải miễn phí tại <a href="https://claude.ai/download" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">claude.ai/download</a>).</li>
                  <li>Một tài khoản Claude đang hoạt động ổn định.</li>
                </ul>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h4 className="font-bold text-foreground text-xs flex items-center gap-2">
                  <Badge variant="secondary" className="h-5 w-5 rounded-full flex items-center justify-center p-0">2</Badge>
                  Lấy mã API Key xác thực
                </h4>
                <p>
                  API Key giúp Claude xác thực quyền thao tác trên shop của bạn. 
                  Hãy qua Tab **API Gateway** ngay trong trang này, tạo một key mới với loại đối tác là **Trợ lý AI (MCP)**, sao chép chuỗi mã API Key được tạo ra.
                </p>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h4 className="font-bold text-foreground text-xs flex items-center gap-2">
                  <Badge variant="secondary" className="h-5 w-5 rounded-full flex items-center justify-center p-0">3</Badge>
                  Cấu hình Claude Desktop
                </h4>
                <p>
                  Mở Claude Desktop, nhấn chọn biểu tượng avatar ở góc trái dưới → chọn <strong className="text-foreground">Settings</strong> → <strong className="text-foreground">Developer</strong> → chọn <strong className="text-foreground">Edit Config</strong>.
                </p>
                <p>
                  File cấu hình <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] text-foreground">claude_desktop_config.json</code> sẽ được mở ra. Hãy dán đoạn JSON sau vào cấu hình của bạn:
                </p>
                
                <div className="relative">
                  <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-100 font-mono text-[10px] overflow-x-auto border border-slate-800">
                    {SAMPLE_CLAUDE_CONFIG}
                  </pre>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 h-7 text-[10px] gap-1"
                    onClick={() => handleCopy(SAMPLE_CLAUDE_CONFIG, "claude-json")}
                  >
                    {copiedText === "claude-json" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy JSON
                  </Button>
                </div>
                
                <Alert className="py-2.5 bg-blue-500/5 text-blue-800 dark:text-blue-400 border-blue-500/20">
                  <AlertDescription className="text-[10px] leading-relaxed">
                    Lưu ý: Thay thế phần <code className="text-foreground font-mono font-bold bg-muted/20 px-1 rounded">DÁN_MÃ_API_KEY_CỦA_BẠN_VÀO_ĐÂY</code> bằng API Key thật bạn vừa lấy được ở Bước 2. Khởi động lại Claude Desktop sau khi lưu file cấu hình.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Prompt Library */}
        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Thư viện câu lệnh mẫu (Prompts)</CardTitle>
              <CardDescription className="text-xs">
                Sao chép nhanh các prompt mẫu đã được tối ưu hóa cho từng vai trò trong cửa hàng.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  role: "Chủ shop",
                  desc: "Theo dõi sức khỏe kinh doanh mà không cần mở nhiều báo cáo phức tạp.",
                  prompts: [
                    {
                      label: "Hỏi báo cáo doanh thu & đơn hàng nhanh",
                      text: "Tổng hợp doanh thu, số lượng đơn hàng mới phát sinh và số đơn đang chờ xử lý trong ngày hôm nay. Trình bày dưới dạng bảng so sánh với ngày hôm qua."
                    },
                    {
                      label: "Kiểm tra sản phẩm bán chạy nhất",
                      text: "Liệt kê danh sách 5 sản phẩm có số lượng bán chạy nhất trong tuần này, kèm theo số lượng tồn kho hiện tại để mình quyết định có nhập thêm hàng không."
                    }
                  ]
                },
                {
                  role: "Nhân viên Bán hàng / Telesale",
                  desc: "Tra cứu tồn kho báo khách và tạo đơn hàng nhanh bằng câu thoại.",
                  prompts: [
                    {
                      label: "Tạo đơn hàng mới cực nhanh",
                      text: "Tạo một đơn hàng mới cho khách hàng: [Tên Khách Hàng], SĐT: [Số Điện Thoại]. Mặt hàng mua: [Tên Sản Phẩm] với số lượng: [Số Lượng]. Chọn kho xuất là [Tên Kho]. Ghi chú đơn: [Ghi chú]."
                    },
                    {
                      label: "Kiểm tra nhanh tồn kho để báo khách",
                      text: "Kiểm tra xem sản phẩm [Tên sản phẩm] ở kho [Tên Kho] còn hàng không và báo số lượng tồn kho khả dụng còn lại để mình phản hồi khách."
                    }
                  ]
                },
                {
                  role: "Thủ kho / Kế toán",
                  desc: "Theo dõi công nợ, quản lý xuất nhập tồn.",
                  prompts: [
                    {
                      label: "Tra cứu danh sách mặt hàng sắp hết tồn",
                      text: "Kiểm tra tồn kho của tất cả sản phẩm, lọc ra những mặt hàng có số lượng tồn khả dụng nhỏ hơn [Số lượng, VD: 5] chiếc để làm danh sách báo nhập hàng gấp."
                    },
                    {
                      label: "Rà soát giao dịch thu chi phát sinh",
                      text: "Liệt kê các giao dịch phát sinh phiếu thu, phiếu chi trong ngày hôm nay kèm theo lý do, số tiền tương ứng để thủ quỹ đối soát sổ quỹ."
                    }
                  ]
                }
              ].map((grp, idx) => (
                <div key={idx} className="space-y-3 border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-foreground text-xs">{grp.role}</h4>
                    <p className="text-[10px] text-muted-foreground">{grp.desc}</p>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-2">
                    {grp.prompts.map((p, pIdx) => (
                      <div key={pIdx} className="p-3 border rounded-lg bg-secondary/15 flex flex-col justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="font-semibold text-foreground block">{p.label}</span>
                          <p className="text-muted-foreground text-[10px] italic">"{p.text}"</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1 h-7 text-[10px]"
                          onClick={() => handleCopy(p.text, `${idx}-${pIdx}`)}
                        >
                          {copiedText === `${idx}-${pIdx}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          Copy câu lệnh
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: FAQ */}
        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Giải đáp thắc mắc & Khắc phục sự cố</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
              {[
                {
                  q: "Đã thiết lập cấu hình nhưng AI vẫn báo không thể tra cứu dữ liệu?",
                  a: "Hãy kiểm tra theo thứ tự: 1. Đã tắt hẳn Claude Desktop bằng tổ hợp Cmd+Q (macOS) hoặc Alt+F4 (Windows) rồi mở lại chưa? 2. API Key dán có bị thừa dấu cách ở đầu hoặc cuối không? 3. Mở một cuộc hội thoại (chat session) mới hoàn toàn trong Claude và hỏi câu lệnh cơ bản: 'Liệt kê 3 đơn hàng gần đây'."
                },
                {
                  q: "API Key có quyền hạn như thế nào trên cửa hàng?",
                  a: "Mỗi API key được cấp các quyền tương ứng với scope bạn đã chọn khi khởi tạo ở Tab API Gateway. Chúng tôi khuyến cáo chỉ tích chọn đúng các scope cần thiết (ví dụ chỉ đọc đơn và tồn kho đối với trợ lý AI xem báo cáo) để đảm bảo an toàn tối đa."
                },
                {
                  q: "Lỡ làm lộ mã API Key của shop thì phải xử lý thế nào?",
                  a: "Vào Tab **API Gateway**, tìm dòng API Key tương ứng trong bảng quản lý khóa và nhấn nút **Thu hồi (Revoke)**. Khóa cũ sẽ bị vô hiệu hóa lập tức, ngăn chặn mọi truy cập trái phép. Sau đó bạn có thể tạo khóa mới để thay thế."
                },
                {
                  q: "AI có thể tự ý xóa vĩnh viễn dữ liệu đơn hàng hay sản phẩm không?",
                  a: "Không. Thiết kế hệ thống Pancake POS MCP chặn hoàn toàn việc xóa cứng. AI chỉ có thể ẩn sản phẩm hoặc cập nhật trạng thái hủy đơn theo quy trình bán hàng chuẩn, không thể xóa vĩnh viễn dữ liệu khỏi hệ thống của bạn."
                }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1 border-b pb-3 last:border-b-0 last:pb-0">
                  <h4 className="font-bold text-foreground text-xs">❓ {item.q}</h4>
                  <p>{item.a}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
