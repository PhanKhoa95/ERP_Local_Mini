import { supabase } from "@/integrations/supabase/client";

/**
 * SKU Resolution – maps product SKU strings from import files to
 * actual product_id values in the products table.
 *
 * Matching rules:
 *   1. Exact SKU match
 *   2. Case-insensitive SKU match
 *   3. Name-based partial match (fallback)
 */

export interface SkuMatch {
  sku: string;
  product_id: string;
  product_name: string;
  match_type: "exact_sku" | "ilike_sku" | "name_match";
  confidence: number;
}

export interface SkuResolutionResult {
  resolved: SkuMatch[];
  unresolved: string[];
}

/**
 * Resolve a batch of SKUs to product IDs for a given company.
 */
export async function resolveSkus(
  companyId: string,
  skus: string[]
): Promise<SkuResolutionResult> {
  const uniqueSkus = [...new Set(skus.filter(Boolean))];
  if (uniqueSkus.length === 0) return { resolved: [], unresolved: [] };

  // Fetch all company products for matching
  const { data: products } = await supabase
    .from("products")
    .select("id, name, sku")
    .eq("company_id", companyId);

  if (!products || products.length === 0) {
    return { resolved: [], unresolved: uniqueSkus };
  }

  const resolved: SkuMatch[] = [];
  const unresolved: string[] = [];

  for (const sku of uniqueSkus) {
    // 1. Exact SKU match
    const exactMatch = products.find((p) => p.sku === sku);
    if (exactMatch) {
      resolved.push({
        sku,
        product_id: exactMatch.id,
        product_name: exactMatch.name,
        match_type: "exact_sku",
        confidence: 100,
      });
      continue;
    }

    // 2. Case-insensitive SKU match
    const caseMatch = products.find(
      (p) => p.sku?.toLowerCase() === sku.toLowerCase()
    );
    if (caseMatch) {
      resolved.push({
        sku,
        product_id: caseMatch.id,
        product_name: caseMatch.name,
        match_type: "ilike_sku",
        confidence: 90,
      });
      continue;
    }

    // 3. Name partial match (last resort)
    const nameMatch = products.find(
      (p) => p.name?.toLowerCase().includes(sku.toLowerCase()) ||
             sku.toLowerCase().includes(p.name?.toLowerCase() || "___")
    );
    if (nameMatch) {
      resolved.push({
        sku,
        product_id: nameMatch.id,
        product_name: nameMatch.name,
        match_type: "name_match",
        confidence: 50,
      });
      continue;
    }

    unresolved.push(sku);
  }

  return { resolved, unresolved };
}

/**
 * Look up a single SKU and return the product_id or null.
 */
export async function lookupSku(
  companyId: string,
  sku: string
): Promise<string | null> {
  const result = await resolveSkus(companyId, [sku]);
  return result.resolved.length > 0 ? result.resolved[0].product_id : null;
}
