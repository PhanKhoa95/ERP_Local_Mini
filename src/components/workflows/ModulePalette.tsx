import { TRIGGER_MODULES, CONDITION_MODULES, ACTION_MODULES, ModuleDefinition } from "./workflowModules";
import { cn } from "@/lib/utils";

interface ModulePaletteProps {
  onDragStart: (module: ModuleDefinition) => void;
}

function ModuleGroup({ title, modules, onDragStart }: { title: string; modules: ModuleDefinition[]; onDragStart: (m: ModuleDefinition) => void }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">{title}</h4>
      <div className="space-y-1">
        {modules.map((m) => (
          <div
            key={m.subtype}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/workflow-module", JSON.stringify(m));
              onDragStart(m);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing",
              "bg-card hover:bg-accent/50 transition-colors text-sm"
            )}
          >
            <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: m.color + "20", color: m.color }}>
              <m.icon className="h-3.5 w-3.5" />
            </div>
            <span className="truncate">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ModulePalette({ onDragStart }: ModulePaletteProps) {
  return (
    <div className="w-56 border-r bg-muted/30 p-3 space-y-4 overflow-y-auto flex-shrink-0">
      <h3 className="font-semibold text-sm">Modules</h3>
      <ModuleGroup title="Trigger" modules={TRIGGER_MODULES} onDragStart={onDragStart} />
      <ModuleGroup title="Điều kiện" modules={CONDITION_MODULES} onDragStart={onDragStart} />
      <ModuleGroup title="Hành động" modules={ACTION_MODULES} onDragStart={onDragStart} />
    </div>
  );
}
