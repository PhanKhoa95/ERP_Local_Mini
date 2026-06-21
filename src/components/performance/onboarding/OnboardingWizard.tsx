import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  Users, 
  Settings, 
  GitBranch, 
  Upload, 
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2
} from "lucide-react";
import { usePerformanceOnboarding } from "@/hooks/usePerformanceOnboarding";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { IndustrySelector } from "./IndustrySelector";
import { OrgUnitBuilder } from "./OrgUnitBuilder";
import { KBIFConfigurator } from "./KBIFConfigurator";
import { CareerPathSetup } from "./CareerPathSetup";
import { EmployeeImporter } from "./EmployeeImporter";
import { OnboardingReview } from "./OnboardingReview";

const steps = [
  { id: 1, title: "Chọn ngành", icon: Building2, description: "Chọn ngành nghề để áp dụng template" },
  { id: 2, title: "Cơ cấu tổ chức", icon: Users, description: "Thiết lập phòng ban và khối" },
  { id: 3, title: "Trọng số K.B.I.F", icon: Settings, description: "Cấu hình trọng số đánh giá" },
  { id: 4, title: "Lộ trình sự nghiệp", icon: GitBranch, description: "Thiết lập career paths" },
  { id: 5, title: "Import nhân viên", icon: Upload, description: "Nhập danh sách nhân viên" },
  { id: 6, title: "Hoàn tất", icon: CheckCircle2, description: "Xem lại và kích hoạt" },
];

