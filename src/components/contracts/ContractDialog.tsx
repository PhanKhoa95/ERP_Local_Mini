import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useContracts } from "@/hooks/useContracts";
import { Bot, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INDUSTRIES = [
  { value: "real_estate", label: "Bất động sản" },
  { value: "manufacturing", label: "Sản xuất" },
  { value: "retail", label: "Bán lẻ" },
  { value: "services", label: "Dịch vụ" },
  { value: "tech", label: "Công nghệ" },
  { value: "construction", label: "Xây dựng" },
  { value: "healthcare", label: "Y tế" },
];

const CONTRACT_TYPES = [
  { value: "service", label: "Dịch vụ" },
  { value: "supply", label: "Cung ứng" },
  { value: "deposit", label: "Đặt cọc" },
  { value: "construction", label: "Thi công" },
  { value: "lease", label: "Thuê/Cho thuê" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContractDialog({ open, onOpenChange }: Props) {
  const { createContract, generateTemplate } = useContracts();
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "", contract_number: "", contract_type: "service", industry: "services",
    total_value: 0, valid_from: "", valid_to: "", token_auto_issue: false, token_issue_percent: 0,
  });
  const [generatedTemplate, setGeneratedTemplate] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const template = await generateTemplate.mutateAsync({
        industry: form.industry, contract_type: form.contract_type,
      });
      setGeneratedTemplate(template);
    } catch {
      // Error already handled by mutation onError
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast({ variant: "destructive", title: "Thiếu tiêu đề", description: "Vui lòng nhập tiêu đề hợp đồng" });
      return;
    }
    // contract_number will be auto-generated in the hook if empty
    createContract.mutate({
      ...form,
      content_template: generatedTemplate?.clauses || [],
      variables: generatedTemplate?.variables || {},
      status: "draft",
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setForm({ title: "", contract_number: "", contract_type: "service", industry: "services", total_value: 0, valid_from: "", valid_to: "", token_auto_issue: false, token_issue_percent: 0 });
        setGeneratedTemplate(null);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo hợp đồng mới</DialogTitle>
          <DialogDescription>AI sẽ sinh mẫu điều khoản phù hợp ngành nghề</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ngành nghề</Label>
              <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Loại hợp đồng</Label>
              <Select value={form.contract_type} onValueChange={v => setForm(f => ({ ...f, contract_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTRACT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button variant="outline" onClick={handleGenerate} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            AI sinh mẫu điều khoản
          </Button>

          {generatedTemplate && (
            <div className="rounded-lg border p-3 bg-muted/50 max-h-40 overflow-y-auto text-sm">
              <p className="font-medium mb-1">Điều khoản được sinh ({generatedTemplate.clauses?.length || 0}):</p>
              {generatedTemplate.clauses?.map((c: any, i: number) => (
                <p key={i} className="text-muted-foreground">• {c.title}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Số hợp đồng <span className="text-muted-foreground text-xs">(tự động nếu bỏ trống)</span></Label>
              <Input value={form.contract_number} onChange={e => setForm(f => ({ ...f, contract_number: e.target.value }))} placeholder="HD-2026-001" />
            </div>
            <div>
              <Label>Tiêu đề <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Hợp đồng cung ứng vật tư" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Giá trị (VNĐ)</Label>
              <Input type="number" value={form.total_value} onChange={e => setForm(f => ({ ...f, total_value: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Từ ngày</Label>
              <Input type="date" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} />
            </div>
            <div>
              <Label>Đến ngày</Label>
              <Input type="date" value={form.valid_to} onChange={e => setForm(f => ({ ...f, valid_to: e.target.value }))} />
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-lg border">
            <Switch checked={form.token_auto_issue} onCheckedChange={v => setForm(f => ({ ...f, token_auto_issue: v }))} />
            <div className="flex-1">
              <Label>Tự động phát hành Token khi milestone hoàn thành</Label>
            </div>
            {form.token_auto_issue && (
              <div className="w-24">
                <Input type="number" value={form.token_issue_percent} onChange={e => setForm(f => ({ ...f, token_issue_percent: Number(e.target.value) }))} placeholder="%" />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={!form.title.trim() || createContract.isPending}>
            {createContract.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Tạo hợp đồng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
