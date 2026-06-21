import { useAuthContext } from "@/contexts/AuthContext";

export function useCompanyContext() {
  const { companyId, companyName, role, companyLoading, companyError } = useAuthContext();
  return {
    companyId,
    companyName,
    role,
    loading: companyLoading,
    error: companyError,
  };
}
