import { useState, useRef, MouseEvent } from "react";
import { WorkflowFlowData, WorkflowNode, WorkflowEdge } from "@/hooks/useWorkflows";
import { ModulePalette } from "./ModulePalette";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { ConnectionLines } from "./ConnectionLines";
import { getModuleDefinition, ModuleDefinition } from "./workflowModules";
import { Button } from "@/components/ui/button";
import { Save, Trash2, ArrowRight, Link as LinkIcon, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface WorkflowCanvasProps {
  flowData: WorkflowFlowData;
  onChange: (flowData: WorkflowFlowData) => void;
  onSave: () => void;
  isSaving: boolean;
  simulationResults: any;
}

export function WorkflowCanvas({
  flowData,
  onChange,
  onSave,
  isSaving,
  simulationResults
}: WorkflowCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [drawingEdge, setDrawingEdge] = useState<{ sourceId: string; mouseX: number; mouseY: number } | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const selectedNode = flowData.nodes.find(n => n.id === selectedNodeId) || null;

  // Handle Drag & Drop new nodes from Palette
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    try {
      const moduleDataStr = e.dataTransfer.getData("application/workflow-module");
      if (!moduleDataStr) return;

      const mod: ModuleDefinition = JSON.parse(moduleDataStr);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 80; // center offset
      const y = e.clientY - rect.top - 28;

      const newNode: WorkflowNode = {
        id: `node-${Date.now()}`,
        type: mod.type,
        label: mod.label,
        config: {},
        position: { x, y }
      };

      if (mod.type === "trigger") newNode.trigger_type = mod.subtype;
      if (mod.type === "condition") newNode.condition_type = mod.subtype;
      if (mod.type === "action") newNode.action_type = mod.subtype;

      onChange({
        ...flowData,
        nodes: [...flowData.nodes, newNode]
      });

      setSelectedNodeId(newNode.id);
      toast.success(`Đã thêm bước "${mod.label}" vào quy trình`);
    } catch (err) {
      console.error(err);
    }
  };

  // Node Dragging on Canvas
  const handleNodeMouseDown = (e: MouseEvent<HTMLDivElement>, nodeId: string) => {
    e.stopPropagation();
    const node = flowData.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);
    
    // Calculate drag offset
    dragOffset.current = {
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y
    };
  };

  const handleCanvasMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    if (draggingNodeId) {
      const x = e.clientX - dragOffset.current.x;
      const y = e.clientY - dragOffset.current.y;

      onChange({
        ...flowData,
        nodes: flowData.nodes.map(n =>
          n.id === draggingNodeId
            ? { ...n, position: { x: Math.max(0, x), y: Math.max(0, y) } }
            : n
        )
      });
    } else if (drawingEdge) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDrawingEdge({
        ...drawingEdge,
        mouseX: e.clientX - rect.left,
        mouseY: e.clientY - rect.top
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null);
    setDrawingEdge(null);
  };

  // Node Ports (Connections)
  const handleStartConnection = (e: MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setDrawingEdge({
      sourceId: nodeId,
      mouseX: e.clientX - rect.left,
      mouseY: e.clientY - rect.top
    });
  };

  const handleCompleteConnection = (e: MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (!drawingEdge || drawingEdge.sourceId === targetId) return;

    // Check duplicate
    const exists = flowData.edges.some(
      edge => edge.source === drawingEdge.sourceId && edge.target === targetId
    );

    if (!exists) {
      const newEdge: WorkflowEdge = {
        id: `edge-${Date.now()}`,
        source: drawingEdge.sourceId,
        target: targetId,
        label: flowData.nodes.find(n => n.id === drawingEdge.sourceId)?.type === "condition" ? "true" : undefined
      };

      onChange({
        ...flowData,
        edges: [...flowData.edges, newEdge]
      });
      toast.success("Đã kết nối các bước quy trình");
    }

    setDrawingEdge(null);
  };

  // Delete Selected Node
  const handleDeleteNode = () => {
    if (!selectedNodeId) return;

    onChange({
      nodes: flowData.nodes.filter(n => n.id !== selectedNodeId),
      edges: flowData.edges.filter(
        edge => edge.source !== selectedNodeId && edge.target !== selectedNodeId
      )
    });

    setSelectedNodeId(null);
    toast.success("Đã xóa node");
  };

  // Node Configuration updates
  const handleUpdateNodeConfig = (config: Record<string, any>, label?: string) => {
    if (!selectedNodeId) return;
    onChange({
      ...flowData,
      nodes: flowData.nodes.map(n =>
        n.id === selectedNodeId
          ? { ...n, config, label: label !== undefined ? label : n.label }
          : n
      )
    });
  };

  // Quick action: Clear Canvas
  const handleClear = () => {
    onChange({ nodes: [], edges: [] });
    setSelectedNodeId(null);
    toast.info("Đã xóa trắng quy trình");
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-background relative border rounded-lg select-none">
      {/* Sidebar palette */}
      <ModulePalette onDragStart={() => {}} />

      {/* Editor Canvas */}
      <div
        ref={canvasRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        className="flex-1 overflow-auto relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]"
        style={{ minHeight: "450px" }}
      >
        {/* Draw edges SVG */}
        <ConnectionLines nodes={flowData.nodes} edges={flowData.edges} drawingEdge={drawingEdge} />

        {/* Nodes */}
        {flowData.nodes.map((node) => {
          const def = getModuleDefinition(node.type, node.trigger_type || node.condition_type || node.action_type || "");
          if (!def) return null;

          const isSelected = node.id === selectedNodeId;

          return (
            <div
              key={node.id}
              style={{
                position: "absolute",
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                width: "160px",
                height: "56px",
                zIndex: 10
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onMouseUp={(e) => {
                if (drawingEdge) handleCompleteConnection(e, node.id);
              }}
              className={`rounded-lg border bg-card p-2 shadow-sm transition-all flex flex-col justify-center cursor-grab active:cursor-grabbing ${
                isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                  style={{ backgroundColor: def.color + "15", color: def.color }}
                >
                  <def.icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] uppercase tracking-wide text-muted-foreground line-clamp-1">{def.label}</div>
                  <div className="text-xs font-semibold truncate text-foreground">{node.label || def.label}</div>
                </div>
              </div>

              {/* Input port */}
              {node.type !== "trigger" && (
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-border hover:bg-primary border border-background z-20 cursor-crosshair" />
              )}

              {/* Output port */}
              <div
                onMouseDown={(e) => handleStartConnection(e, node.id)}
                className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-border hover:bg-primary border border-background z-20 cursor-crosshair"
              />
            </div>
          );
        })}

        {/* Toolbar */}
        <div className="absolute bottom-4 left-4 flex gap-2 z-30">
          <Button variant="outline" size="sm" onClick={handleClear} className="h-8">
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Xóa trắng
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSaving} className="h-8 gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Đang lưu..." : "Lưu quy trình"}
          </Button>
        </div>
      </div>

      {/* Node configuration sidebar */}
      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onUpdate={handleUpdateNodeConfig}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}
