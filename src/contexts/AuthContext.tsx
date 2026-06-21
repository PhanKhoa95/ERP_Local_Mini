import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";
import {
  createLocalDemoSession,
  disableLocalDemoAuth,
  isLocalDemoAuthEnabled,
  LOCAL_DEMO_AUTH_EVENT,
  LOCAL_DEMO_COMPANY_ID,
} from "@/lib/localDemoAuth";

interface CompanyInfo {
  companyId: string | null;
  companyName: string | null;
  role: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  companyId: string | null;
  companyName: string | null;
  role: string | null;
  companyLoading: boolean;
  companyError: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyInfo>({ companyId: null, companyName: null, role: null });
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch company info when user changes
  const fetchCompany = useCallback(async (userId: string) => {
    setCompanyLoading(true);
    setCompanyError(null);
    try {
      const { data: membership, error } = await supabase
        .from("company_members")
        .select(`company_id, role, companies:company_id (id, name)`)
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          setCompany({ companyId: null, companyName: null, role: null });
        } else {
          throw error;
        }
      } else if (membership) {
        const comp = membership.companies as any;
        setCompany({
          companyId: membership.company_id,
          companyName: comp?.name || null,
          role: membership.role,
        });
      }
    } catch (err) {
      console.error("Error fetching company context:", err);
      setCompanyError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCompanyLoading(false);
    }
  }, []);

  const lastUserIdRef = useRef<string | null>(null);

  const activateLocalDemoAuth = useCallback(() => {
    const demoSession = createLocalDemoSession();
    setSession(demoSession);
    setUser(demoSession.user);
    const demoRole = localStorage.getItem("erp-mini-local-demo-role") || "admin";
    setCompany({
      companyId: LOCAL_DEMO_COMPANY_ID,
      companyName: "Local Demo Company",
      role: demoRole,
    });
    setCompanyError(null);
    setLoading(false);
    setCompanyLoading(false);
    lastUserIdRef.current = demoSession.user.id;
  }, []);

  useEffect(() => {
    const syncLocalDemoAuth = () => {
      if (isLocalDemoAuthEnabled()) {
        activateLocalDemoAuth();
      }
    };

    window.addEventListener(LOCAL_DEMO_AUTH_EVENT, syncLocalDemoAuth);

    if (isLocalDemoAuthEnabled()) {
      activateLocalDemoAuth();
      return () => window.removeEventListener(LOCAL_DEMO_AUTH_EVENT, syncLocalDemoAuth);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isLocalDemoAuthEnabled()) return;

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        const newId = session?.user?.id ?? null;
        // Skip refetch on TOKEN_REFRESHED / USER_UPDATED when user is unchanged
        if (newId && newId !== lastUserIdRef.current) {
          lastUserIdRef.current = newId;
          setTimeout(() => fetchCompany(newId), 0);
        } else if (!newId && lastUserIdRef.current) {
          lastUserIdRef.current = null;
          setCompany({ companyId: null, companyName: null, role: null });
          setCompanyLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isLocalDemoAuthEnabled()) {
        activateLocalDemoAuth();
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      const id = session?.user?.id ?? null;
      if (id && id !== lastUserIdRef.current) {
        lastUserIdRef.current = id;
        fetchCompany(id);
      } else if (!id) {
        setCompanyLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener(LOCAL_DEMO_AUTH_EVENT, syncLocalDemoAuth);
    };
  }, [activateLocalDemoAuth, fetchCompany]);

  const signOut = useCallback(async () => {
    if (isLocalDemoAuthEnabled()) {
      disableLocalDemoAuth();
      setSession(null);
      setUser(null);
      setCompany({ companyId: null, companyName: null, role: null });
      setCompanyLoading(false);
      lastUserIdRef.current = null;
      toast({ title: "Đã đăng xuất" });
      navigate("/auth");
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ variant: "destructive", title: "Lỗi đăng xuất", description: error.message });
    } else {
      toast({ title: "Đã đăng xuất" });
      navigate("/auth");
    }
  }, [navigate, toast]);

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      companyId: company.companyId,
      companyName: company.companyName,
      role: company.role,
      companyLoading,
      companyError,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
