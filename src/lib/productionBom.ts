export const STOCK_PRECISION = 4;
const STOCK_FACTOR = 10 ** STOCK_PRECISION;
const EPSILON = 1 / STOCK_FACTOR / 10;

export interface ProductionProductSnapshot {
  id: string;
  name?: string | null;
  sku?: string | null;
  unit?: string | null;
  stock_quantity?: number | null;
  cost_price?: number | null;
  is_service?: boolean | null;
}

export interface ProductionBomItemSnapshot {
  id?: string;
  product_id: string;
  material_id: string;
  quantity: number;
  unit?: string | null;
  is_active?: boolean | null;
  material?: ProductionProductSnapshot | null;
}

export interface MaterialAvailabilityIssue {
  material_id: string;
  material_name: string;
  material_sku: string | null;
  required: number;
  available: number;
  shortage: number;
  unit: string | null;
}

export interface ProductionStockMove {
  product_id: string;
  transaction_type: "in" | "out";
  quantity: number;
  signedQuantity: number;
  notes: string;
}

export interface ProductionStockPlan {
  canComplete: boolean;
  issues: MaterialAvailabilityIssue[];
  finishedGoodMove: ProductionStockMove;
  materialMoves: ProductionStockMove[];
  totalMaterialCost: number;
  unitMaterialCost: number;
  finishedStockAfter: number;
  finishedCostPriceAfter: number;
}

function asFiniteNumber(value: number | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function roundStockQuantity(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * STOCK_FACTOR) / STOCK_FACTOR;
}

export function isPositiveQuantity(value: number) {
  return Number.isFinite(value) && value > 0;
}

export function hasSufficientStock(available: number, required: number) {
  return available + EPSILON >= required;
}

function formatProductLabel(product?: ProductionProductSnapshot | null) {
  if (!product) return "Unknown material";
  return product.name || product.sku || product.id;
}

export function buildProductionStockPlan(params: {
  finishedProduct: ProductionProductSnapshot;
  productionQuantity: number;
  bomItems: ProductionBomItemSnapshot[];
  productionNumber?: string | null;
}): ProductionStockPlan {
  const { finishedProduct, productionQuantity, bomItems, productionNumber } = params;
  const quantity = roundStockQuantity(productionQuantity);

  if (!isPositiveQuantity(quantity)) {
    throw new Error("Production quantity must be greater than zero.");
  }

  if (finishedProduct.is_service) {
    throw new Error("Service products cannot be produced with BOM stock movements.");
  }

  const groupedMaterials = new Map<
    string,
    {
      material: ProductionProductSnapshot | null | undefined;
      required: number;
      unit: string | null;
    }
  >();

  for (const item of bomItems) {
    if (item.is_active === false) continue;
    if (!isPositiveQuantity(Number(item.quantity))) continue;
    if (item.material?.is_service) continue;

    const required = roundStockQuantity(quantity * Number(item.quantity));
    const existing = groupedMaterials.get(item.material_id);
    groupedMaterials.set(item.material_id, {
      material: item.material,
      required: roundStockQuantity((existing?.required ?? 0) + required),
      unit: item.unit ?? item.material?.unit ?? existing?.unit ?? null,
    });
  }

  const issues: MaterialAvailabilityIssue[] = [];
  const materialMoves: ProductionStockMove[] = [];
  let totalMaterialCost = 0;

  groupedMaterials.forEach(({ material, required, unit }, materialId) => {
    const available = roundStockQuantity(asFiniteNumber(material?.stock_quantity));
    const shortage = roundStockQuantity(Math.max(0, required - available));
    const label = formatProductLabel(material);

    if (!material || !hasSufficientStock(available, required)) {
      issues.push({
        material_id: materialId,
        material_name: label,
        material_sku: material?.sku ?? null,
        required,
        available,
        shortage,
        unit,
      });
    }

    totalMaterialCost = roundStockQuantity(
      totalMaterialCost + required * asFiniteNumber(material?.cost_price)
    );
    materialMoves.push({
      product_id: materialId,
      transaction_type: "out",
      quantity: required,
      signedQuantity: -required,
      notes: `BOM consumption - Production ${productionNumber || finishedProduct.sku || finishedProduct.id}`,
    });
  });

  const currentFinishedStock = roundStockQuantity(asFiniteNumber(finishedProduct.stock_quantity));
  const currentFinishedCost = asFiniteNumber(finishedProduct.cost_price);
  const finishedStockAfter = roundStockQuantity(currentFinishedStock + quantity);
  const unitMaterialCost = quantity > 0 ? roundStockQuantity(totalMaterialCost / quantity) : 0;
  const finishedCostPriceAfter =
    totalMaterialCost > 0 && finishedStockAfter > 0
      ? roundStockQuantity(
          (currentFinishedStock * currentFinishedCost + totalMaterialCost) / finishedStockAfter
        )
      : currentFinishedCost;

  return {
    canComplete: issues.length === 0,
    issues,
    finishedGoodMove: {
      product_id: finishedProduct.id,
      transaction_type: "in",
      quantity,
      signedQuantity: quantity,
      notes: `Finished goods receipt - Production ${productionNumber || finishedProduct.sku || finishedProduct.id}`,
    },
    materialMoves,
    totalMaterialCost,
    unitMaterialCost,
    finishedStockAfter,
    finishedCostPriceAfter,
  };
}

export function formatMaterialAvailabilityIssues(issues: MaterialAvailabilityIssue[]) {
  return issues
    .map((issue) => {
      const sku = issue.material_sku ? ` (${issue.material_sku})` : "";
      const unit = issue.unit ? ` ${issue.unit}` : "";
      return `${issue.material_name}${sku}: need ${issue.required}${unit}, available ${issue.available}${unit}`;
    })
    .join("; ");
}
