import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useAuthContext } from "@/contexts/AuthContext";

export type SensitiveAction = "token_issue" | "share_transfer" | "config_change" | "approve_expense" | "contract_sign";
export type StepUpMethod = "password" | "vneid" | "otp";

interface StepUpResult {
  approved: boolean;
  method?: StepUpMethod;
  vneid_verified?: boolean;
}

export function useStepUpAuth() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<SensitiveAction | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { companyId } = useCompanyContext();
  const { user } = useAuthContext();
  const resolveRef = useRef<((result: StepUpResult) => void) | null>(null);

  const requireStepUp = useCallback((action: SensitiveAction): Promise<StepUpResult> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setCurrentAction(action);
      setIsOpen(true);
    });
  }, []);

  const verifyPassword = useCallback(async (password: string): Promise<boolean> => {
    if (!user?.email) return false;
    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (error) return false;

      // Log sensitive action
      if (companyId) {
        await supabase.from("sensitive_action_logs" as any).insert({
          company_id: companyId,
          user_id: user.id,
          action_type: currentAction,
          step_up_method: "password",
          approved: true,
          metadata: { timestamp: new Date().toISOString() },
        });
      }

      return true;
    } catch {
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [user, companyId, currentAction]);

  const completeStepUp = useCallback((result: StepUpResult) => {
    setIsOpen(false);
    setCurrentAction(null);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const cancelStepUp = useCallback(() => {
    setIsOpen(false);
    setCurrentAction(null);
    resolveRef.current?.({ approved: false });
    resolveRef.current = null;
  }, []);

  return {
    isOpen,
    currentAction,
    isVerifying,
    requireStepUp,
    verifyPassword,
    completeStepUp,
    cancelStepUp,
  };
}
