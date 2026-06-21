import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Plus, ShoppingCart, Package, Users, Zap } from "lucide-react";
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from "./workflowTemplates";

interface WorkflowSuggestionsProps {
  existingTriggerTypes: string[];
  hasOrders: boolean;
  hasEmployees: boolean;
  hasProducts: boolean;
  onCreateFromTemplate: (template: WorkflowTemplate) => void;
}

export function WorkflowSuggestions({
  existingTriggerTypes,
  hasOrders,
  hasEmployees,
  hasProducts,
  onCreateFromTemplate,
}: WorkflowSuggestionsProps) {
  // Find templates that aren't covered by existing workflows
  const suggestions = WORKFLOW_TEMPLATES.filter(t => {
    // Skip if a workflow with this trigger already exists
    if (existingTriggerTypes.includes(t.trigger_type)) return false;

    // Prioritize based on actual data
    if (t.category === "sales" && !hasOrders) return false;
    if (t.category === "hr" && !hasEmployees) return false;
    if (t.category === "inventory" && !hasProducts) return false;

    return true;
  });

  if (suggestions.length === 0) return null;

  const catIcon = (cat: string) => {
    if (cat === "sales") return ShoppingCart;
    if (cat === "inventory") return Package;
    if (cat === "hr") return Users;
    return Zap;
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          Đề xuất quy trình tự động
        </CardTitle>
        <p className="text-xs text-muted-foreground">Hệ thống phát hiện các quy trình chưa được thiết lập</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {suggestions.slice(0, 6).map(t => {
            const Icon = catIcon(t.category);
            return (
              <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className="text-[10px]">{t.trigger_type}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs gap-1 ml-auto"
                      onClick={() => onCreateFromTemplate(t)}
                    >
                      <Plus className="h-3 w-3" /> Tạo
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
