import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("execute-workflow: requires authorization", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/execute-workflow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow_id: "test" }),
  });
  const body = await response.text();
  assertEquals(response.status, 401);
  const data = JSON.parse(body);
  assertExists(data.error);
});

Deno.test("execute-workflow: CORS preflight returns 200", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/execute-workflow`, {
    method: "OPTIONS",
    headers: { Origin: "http://localhost:3000" },
  });
  await response.text();
  assertEquals(response.status, 200);
});

Deno.test("execute-workflow: invalid token returns 401", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/execute-workflow`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid-token-here",
    },
    body: JSON.stringify({ workflow_id: "test-id", trigger_data: {} }),
  });
  const body = await response.text();
  assertEquals(response.status, 401);
});
