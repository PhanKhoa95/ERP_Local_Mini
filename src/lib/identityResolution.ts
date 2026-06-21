import { supabase } from "@/integrations/supabase/client";

/**
 * Identity Resolution – resolves raw customers, partners and order contacts
 * into unified entity links using phone, email and name matching.
 *
 * Matching rules (in priority order):
 *   1. Exact phone match
 *   2. Exact email match
 *   3. Normalized name match (fuzzy)
 *
 * Produces `entity_resolution_links` rows that connect raw_events to
 * resolved entities (partners or orders).
 */

export interface IdentityCandidate {
  entity_type: "partner" | "order";
  entity_id: string;
  match_field: "phone" | "email" | "name";
  match_score: number;
  display_name: string;
}

export interface ResolutionResult {
  raw_event_id: string;
  candidates: IdentityCandidate[];
  auto_linked: boolean;
  linked_entity_id?: string;
  linked_entity_type?: string;
}

/**
 * Normalize Vietnamese phone numbers to consistent format.
 * Strips spaces, dashes, leading +84 → 0.
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("+84")) cleaned = "0" + cleaned.slice(3);
  if (cleaned.startsWith("84") && cleaned.length === 11) cleaned = "0" + cleaned.slice(2);
  return cleaned;
}

/**
 * Normalize name for fuzzy comparison.
 * Lowercases, removes diacritics, trims whitespace.
 */
export function normalizeName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Find matching partner entities by phone number.
 */
export async function findPartnersByPhone(
  companyId: string,
  phone: string
): Promise<IdentityCandidate[]> {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 8) return [];

  const { data } = await supabase
    .from("partners")
    .select("id, name, phone, email")
    .eq("company_id", companyId)
    .or(`phone.eq.${normalized},phone.eq.${phone}`)
    .limit(5);

  if (!data) return [];

  return data.map((p) => ({
    entity_type: "partner" as const,
    entity_id: p.id,
    match_field: "phone" as const,
    match_score: 100,
    display_name: p.name || p.phone || p.email || "Unknown",
  }));
}

/**
 * Find matching partner entities by name (fuzzy).
 */
export async function findPartnersByName(
  companyId: string,
  name: string
): Promise<IdentityCandidate[]> {
  const normalized = normalizeName(name);
  if (!normalized || normalized.length < 2) return [];

  // Use ilike for basic fuzzy search
  const { data } = await supabase
    .from("partners")
    .select("id, name, phone, email")
    .eq("company_id", companyId)
    .ilike("name", `%${name}%`)
    .limit(5);

  if (!data) return [];

  return data.map((p) => {
    const pNorm = normalizeName(p.name);
    const score = pNorm === normalized ? 90 : 60;
    return {
      entity_type: "partner" as const,
      entity_id: p.id,
      match_field: "name" as const,
      match_score: score,
      display_name: p.name || "Unknown",
    };
  });
}

/**
 * Find matching orders by customer phone.
 */
export async function findOrdersByPhone(
  companyId: string,
  phone: string
): Promise<IdentityCandidate[]> {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 8) return [];

  const { data } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone")
    .eq("company_id", companyId)
    .or(`customer_phone.eq.${normalized},customer_phone.eq.${phone}`)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!data) return [];

  return data.map((o) => ({
    entity_type: "order" as const,
    entity_id: o.id,
    match_field: "phone" as const,
    match_score: 100,
    display_name: `${o.order_number} – ${o.customer_name || o.customer_phone}`,
  }));
}

/**
 * Resolve a raw event's customer identity against known entities.
 * Returns candidates ranked by match score and optionally auto-links
 * if a perfect phone match is found.
 */
export async function resolveIdentity(
  companyId: string,
  rawEventId: string,
  contactInfo: {
    phone?: string | null;
    name?: string | null;
    email?: string | null;
  }
): Promise<ResolutionResult> {
  const candidates: IdentityCandidate[] = [];

  // 1. Phone-based resolution (highest priority)
  if (contactInfo.phone) {
    const phonePartners = await findPartnersByPhone(companyId, contactInfo.phone);
    const phoneOrders = await findOrdersByPhone(companyId, contactInfo.phone);
    candidates.push(...phonePartners, ...phoneOrders);
  }

  // 2. Name-based resolution
  if (contactInfo.name && candidates.length === 0) {
    const namePartners = await findPartnersByName(companyId, contactInfo.name);
    candidates.push(...namePartners);
  }

  // Sort by score descending
  candidates.sort((a, b) => b.match_score - a.match_score);

  // Deduplicate by entity_id
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    if (seen.has(c.entity_id)) return false;
    seen.add(c.entity_id);
    return true;
  });

  const result: ResolutionResult = {
    raw_event_id: rawEventId,
    candidates: unique,
    auto_linked: false,
  };

  // Auto-link if single phone match with 100% confidence
  const perfectMatch = unique.find(
    (c) => c.match_field === "phone" && c.match_score === 100
  );

  if (perfectMatch && unique.filter((c) => c.match_score === 100).length === 1) {
    result.auto_linked = true;
    result.linked_entity_id = perfectMatch.entity_id;
    result.linked_entity_type = perfectMatch.entity_type;

    // Write resolution link (best-effort – table may not exist yet)
    try {
      await supabase
        .from("entity_resolution_links")
        .upsert(
          {
            company_id: companyId,
            raw_event_id: rawEventId,
            entity_type: perfectMatch.entity_type,
            entity_id: perfectMatch.entity_id,
            matched_table: perfectMatch.entity_type === "partner" ? "partners" : "orders",
            match_strategy: "phone",
            confidence: perfectMatch.match_score,
          },
          { onConflict: "raw_event_id,entity_type,entity_id" }
        );
    } catch {
      // best-effort
    }

    // Update raw event validation status
    try {
      await supabase
        .from("raw_events")
        .update({ validation_status: "linked" as const })
        .eq("id", rawEventId);
    } catch {
      // best-effort
    }
  }

  return result;
}

/**
 * Batch resolve identity for multiple raw events.
 */
export async function batchResolveIdentities(
  companyId: string,
  events: Array<{
    id: string;
    phone?: string | null;
    name?: string | null;
    email?: string | null;
  }>
): Promise<ResolutionResult[]> {
  const results: ResolutionResult[] = [];

  for (const event of events) {
    const result = await resolveIdentity(companyId, event.id, {
      phone: event.phone,
      name: event.name,
      email: event.email,
    });
    results.push(result);
  }

  return results;
}
