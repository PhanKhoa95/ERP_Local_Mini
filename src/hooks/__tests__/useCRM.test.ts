import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCRM } from "../useCRM";

// Mock global dependencies if any (like supabase and localDemoAuth)
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn()
  }
}));

vi.mock("@/lib/localDemoAuth", () => ({
  isLocalDemoAuthEnabled: () => true
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock("@/hooks/useCompanyContext", () => ({
  useCompanyContext: () => ({
    companyId: "company-test"
  })
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: [
      { id: "lead-test-1", company_id: "company-test", name: "Lead Test A", phone: "0999999999", email: "testa@test.com", source: "website", status: "new", notes: "Test lead notes", created_at: new Date().toISOString() }
    ],
    isLoading: false
  }),
  useMutation: (config: any) => ({
    mutateAsync: async (variables: any) => {
      return config.mutationFn(variables);
    }
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn()
  })
}));

describe("Pancake CRM business logic tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should initialize crm hook fields correctly in mock mode", () => {
    const crm = useCRM();
    expect(crm.leads).toBeDefined();
    expect(crm.deals).toBeDefined();
    expect(crm.appointments).toBeDefined();
    expect(crm.tickets).toBeDefined();
    expect(crm.tasks).toBeDefined();
  });

  it("should allow status change of leads", async () => {
    const crm = useCRM();
    // Simulate mutationFn trigger manually for local state testing
    const result = await crm.updateLeadStatus.mutateAsync({
      id: "lead-test-1",
      status: "contacting"
    });
    expect(result).toBeDefined();
    expect(result.status).toBe("contacting");
  });
});
