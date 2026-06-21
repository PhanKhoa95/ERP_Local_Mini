import { useAuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const { user, session, loading, signOut } = useAuthContext();
  return { user, session, loading, signOut };
}
