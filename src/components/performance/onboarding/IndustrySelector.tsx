import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  ShoppingBag, 
  Laptop, 
  Factory, 
  Briefcase,
  CheckCircle2
} from "lucide-react";
import { usePerformanceOnboarding } from "@/hooks/usePerformanceOnboarding";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const industries = [
  { 
    id: "real_estate", 
    name: "Bất động sản", 
    icon: Building2,
    description: "KPI bán hàng, tỷ lệ chốt deal, chăm sóc khách hàng"
  },
  { 
    id: "retail", 
    name: "Bán lẻ", 
    icon: ShoppingBag,
    description: "Doanh số, inventory, customer service"
  },
  { 
    id: "tech", 
    name: "Công nghệ", 
    icon: Laptop,
    description: "Delivery, code quality, innovation"
  },
  { 
    id: "manufacturing", 
    name: "Sản xuất", 
    icon: Factory,
    description: "Năng suất, chất lượng, an toàn lao động"
  },
  { 
    id: "services", 
    name: "Dịch vụ", 
    icon: Briefcase,
    description: "Satisfaction, response time, retention"
  },
];

export function IndustrySelector() {
  const { onboarding, updateOnboarding } = usePerformanceOnboarding();
  const [selected, setSelected] = useState<string | null>(onboarding?.selected_industry || null);

  const { data: templates } = useQuery({
    queryKey: ["industry-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("industry_templates")
        .select("industry, template_type")
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
  });

  const getTemplateCount = (industry: string) => {
    return templates?.filter(t => t.industry === industry).length || 0;
  };

  const handleSelect = async (industryId: string) => {
    setSelected(industryId);
    await updateOnboarding.mutateAsync({ selected_industry: industryId });
  };

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Chọn ngành nghề của công ty để áp dụng template KPI, career path và skill tree phù hợp.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {industries.map((industry) => {
          const Icon = industry.icon;
          const isSelected = selected === industry.id;
          const templateCount = getTemplateCount(industry.id);

          return (
            <Card
              key={industry.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected 
                  ? "border-primary bg-primary/5 ring-2 ring-primary" 
                  : "hover:border-primary/50"
              }`}
              onClick={() => handleSelect(industry.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <h3 className="font-semibold mt-4">{industry.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {industry.description}
                </p>
                {templateCount > 0 && (
                  <Badge variant="secondary" className="mt-3">
                    {templateCount} templates sẵn có
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
