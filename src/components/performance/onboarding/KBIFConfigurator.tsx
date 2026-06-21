import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Target, Heart, Lightbulb, Shield, AlertCircle } from "lucide-react";
import { usePerformanceOnboarding } from "@/hooks/usePerformanceOnboarding";

interface KBIFWeights {
  K: number; // KPI
  B: number; // Behavior
  I: number; // Innovation
  F: number; // Foundation
}

const kbifCategories = [
  { 
    key: "K", 
    name: "KPI - Kết quả công việc", 
    icon: Target, 
    color: "text-blue-600",
    description: "Chỉ số đo lường kết quả, doanh số, năng suất"
  },
  { 
    key: "B", 
    name: "Behavior - Hành vi", 
    icon: Heart, 
    color: "text-pink-600",
    description: "Thái độ, teamwork, communication, culture fit"
  },
  { 
    key: "I", 
    name: "Innovation - Sáng tạo", 
    icon: Lightbulb, 
    color: "text-yellow-600",
    description: "Cải tiến quy trình, ý tưởng mới, learning"
  },
  { 
    key: "F", 
    name: "Foundation - Nền tảng", 
    icon: Shield, 
    color: "text-green-600",
    description: "Chuyên cần, tuân thủ, an toàn lao động"
  },
];

export function KBIFConfigurator() {
  const { onboarding, updateOnboarding } = usePerformanceOnboarding();
  const [weights, setWeights] = useState<KBIFWeights>({
    K: 40,
    B: 25,
    I: 20,
    F: 15,
  });

  useEffect(() => {
    if (onboarding?.kbif_config) {
      setWeights(onboarding.kbif_config as KBIFWeights);
    }
  }, [onboarding?.kbif_config]);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const isValid = totalWeight === 100;

  const handleChange = async (key: keyof KBIFWeights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    setWeights(newWeights);
    
    const newTotal = Object.values(newWeights).reduce((a, b) => a + b, 0);
    if (newTotal === 100) {
      await updateOnboarding.mutateAsync({ kbif_config: newWeights });
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Cấu hình trọng số cho 4 nhóm tiêu chí đánh giá K.B.I.F. Tổng phải bằng 100%.
      </p>

      {/* Total indicator */}
      <div className={`flex items-center justify-between p-4 rounded-lg ${
        isValid ? "bg-green-50 dark:bg-green-950/20" : "bg-orange-50 dark:bg-orange-950/20"
      }`}>
        <div className="flex items-center gap-2">
          {!isValid && <AlertCircle className="h-5 w-5 text-orange-500" />}
          <span className={isValid ? "text-green-700" : "text-orange-700"}>
            Tổng trọng số: <strong>{totalWeight}%</strong>
          </span>
        </div>
        <Badge variant={isValid ? "default" : "destructive"}>
          {isValid ? "Hợp lệ" : `Cần điều chỉnh ${100 - totalWeight > 0 ? "+" : ""}${100 - totalWeight}%`}
        </Badge>
      </div>

      {/* Sliders */}
      <div className="space-y-6">
        {kbifCategories.map((category) => {
          const Icon = category.icon;
          const value = weights[category.key as keyof KBIFWeights];

          return (
            <Card key={category.key}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${category.color}`} />
                    <span className="text-base">{category.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-lg">
                    {value}%
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </CardHeader>
              <CardContent>
                <Slider
                  value={[value]}
                  onValueChange={(v) => handleChange(category.key as keyof KBIFWeights, v[0])}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview */}
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Công thức tính điểm:</p>
        <code className="text-sm">
          Score = (K × {weights.K}%) + (B × {weights.B}%) + (I × {weights.I}%) + (F × {weights.F}%)
        </code>
      </div>
    </div>
  );
}