export function OnboardingWizard() {
  const { onboarding, isLoading, companyId, createOnboarding, updateOnboarding, completeOnboarding } = usePerformanceOnboarding();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { mutate: createOnboardingMutate, isPending: createOnboardingPending } = createOnboarding;

  useEffect(() => {
    // Wait for companyId to load before creating onboarding
    if (!companyId) return;
    // Don't do anything if still loading
    if (isLoading) return;
    // Don't create if already creating
    if (isCreating) return;
    
    if (!onboarding && !createOnboardingPending) {
      setIsCreating(true);
      createOnboardingMutate();
    } else if (onboarding) {
      // Clamp step to valid range (1-6), if completed go to step 6
      const nextStep = Math.min(6, Math.max(1, (onboarding.step_completed || 0) + 1));
      setCurrentStep(nextStep);
    }
  }, [onboarding, companyId, isLoading, isCreating, createOnboardingPending, createOnboardingMutate]);

  // Reset creating flag when onboarding is created
  useEffect(() => {
    if (onboarding && isCreating) {
      setIsCreating(false);
    }
  }, [onboarding, isCreating]);

  // Show loading while creating onboarding
  if (isCreating || createOnboardingPending) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang khởi tạo thiết lập...</p>
        </div>
      </div>
    );
  }

  const handleNext = async () => {
    if (currentStep < 6) {
      await updateOnboarding.mutateAsync({ step_completed: currentStep });
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const seedDefaultData = async () => {
    if (!companyId || !user?.id) return;
    
    if (isLocalDemoAuthEnabled()) {
      // 1. Create local demo employee
      const defaultEmp = {
        id: "emp-local-demo-user",
        user_id: user.id,
        company_id: companyId,
        org_unit_id: "local-org-unit-1",
        position_id: "local-pos-1",
        career_path_id: "local-path-1",
        current_level_id: "level-local-path-1-0",
        title: "Chuyên viên ERP",
        total_xp: 1550,
        current_streak: 5,
        longest_streak: 12,
        avatar_frame: null,
        hire_date: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem("erp-mini-local-demo-perf-employees", JSON.stringify([defaultEmp]));

      // 2. Default career paths & levels if none exist
      const rawPaths = localStorage.getItem("erp-mini-local-demo-career-paths");
      if (!rawPaths || JSON.parse(rawPaths).length === 0) {
        const pathId = "local-path-1";
        const defaultPath = {
          id: pathId,
          company_id: companyId,
          name: "Sales Path",
          color: "#3b82f6",
          is_active: true,
        };
        localStorage.setItem("erp-mini-local-demo-career-paths", JSON.stringify([defaultPath]));

        const levels = [
          { name: "Fresher", level_order: 1, min_xp: 0, badge_icon: "🌱", color: "#10B981" },
          { name: "Junior", level_order: 2, min_xp: 500, badge_icon: "⭐", color: "#3B82F6" },
          { name: "Senior", level_order: 3, min_xp: 2000, badge_icon: "🔥", color: "#F59E0B" },
          { name: "Lead", level_order: 4, min_xp: 5000, badge_icon: "👑", color: "#8B5CF6" },
          { name: "Expert", level_order: 5, min_xp: 10000, badge_icon: "💎", color: "#EC4899" },
        ];
        const newLevels = levels.map((l, index) => ({
          id: `level-${pathId}-${index}`,
          path_id: pathId,
          name: l.name,
          level_order: l.level_order,
          min_xp: l.min_xp,
          badge_icon: l.badge_icon,
          color: l.color,
          perks: {},
        }));
        localStorage.setItem("erp-mini-local-demo-career-levels", JSON.stringify(newLevels));
      }

      // 3. Create default skill categories
      const skillCategories = [
        { id: "cat-1", company_id: companyId, name: "Giao tiếp", icon: "message-circle", color: "#3B82F6", sort_order: 1, is_active: true },
        { id: "cat-2", company_id: companyId, name: "Kỹ thuật", icon: "wrench", color: "#10B981", sort_order: 2, is_active: true },
        { id: "cat-3", company_id: companyId, name: "Lãnh đạo", icon: "users", color: "#8B5CF6", sort_order: 3, is_active: true },
        { id: "cat-4", company_id: companyId, name: "Sáng tạo", icon: "lightbulb", color: "#F59E0B", sort_order: 4, is_active: true },
        { id: "cat-5", company_id: companyId, name: "Phân tích", icon: "bar-chart", color: "#EC4899", sort_order: 5, is_active: true },
      ];
      localStorage.setItem("erp-mini-local-demo-skill-categories", JSON.stringify(skillCategories));

      // 4. Create default achievements
      const achievements = [
        { id: "ach-1", company_id: companyId, name: "Khởi đầu", description: "Đạt 100 XP đầu tiên", icon: "rocket", rarity: "common", condition_type: "xp_milestone", condition_value: { min_xp: 100 }, xp_reward: 50, is_active: true },
        { id: "ach-2", company_id: companyId, name: "Tiến bộ", description: "Đạt 500 XP", icon: "trending-up", rarity: "rare", condition_type: "xp_milestone", condition_value: { min_xp: 500 }, xp_reward: 100, is_active: true },
        { id: "ach-3", company_id: companyId, name: "Chuyên gia", description: "Đạt 2000 XP", icon: "award", rarity: "epic", condition_type: "xp_milestone", condition_value: { min_xp: 2000 }, xp_reward: 200, is_active: true },
        { id: "ach-4", company_id: companyId, name: "Huyền thoại", description: "Đạt 10000 XP", icon: "crown", rarity: "legendary", condition_type: "xp_milestone", condition_value: { min_xp: 10000 }, xp_reward: 500, is_active: true },
        { id: "ach-5", company_id: companyId, name: "Siêng năng", description: "Duy trì streak 7 ngày", icon: "flame", rarity: "rare", condition_type: "streak", condition_value: { min_streak: 7 }, xp_reward: 150, is_active: true },
      ];
      localStorage.setItem("erp-mini-local-demo-achievements", JSON.stringify(achievements));

      // 5. Create default quests
      const quests = [
        { id: "q-1", company_id: companyId, name: "Hoàn thành hồ sơ", description: "Cập nhật đầy đủ thông tin cá nhân", quest_type: "onboarding", conditions: { type: "profile_complete" }, xp_reward: 50, is_active: true },
        { id: "q-2", company_id: companyId, name: "Nhiệm vụ đầu tiên", description: "Hoàn thành nhiệm vụ đầu tiên của bạn", quest_type: "onboarding", conditions: { type: "first_quest" }, xp_reward: 100, is_active: true },
        { id: "q-3", company_id: companyId, name: "Check-in hàng ngày", description: "Đăng nhập và hoạt động mỗi ngày", quest_type: "daily", conditions: { type: "daily_checkin" }, xp_reward: 10, is_active: true },
        { id: "q-4", company_id: companyId, name: "Học kỹ năng mới", description: "Unlock một skill trong Skill Tree", quest_type: "special", conditions: { type: "first_skill" }, xp_reward: 75, is_active: true },
      ];
      localStorage.setItem("erp-mini-local-demo-quests", JSON.stringify(quests));
      return;
    }

    try {
      // 1. Create perf_employee for current user
      const { error: empError } = await supabase
        .from("perf_employees")
        .upsert({
          user_id: user.id,
          company_id: companyId,
          total_xp: 0,
          current_streak: 0,
          longest_streak: 0,
          is_active: true,
        }, { onConflict: "user_id,company_id" });

      if (empError) console.error("Error creating perf_employee:", empError);

      // 2. Create career_levels for all career_paths that don't have levels
      // and assign first career path + level to current user
      const { data: careerPaths } = await supabase
        .from("career_paths")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (careerPaths && careerPaths.length > 0) {
        const levels = [
          { name: "Fresher", level_order: 1, min_xp: 0, badge_icon: "🌱", color: "#10B981" },
          { name: "Junior", level_order: 2, min_xp: 500, badge_icon: "⭐", color: "#3B82F6" },
          { name: "Senior", level_order: 3, min_xp: 2000, badge_icon: "🔥", color: "#F59E0B" },
          { name: "Lead", level_order: 4, min_xp: 5000, badge_icon: "👑", color: "#8B5CF6" },
          { name: "Expert", level_order: 5, min_xp: 10000, badge_icon: "💎", color: "#EC4899" },
        ];

        for (const path of careerPaths) {
          const { data: existingLevels } = await supabase
            .from("career_levels")
            .select("id")
            .eq("path_id", path.id)
            .limit(1);

          if (!existingLevels || existingLevels.length === 0) {
            await supabase.from("career_levels").insert(
              levels.map((level) => ({ ...level, path_id: path.id }))
            );
          }
        }

        // Assign first career path and Fresher level to current user
        const firstPath = careerPaths[0];
        const { data: fresherLevel } = await supabase
          .from("career_levels")
          .select("id")
          .eq("path_id", firstPath.id)
          .eq("level_order", 1)
          .single();

        if (fresherLevel) {
          await supabase
            .from("perf_employees")
            .update({ 
              career_path_id: firstPath.id,
              current_level_id: fresherLevel.id 
            })
            .eq("user_id", user.id)
            .eq("company_id", companyId);
        }
      }

      // 3. Create default skill_categories if none exist
      const { data: existingSkillCats } = await supabase
        .from("skill_categories")
        .select("id")
        .eq("company_id", companyId)
        .limit(1);

      if (!existingSkillCats || existingSkillCats.length === 0) {
        await supabase.from("skill_categories").insert([
          { company_id: companyId, name: "Giao tiếp", icon: "message-circle", color: "#3B82F6", sort_order: 1, is_active: true },
          { company_id: companyId, name: "Kỹ thuật", icon: "wrench", color: "#10B981", sort_order: 2, is_active: true },
          { company_id: companyId, name: "Lãnh đạo", icon: "users", color: "#8B5CF6", sort_order: 3, is_active: true },
          { company_id: companyId, name: "Sáng tạo", icon: "lightbulb", color: "#F59E0B", sort_order: 4, is_active: true },
          { company_id: companyId, name: "Phân tích", icon: "bar-chart", color: "#EC4899", sort_order: 5, is_active: true },
        ]);
      }

      // 4. Create default achievements if none exist
      const { data: existingAchievements } = await supabase
        .from("achievements")
        .select("id")
        .eq("company_id", companyId)
        .limit(1);

      if (!existingAchievements || existingAchievements.length === 0) {
        await supabase.from("achievements").insert([
          { company_id: companyId, name: "Khởi đầu", description: "Đạt 100 XP đầu tiên", icon: "rocket", rarity: "common", condition_type: "xp_milestone", condition_value: { min_xp: 100 }, xp_reward: 50, is_active: true },
          { company_id: companyId, name: "Tiến bộ", description: "Đạt 500 XP", icon: "trending-up", rarity: "rare", condition_type: "xp_milestone", condition_value: { min_xp: 500 }, xp_reward: 100, is_active: true },
          { company_id: companyId, name: "Chuyên gia", description: "Đạt 2000 XP", icon: "award", rarity: "epic", condition_type: "xp_milestone", condition_value: { min_xp: 2000 }, xp_reward: 200, is_active: true },
          { company_id: companyId, name: "Huyền thoại", description: "Đạt 10000 XP", icon: "crown", rarity: "legendary", condition_type: "xp_milestone", condition_value: { min_xp: 10000 }, xp_reward: 500, is_active: true },
          { company_id: companyId, name: "Siêng năng", description: "Duy trì streak 7 ngày", icon: "flame", rarity: "rare", condition_type: "streak", condition_value: { min_streak: 7 }, xp_reward: 150, is_active: true },
          { company_id: companyId, name: "Kiên trì", description: "Duy trì streak 30 ngày", icon: "zap", rarity: "epic", condition_type: "streak", condition_value: { min_streak: 30 }, xp_reward: 300, is_active: true },
        ]);
      }

      // 5. Create default quests if none exist
      const { data: existingQuests } = await supabase
        .from("quests")
        .select("id")
        .eq("company_id", companyId)
        .limit(1);

      if (!existingQuests || existingQuests.length === 0) {
        await supabase.from("quests").insert([
          { company_id: companyId, name: "Hoàn thành hồ sơ", description: "Cập nhật đầy đủ thông tin cá nhân", quest_type: "onboarding", conditions: { type: "profile_complete" }, xp_reward: 50, is_active: true },
          { company_id: companyId, name: "Nhiệm vụ đầu tiên", description: "Hoàn thành nhiệm vụ đầu tiên của bạn", quest_type: "onboarding", conditions: { type: "first_quest" }, xp_reward: 100, is_active: true },
          { company_id: companyId, name: "Check-in hàng ngày", description: "Đăng nhập và hoạt động mỗi ngày", quest_type: "daily", conditions: { type: "daily_checkin" }, xp_reward: 10, is_active: true },
          { company_id: companyId, name: "Học kỹ năng mới", description: "Unlock một skill trong Skill Tree", quest_type: "special", conditions: { type: "first_skill" }, xp_reward: 75, is_active: true },
          { company_id: companyId, name: "Streak 3 ngày", description: "Duy trì hoạt động 3 ngày liên tiếp", quest_type: "weekly", conditions: { type: "streak", target: 3 }, xp_reward: 50, is_active: true },
        ]);
      }
    } catch (error) {
      console.error("Error seeding default data:", error);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // Seed all default data before completing
      await seedDefaultData();
      // Complete the onboarding
      await completeOnboarding.mutateAsync();
      toast.success("Thiết lập hoàn tất! Hệ thống hiệu suất đã được kích hoạt.");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Có lỗi xảy ra khi hoàn tất thiết lập");
    } finally {
      setIsCompleting(false);
    }
  };

  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary mb-4">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Thiết lập lần đầu</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">
          Thiết lập Hệ thống Hiệu suất
        </h1>
        <p className="text-muted-foreground">
          Hoàn thành 6 bước để kích hoạt hệ thống đánh giá và gamification
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Bước {currentStep} / {steps.length}
          </span>
          <span className="text-sm font-medium">
            {Math.round(progressPercent)}% hoàn thành
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between mb-8 overflow-x-auto pb-2">
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <div
              key={step.id}
              className={`flex flex-col items-center min-w-[80px] ${
                isActive ? "text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              <div
                className={`p-3 rounded-full mb-2 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-green-100 text-green-600"
                    : "bg-muted"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>
              <span className="text-xs font-medium text-center">{step.title}</span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && <IndustrySelector />}
          {currentStep === 2 && <OrgUnitBuilder />}
          {currentStep === 3 && <KBIFConfigurator />}
          {currentStep === 4 && <CareerPathSetup />}
          {currentStep === 5 && <EmployeeImporter />}
          {currentStep === 6 && <OnboardingReview />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        {currentStep < 6 ? (
          <Button onClick={handleNext}>
            Tiếp tục
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleComplete} 
            disabled={isCompleting}
            variant="default"
            className="bg-primary hover:bg-primary/90"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {isCompleting ? "Đang thiết lập..." : "Hoàn tất thiết lập"}
          </Button>
        )}
      </div>
    </div>
  );
}
