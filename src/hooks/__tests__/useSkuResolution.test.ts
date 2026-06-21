import { describe, it, expect } from "vitest";

// Test SKU resolution logic (pure function tests without Supabase)

interface MockProduct {
  id: string;
  name: string;
  sku: string | null;
}

interface SkuMatch {
  sku: string;
  product_id: string;
  product_name: string;
  match_type: "exact_sku" | "ilike_sku" | "name_match";
  confidence: number;
}

function resolveSkusLocal(products: MockProduct[], skus: string[]) {
  const resolved: SkuMatch[] = [];
  const unresolved: string[] = [];

  for (const sku of [...new Set(skus.filter(Boolean))]) {
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

    // 3. Name partial match
    const nameMatch = products.find(
      (p) =>
        p.name?.toLowerCase().includes(sku.toLowerCase()) ||
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

describe("SKU Resolution Logic", () => {
  const products: MockProduct[] = [
    { id: "p1", name: "Áo thun trắng", sku: "AT-001" },
    { id: "p2", name: "Quần jean xanh", sku: "QJ-002" },
    { id: "p3", name: "Giày thể thao Nike", sku: "GTT-003" },
    { id: "p4", name: "Túi xách da", sku: null },
  ];

  it("resolves exact SKU match with 100% confidence", () => {
    const result = resolveSkusLocal(products, ["AT-001"]);
    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0].product_id).toBe("p1");
    expect(result.resolved[0].match_type).toBe("exact_sku");
    expect(result.resolved[0].confidence).toBe(100);
    expect(result.unresolved).toHaveLength(0);
  });

  it("resolves case-insensitive SKU with 90% confidence", () => {
    const result = resolveSkusLocal(products, ["at-001"]);
    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0].product_id).toBe("p1");
    expect(result.resolved[0].match_type).toBe("ilike_sku");
    expect(result.resolved[0].confidence).toBe(90);
  });

  it("resolves by name match with 50% confidence", () => {
    const result = resolveSkusLocal(products, ["Áo thun trắng"]);
    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0].product_id).toBe("p1");
    expect(result.resolved[0].match_type).toBe("name_match");
    expect(result.resolved[0].confidence).toBe(50);
  });

  it("reports unresolved SKUs", () => {
    const result = resolveSkusLocal(products, ["UNKNOWN-999"]);
    expect(result.resolved).toHaveLength(0);
    expect(result.unresolved).toContain("UNKNOWN-999");
  });

  it("handles multiple SKUs in batch", () => {
    const result = resolveSkusLocal(products, ["AT-001", "QJ-002", "MISSING"]);
    expect(result.resolved).toHaveLength(2);
    expect(result.unresolved).toHaveLength(1);
  });

  it("deduplicates input SKUs", () => {
    const result = resolveSkusLocal(products, ["AT-001", "AT-001", "AT-001"]);
    expect(result.resolved).toHaveLength(1);
  });

  it("filters empty SKUs", () => {
    const result = resolveSkusLocal(products, ["", "", "AT-001"]);
    expect(result.resolved).toHaveLength(1);
  });

  it("handles empty product list", () => {
    const result = resolveSkusLocal([], ["AT-001"]);
    expect(result.resolved).toHaveLength(0);
    expect(result.unresolved).toHaveLength(1);
  });

  it("handles empty SKU list", () => {
    const result = resolveSkusLocal(products, []);
    expect(result.resolved).toHaveLength(0);
    expect(result.unresolved).toHaveLength(0);
  });
});
