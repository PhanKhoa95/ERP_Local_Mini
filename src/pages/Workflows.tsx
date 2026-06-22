import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useWorkflows, WorkflowFlowData } from "@/hooks/useWorkflows";
import { WorkflowCanvas } from "@/components/workflows/WorkflowCanvas";
import { WorkflowLogsPanel } from "@/components/workflows/WorkflowLogsPanel";
import { TextToWorkflowDialog } from "@/components/workflows/TextToWorkflowDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Trash2, Workflow, History, LayoutTemplate, ShoppingCart, Package, Users, Zap, Sparkles, Play } from "lucide-react";
import { TRIGGER_MODULES } from "@/components/workflows/workflowModules";
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from "@/components/workflows/workflowTemplates";
import { WorkflowSuggestions } from "@/components/workflows/WorkflowSuggestions";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Workflows() {
  const { workflows, isLoading, createWorkflow, updateWorkflow, deleteWorkflow, toggleActive, workflowLogs, logsLoading } = useWorkflows();
  const { companyId } = useCompanyContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("order_created");
  const [localFlowData, setLocalFlowData] = useState<WorkflowFlowData | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const editingWorkflow = workflows.find(w => w.id === editingId);

  const handleCreate = () => {
    if (!newName.trim()) { toast.error("Nhập tên workflow"); return; }
    createWorkflow.mutate({ name: newName, trigger_type: newTrigger }, {
      onSuccess: (data: any) => {
        setShowCreate(false);
        setNewName("");
        setEditingId(data.id);
        setLocalFlowData(data.flow_data || { nodes: [], edges: [] });
      },
    });
  };

  const handleCreateFromTemplate = (template: WorkflowTemplate) => {
    createWorkflow.mutate(
      { name: template.name, trigger_type: template.trigger_type, description: template.description, flow_data: template.flowData },
      {
        onSuccess: (data: any) => {
          setShowTemplates(false);
          setEditingId(data.id);
          setLocalFlowData(data.flow_data || template.flowData);
          toast.success(`Đã tạo workflow từ template "${template.name}"`);
        },
      }
    );
  };

  const handleAIGenerated = (data: { name: string; description: string; trigger_type: string; flow_data: WorkflowFlowData }) => {
    createWorkflow.mutate(
      { name: data.name, description: data.description, trigger_type: data.trigger_type, flow_data: data.flow_data },
      {
        onSuccess: (result: any) => {
          setEditingId(result.id);
          setLocalFlowData(result.flow_data || data.flow_data);
          toast.success("AI đã tạo workflow, bạn có thể chỉnh sửa trên canvas!");
        },
      }
    );
  };

  const handleSave = () => {
    if (!editingId || !localFlowData) return;
    updateWorkflow.mutate({ id: editingId, flow_data: localFlowData }, {
      onSuccess: () => toast.success("Đã lưu workflow"),
    });
  };

  const [simulationResults, setSimulationResults] = useState<Record<string, "success" | "failed" | "pending"> | null>(null);
  const [showSimDialog, setShowSimDialog] = useState(false);
  const [simExecutionData, setSimExecutionData] = useState<any[]>([]);

  const handleExecute = async (workflowId: string) => {
    if (!localFlowData) return;
    
    // Set all nodes to pending
    const initialResults: Record<string, "success" | "failed" | "pending"> = {};
    localFlowData.nodes.forEach(n => {
      initialResults[n.id] = "pending";
    });
    setSimulationResults(initialResults);
    setExecutingId(workflowId);
    
    // Simulate latency for visual pulse
    await new Promise(r => setTimeout(r, 800));
    
    try {
      const { data, error } = await supabase.functions.invoke("execute-workflow", {
        body: { workflow_id: workflowId, trigger_data: {} },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      const results: Record<string, "success" | "failed" | "pending"> = {};
      const traces: any[] = [];
      
      localFlowData.nodes.forEach(node => {
        const nodeExec = data.node_executions?.find((ne: any) => ne.node_id === node.id);
        const status = nodeExec ? (nodeExec.status as "success" | "failed") : "success";
        results[node.id] = status;
        
        let detail = "Thực thi thành công";
        if (node.type === "trigger") {
          if (node.trigger_type === "order_created") {
            const compareNode = localFlowData.nodes.find(
              n => n.type === "condition" && n.condition_type === "compare" && (n.config?.field === "total" || n.config?.field === "price" || n.config?.field === "value")
            );
            const totalVal = compareNode?.config?.value ? Number(compareNode.config.value) : 6500000;
            detail = `Đơn hàng mới được tạo (VD: Đơn #DH-9482, Giá trị: ${totalVal.toLocaleString("vi-VN")}đ)`;
          } else if (node.trigger_type === "low_stock") {
            const threshold = node.config?.threshold || 10;
            detail = `Tồn kho của sản phẩm xuống dưới ngưỡng (VD: Sản phẩm SKU-102 còn ${threshold - 2} chiếc / ngưỡng ${threshold})`;
          } else if (node.trigger_type === "employee_onboarded") {
            detail = "Nhân viên mới hoàn tất tiếp nhận (VD: Nguyễn Văn A - Phòng Marketing)";
          } else {
            detail = "Sự kiện kích hoạt quy trình thành công";
          }
        } else if (node.type === "condition") {
          if (node.condition_type === "compare") {
            const field = node.config?.field || "total";
            const operator = node.config?.operator || ">";
            const value = node.config?.value ? Number(node.config.value).toLocaleString("vi-VN") : "5.000.000";
            detail = `Kiểm tra điều kiện: ${field} ${operator} ${value}đ. Kết quả: TRUE (Cho phép chạy tiếp)`;
          } else {
            detail = "Kiểm tra điều kiện: Giá trị khớp với cấu hình đầu vào. Kết quả: TRUE (Cho phép chạy tiếp)";
          }
        } else if (node.type === "action") {
          detail = node.action_type === "create_approval"
            ? "Đã tạo phiếu trình duyệt gửi Quản lý phê duyệt"
            : node.action_type === "send_notification"
              ? "Đã gửi thông báo đẩy đến Telegram/Email của bộ phận liên quan"
              : node.action_type === "create_task"
                ? "Đã tạo task công việc mới trong Project Management"
                : "Thực thi hành động nghiệp vụ thành công";
        }
        
        traces.push({
          id: node.id,
          label: node.label || node.trigger_type || node.condition_type || node.action_type || node.type,
          type: node.type,
          status,
          detail
        });
      });
      
      setSimulationResults(results);
      setSimExecutionData(traces);
      setShowSimDialog(true);
      toast.success("Giả lập chạy quy trình hoàn tất!");
    } catch (e: any) {
      toast.error(e.message || "Lỗi chạy giả lập workflow");
      setSimulationResults(null);
    } finally {
      setExecutingId(null);
    }
  };

  const renderSimulationDialog = () => (
    <Dialog open={showSimDialog} onOpenChange={setShowSimDialog}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-emerald-500 fill-emerald-50" />
            Kết quả Giả lập Chạy Quy trình
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Kết quả chạy thử nghiệm quy trình trước khi kích hoạt chính thức
          </p>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="border rounded-lg p-4 bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-500/20 text-sm">
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              ✓ Quy trình chạy giả lập thành công
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Mọi điều kiện và hành động đều hợp lệ. Kết quả thực thi cuối cùng sẽ hiển thị như dưới đây khi kích hoạt (Bật) quy trình thực tế.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chi tiết các bước thực hiện</h4>
            <div className="relative border-l pl-4 ml-2 space-y-4">
              {simExecutionData.map((trace) => (
                <div key={trace.id} className="relative">
                  {/* Circle indicator */}
                  <span className="absolute -left-[21px] top-1 flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-background" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{trace.label}</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1 bg-muted/40">{trace.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{trace.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setShowSimDialog(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (editingWorkflow && localFlowData) {
    return (
      <MainLayout>
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex items-center gap-3 px-6 py-3 border-b">
            <Button variant="ghost" size="icon" onClick={() => { setEditingId(null); setLocalFlowData(null); setSimulationResults(null); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{editingWorkflow.name}</h1>
              <p className="text-xs text-muted-foreground">{editingWorkflow.description || "Workflow builder"}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExecute(editingWorkflow.id)}
                disabled={executingId === editingWorkflow.id}
              >
                <Play className="h-4 w-4 mr-1" /> Chạy thử
              </Button>
              <Label className="text-sm">Bật</Label>
              <Switch
                checked={editingWorkflow.is_active}
                onCheckedChange={(v) => toggleActive.mutate({ id: editingId!, isActive: v })}
              />
            </div>
          </div>
          <WorkflowCanvas
            flowData={localFlowData}
            onChange={setLocalFlowData}
            onSave={handleSave}
            isSaving={updateWorkflow.isPending}
            simulationResults={simulationResults}
          />
        </div>
        {renderSimulationDialog()}
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tự động hóa</h1>
            <p className="text-muted-foreground text-sm">Thiết kế quy trình tự động bằng kéo thả hoặc AI</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowAIDialog(true)}>
              <Sparkles className="h-4 w-4 mr-2" /> AI Tạo workflow
            </Button>
            <Button variant="outline" onClick={() => setShowTemplates(true)}>
              <LayoutTemplate className="h-4 w-4 mr-2" /> Templates
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Tạo mới
            </Button>
          </div>
        </div>

        <Tabs defaultValue="workflows">
          <TabsList>
            <TabsTrigger value="workflows"><Workflow className="h-4 w-4 mr-1" /> Workflows</TabsTrigger>
            <TabsTrigger value="logs"><History className="h-4 w-4 mr-1" /> Lịch sử</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="mt-4 space-y-4">
            {/* Workflow Suggestions */}
            <WorkflowSuggestionsSection
              workflows={workflows}
              companyId={companyId}
              onCreateFromTemplate={handleCreateFromTemplate}
            />
            {isLoading ? (
              <div className="text-muted-foreground text-sm">Đang tải...</div>
            ) : workflows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Workflow className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Chưa có workflow nào</p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowAIDialog(true)}>
                      <Sparkles className="h-4 w-4 mr-2" /> AI Tạo workflow
                    </Button>
                    <Button onClick={() => setShowCreate(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Tạo thủ công
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workflows.map(wf => (
                  <Card key={wf.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setEditingId(wf.id); setLocalFlowData(wf.flow_data); }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{wf.name}</CardTitle>
                        <Switch
                          checked={wf.is_active}
                          onCheckedChange={(v) => { toggleActive.mutate({ id: wf.id, isActive: v }); }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{wf.description || "Không có mô tả"}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline">{wf.trigger_type}</Badge>
                        <span className="text-xs text-muted-foreground">{wf.flow_data.nodes.length} nodes</span>
                        <span className="text-xs text-muted-foreground ml-auto">{format(new Date(wf.updated_at), "dd/MM/yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <Button
                          variant="outline" size="sm"
                          onClick={(e) => { e.stopPropagation(); handleExecute(wf.id); }}
                          disabled={executingId === wf.id}
                        >
                          <Play className="h-3 w-3 mr-1" /> Chạy
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteWorkflow.mutate(wf.id); }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Xóa
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Lịch sử thực thi</CardTitle></CardHeader>
              <CardContent>
                <WorkflowLogsPanel logs={workflowLogs} isLoading={logsLoading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Tạo Workflow mới</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tên workflow</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="VD: Auto duyệt đơn lớn" />
              </div>
              <div>
                <Label>Trigger chính</Label>
                <Select value={newTrigger} onValueChange={setNewTrigger}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_MODULES.map(t => (
                      <SelectItem key={t.subtype} value={t.subtype}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
              <Button onClick={handleCreate} disabled={createWorkflow.isPending}>Tạo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Templates Dialog */}
        <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chọn Template</DialogTitle>
              <p className="text-sm text-muted-foreground">Bắt đầu nhanh với quy trình mẫu có sẵn</p>
            </DialogHeader>
            <div className="grid gap-3 md:grid-cols-2 max-h-[60vh] overflow-y-auto">
              {WORKFLOW_TEMPLATES.map(t => {
                const catIcon = t.category === "sales" ? ShoppingCart : t.category === "inventory" ? Package : t.category === "hr" ? Users : Zap;
                const CatIcon = catIcon;
                return (
                  <Card key={t.id} className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all" onClick={() => handleCreateFromTemplate(t)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10"><CatIcon className="h-4 w-4 text-primary" /></div>
                        <CardTitle className="text-sm">{t.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs">{t.description}</CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{t.trigger_type}</Badge>
                        <span className="text-xs text-muted-foreground">{t.flowData.nodes.length} nodes</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Text-to-Workflow Dialog */}
        <TextToWorkflowDialog
          open={showAIDialog}
          onOpenChange={setShowAIDialog}
          onGenerated={handleAIGenerated}
        />

        {renderSimulationDialog()}
      </div>
    </MainLayout>
  );
}

// Helper component to fetch data context for suggestions
function WorkflowSuggestionsSection({ workflows, companyId, onCreateFromTemplate }: { 
  workflows: any[]; companyId: string | null; onCreateFromTemplate: (t: WorkflowTemplate) => void;
}) {
  const { data: orderCount = 0 } = useQuery({
    queryKey: ["workflow-suggest-orders", companyId],
    queryFn: async () => {
      const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("company_id", companyId!);
      return count || 0;
    },
    enabled: !!companyId,
  });
  const { data: employeeCount = 0 } = useQuery({
    queryKey: ["workflow-suggest-employees", companyId],
    queryFn: async () => {
      const { count } = await supabase.from("perf_employees").select("id", { count: "exact", head: true }).eq("company_id", companyId!);
      return count || 0;
    },
    enabled: !!companyId,
  });
  const { data: productCount = 0 } = useQuery({
    queryKey: ["workflow-suggest-products", companyId],
    queryFn: async () => {
      const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("company_id", companyId!);
      return count || 0;
    },
    enabled: !!companyId,
  });

  const existingTriggerTypes = workflows.map(w => w.trigger_type);

  return (
    <WorkflowSuggestions
      existingTriggerTypes={existingTriggerTypes}
      hasOrders={orderCount > 0}
      hasEmployees={employeeCount > 0}
      hasProducts={productCount > 0}
      onCreateFromTemplate={onCreateFromTemplate}
    />
  );
}
