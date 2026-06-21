import { WorkflowNode, WorkflowEdge } from "@/hooks/useWorkflows";

interface ConnectionLinesProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  drawingEdge?: { sourceId: string; mouseX: number; mouseY: number } | null;
}

function getNodeCenter(node: WorkflowNode, port: "output" | "input" | "output-false") {
  const w = 160;
  const h = 56;
  if (port === "input") return { x: node.position.x, y: node.position.y + h / 2 };
  if (port === "output-false") return { x: node.position.x + w / 2, y: node.position.y + h };
  return { x: node.position.x + w, y: node.position.y + h / 2 };
}

export function ConnectionLines({ nodes, edges, drawingEdge }: ConnectionLinesProps) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" opacity="0.5" />
        </marker>
      </defs>
      {edges.map((edge, i) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (!source || !target) return null;

        const isFlaseBranch = edge.label === "false";
        const from = getNodeCenter(source, isFlaseBranch ? "output-false" : "output");
        const to = getNodeCenter(target, "input");
        const dx = Math.abs(to.x - from.x) * 0.5;

        const d = isFlaseBranch
          ? `M ${from.x} ${from.y} C ${from.x} ${from.y + dx}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`
          : `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;

        return (
          <g key={i}>
            <path d={d} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" opacity="0.4" markerEnd="url(#arrowhead)" />
            {edge.label && (
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px] font-medium"
              >
                {edge.label === "true" ? "Đúng" : edge.label === "false" ? "Sai" : edge.label}
              </text>
            )}
          </g>
        );
      })}
      {drawingEdge && (() => {
        const source = nodeMap.get(drawingEdge.sourceId);
        if (!source) return null;
        const from = getNodeCenter(source, "output");
        const dx = Math.abs(drawingEdge.mouseX - from.x) * 0.5;
        const d = `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${drawingEdge.mouseX - dx} ${drawingEdge.mouseY}, ${drawingEdge.mouseX} ${drawingEdge.mouseY}`;
        return <path d={d} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="6 3" />;
      })()}
    </svg>
  );
}
