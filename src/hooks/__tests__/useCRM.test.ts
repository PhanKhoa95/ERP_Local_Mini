import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCRM } from "../useCRM";

// Mock dependencies
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
  useQuery: (config: any) => {
    // Return appropriate seed structure depending on queryKey
    const key = config.queryKey[0];
    if (key === "crm_leads") {
      return {
        data: [{ id: "lead-test-1", company_id: "company-test", name: "Lead Test A", phone: "0999999999", email: "testa@test.com", source: "website", status: "new", notes: "Test lead notes", created_at: new Date().toISOString() }],
        isLoading: false
      };
    }
    if (key === "crm_contacts") {
      return {
        data: [{ id: "cont-test-1", company_id: "company-test", company_map_id: "comp-test-1", name: "Contact Test", phone: "0911111222", email: "contact@test.com", notes: "Notes", created_at: new Date().toISOString() }],
        isLoading: false
      };
    }
    if (key === "crm_api_keys") {
      return {
        data: [{ id: "key-test-1", company_id: "company-test", key_name: "Test Key", api_key: "crm_api_live_sample12345", created_at: new Date().toISOString() }],
        isLoading: false
      };
    }
    return { data: [], isLoading: false };
  },
  useMutation: (config: any) => ({
    mutateAsync: async (variables: any) => {
      return config.mutationFn(variables);
    }
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    fetchQuery: async () => [
      { id: "key-test-1", company_id: "company-test", key_name: "Test Key", api_key: "crm_api_live_sample12345", created_at: new Date().toISOString() }
    ]
  })
}));

describe("Pancake CRM advanced business logic tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should initialize crm hook advanced states correctly", () => {
    const crm = useCRM();
    expect(crm.contacts).toBeDefined();
    expect(crm.companies).toBeDefined();
    expect(crm.customFields).toBeDefined();
    expect(crm.apiKeys).toBeDefined();
  });

  it("should allow status change of leads", async () => {
    const crm = useCRM();
    const result = await crm.updateLeadStatus.mutateAsync({
      id: "lead-test-1",
      status: "contacting"
    });
    expect(result).toBeDefined();
    expect(result.status).toBe("contacting");
  });

  it("should generate a new API key correctly", async () => {
    const crm = useCRM();
    const newKey = await crm.createApiKey.mutateAsync("New Marketing Key");
    expect(newKey).toBeDefined();
    expect(newKey.key_name).toBe("New Marketing Key");
    expect(newKey.api_key).toContain("crm_api_live_");
  });

  it("should ingest lead data using a valid API Key webhook simulation", async () => {
    const crm = useCRM();
    const result = await crm.simulateWebhookIngest.mutateAsync({
      apiKey: "crm_api_live_sample12345",
      name: "Webhook Lead",
      phone: "0900000000",
      notes: "Integration test"
    });
    expect(result).toBeDefined();
    expect(result.name).toBe("Webhook Lead");
    expect(result.source).toBe("website");
  });

  it("should reject webhook simulation if API Key is invalid", async () => {
    const crm = useCRM();
    await expect(crm.simulateWebhookIngest.mutateAsync({
      apiKey: "invalid_key",
      name: "Fake Lead",
      phone: "0900000000"
    })).rejects.toThrow("Mã API Key không hợp lệ hoặc đã bị vô hiệu hóa!");
  });
});
