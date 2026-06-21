import { WorkflowNode } from "@/hooks/useWorkflows";
import { getModuleDefinition } from "./workflowModules";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface NodeConfigPanelProps {
  node: WorkflowNode;
  onUpdate: (config: Record<string, any>, label?: string) => void;
  onClose: () => void;
}

export function NodeConfigPanel({ node, onUpdate, onClose }: NodeConfigPanelProps) {
  const def = getModuleDefinition(node.type, node.trigger_type || node.condition_type || node.action_type || "");
  if (!def) return null;

  const handleChange = (key: string, value: any) => {
    onUpdate({ ...node.config, [key]: value });
  };

  return (
    <div className="w-64 border-l bg-muted/30 p-4 space-y-4 overflow-y-auto flex-shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Cấu hình Node</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: def.color + "20", color: def.color }}>
          <def.icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{node.type}</div>
          <div className="text-sm font-medium">{def.label}</div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{def.description}</p>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Nhãn hiển thị</Label>
          <Input
            value={node.label || ""}
            onChange={(e) => onUpdate(node.config, e.target.value)}
            placeholder={def.label}
            className="h-8 text-sm"
          />
        </div>

        {def.configFields?.map((field) => (
          <div key={field.key}>
            <Label className="text-xs">{field.label}</Label>
            {field.type === "select" ? (
              <Select value={node.config[field.key] || ""} onValueChange={(v) => handleChange(field.key, v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Chọn..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={field.type === "number" ? "number" : "text"}
                value={node.config[field.key] || ""}
                onChange={(e) => handleChange(field.key, field.type === "number" ? Number(e.target.value) : e.target.value)}
                placeholder={field.placeholder}
                className="h-8 text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
