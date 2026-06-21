import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useApprovalRequests } from "@/hooks/useApprovalRequests";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { DirectivePanel } from "@/components/directives/DirectivePanel";
import {
  Plus, CheckCircle2, XCircle, Clock, FileText, Loader2, Send, AlertTriangle,
  ShoppingCart, Wallet, CalendarDays, Filter, Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

const requestTypes = [
  { value: "purchase", label: "Đề xuất mua hàng", icon: ShoppingCart },
  { value: "expense", label: "Đề xuất chi tiêu", icon: Wallet },
  { value: "leave", label: "Đơn nghỉ phép", icon: CalendarDays },
  { value: "other", label: "Khác", icon: FileText },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Nháp", color: "bg-muted text-muted-foreground", icon: FileText },
  submitted: { label: "Chờ duyệt", color: "bg-warning/10 text-warning", icon: Clock },
  approved: { label: "Đã duyệt", color: "bg-success/10 text-success", icon: CheckCircle2 },
  rejected: { label: "Từ chối", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

const EOffice = () => {
  const { requests, isLoading, createRequest, approveRequest, rejectRequest } = useApprovalRequests();
  const { role } = useCompanyContext();
  const { user } = useAuthContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Form
  const [formType, setFormType] = useState("purchase");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState("");

  const isManager = role === "admin" || role === "manager";

  const filteredRequests = requests.filter((r: any) => {
    if (filterType !== "all" && r.request_type !== filterType) return false;
    if (activeTab === "mine") return r.requested_by === user?.id;
    if (activeTab === "pending") return r.status === "submitted";
    return true;
  });

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    await createRequest.mutateAsync({
      request_type: formType,
      title: formTitle,
      description: formDesc,
      amount: formAmount ? Number(formAmount) : undefined,
    });
    setFormTitle("");
    setFormDesc("");
    setFormAmount("");
    setCreateOpen(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    await rejectRequest.mutateAsync({ id: rejectId, reason: rejectReason });
    setRejectOpen(false);
    setRejectReason("");
  };

  const pendingCount = requests.filter((r: any) => r.status === "submitted").length;

  const renderApprovalList = () => (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>Chưa có yêu cầu nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRequests.map((r: any) => {
            const config = statusConfig[r.status] || statusConfig.draft;
            const typeInfo = requestTypes.find(t => t.value === r.request_type);
            const TypeIcon = typeInfo?.icon || FileText;
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-muted shrink-0">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{r.title}</span>
                          <Badge variant="outline" className={cn("text-xs", config.color)}>
                            {config.label}
                          </Badge>
                        </div>
                        {r.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{r.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{typeInfo?.label}</span>
                          {r.amount && <span className="font-medium text-foreground">{r.amount.toLocaleString("vi-VN")}đ</span>}
                          <span>{new Date(r.created_at).toLocaleDateString("vi-VN")}</span>
                        </div>
                        {r.rejection_reason && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> {r.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>
                    {isManager && r.status === "submitted" && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => approveRequest.mutate(r.id)}
                          className="gap-1 text-xs text-success border-success/30 hover:bg-success/10">
                          <CheckCircle2 className="h-3 w-3" /> Duyệt
                        </Button>
                        <Button variant="outline" size="sm"
                          onClick={() => { setRejectId(r.id); setRejectOpen(true); }}
                          className="gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
                          <XCircle className="h-3 w-3" /> Từ chối
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <MainLayout>
      <Header title="E-Office" subtitle="Luồng phê duyệt văn bản & chỉ thị" />

      <div className="p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <TabsList>
              <TabsTrigger value="all">Phê duyệt</TabsTrigger>
              <TabsTrigger value="mine">Của tôi</TabsTrigger>
              {isManager && (
                <TabsTrigger value="pending" className="gap-1">
                  Chờ duyệt
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
              {isManager && (
                <TabsTrigger value="directives" className="gap-1">
                  <Megaphone className="h-3 w-3" />
                  Chỉ thị
                </TabsTrigger>
              )}
            </TabsList>
            <div className="flex gap-2">
              {activeTab !== "directives" && (
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">Tất cả loại</SelectItem>
                    {requestTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {activeTab !== "directives" && (
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Tạo yêu cầu
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="directives" className="mt-0">
            <DirectivePanel />
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            {renderApprovalList()}
          </TabsContent>

          <TabsContent value="mine" className="mt-0">
            {renderApprovalList()}
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            {renderApprovalList()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo Yêu cầu Phê duyệt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Loại yêu cầu</label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {requestTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tiêu đề *</label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="VD: Mua 100 hộp sản phẩm A" />
            </div>
            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Chi tiết yêu cầu..." rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Số tiền (nếu có)</label>
              <Input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={!formTitle.trim() || createRequest.isPending} className="gap-2">
              {createRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lý do từ chối</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default EOffice;
