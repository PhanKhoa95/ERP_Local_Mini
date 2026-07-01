import type { Session, User } from "@supabase/supabase-js";

export const LOCAL_DEMO_AUTH_KEY = "erp-mini-local-demo-auth";
export const LOCAL_DEMO_AUTH_EVENT = "erp-mini-local-demo-auth-changed";

export const LOCAL_DEMO_COMPANY_ID = "00000000-0000-4000-8000-000000000001";
export const LOCAL_DEMO_USER_ID = "00000000-0000-4000-8000-000000000002";
export const LOCAL_DEMO_EMAIL = "admin@local.test";

export function isLocalDemoCredentials(email: string, password: string) {
  return import.meta.env.DEV && email.trim().toLowerCase() === "admin" && password === "admin";
}

export function isLocalDemoAuthEnabled() {
  const isEnabled = import.meta.env.DEV && localStorage.getItem(LOCAL_DEMO_AUTH_KEY) === "true";
  if (isEnabled && typeof window !== "undefined") {
    const currentVersion = "v9";
    if (localStorage.getItem("erp-mini-local-demo-version") !== currentVersion) {
      resetLocalDemoData();
      localStorage.setItem("erp-mini-local-demo-version", currentVersion);
      window.location.reload();
    }
  }
  return isEnabled;
}

export function enableLocalDemoAuth() {
  localStorage.setItem(LOCAL_DEMO_AUTH_KEY, "true");
  window.dispatchEvent(new Event(LOCAL_DEMO_AUTH_EVENT));
}

export function disableLocalDemoAuth() {
  localStorage.removeItem(LOCAL_DEMO_AUTH_KEY);
  window.dispatchEvent(new Event(LOCAL_DEMO_AUTH_EVENT));
}

export function createLocalDemoUser(): User {
  const now = new Date().toISOString();

  return {
    id: LOCAL_DEMO_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: LOCAL_DEMO_EMAIL,
    email_confirmed_at: now,
    phone: "",
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: { provider: "local-demo", providers: ["local-demo"] },
    user_metadata: { full_name: "Local Admin" },
    identities: [],
    created_at: now,
    updated_at: now,
    is_anonymous: false,
  } as User;
}

export function createLocalDemoSession(): Session {
  return {
    access_token: "local-demo-token",
    refresh_token: "local-demo-refresh-token",
    expires_in: 60 * 60 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    token_type: "bearer",
    user: createLocalDemoUser(),
  };
}

/** Clear all demo data keys (preserves auth state) so fresh seed data will load. */
export function resetLocalDemoData() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      key.startsWith("erp-mini-local-demo-") &&
      key !== LOCAL_DEMO_AUTH_KEY &&
      key !== "erp-mini-local-demo-role"
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
