import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { LOCAL_DEMO_COMPANY_ID, LOCAL_DEMO_USER_ID } from "@/lib/localDemoAuth";
import {
  buildProductionStockPlan,
  formatMaterialAvailabilityIssues,
  isPositiveQuantity,
  roundStockQuantity,
} from "@/lib/productionBom";

type Product = Tables<"products">;
type ProductInsert = TablesInsert<"products">;
type ProductUpdate = TablesUpdate<"products">;
type InventoryTransaction = Tables<"inventory_transactions">;
type ProductBom = Tables<"product_bom">;

export interface LocalProductCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  parent_id: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface LocalInventoryTransaction extends InventoryTransaction {
  products?: Pick<Product, "name" | "sku" | "company_id">;
}

export interface LocalProductBomItem extends ProductBom {
  material?: Product;
}

const PRODUCTS_KEY = "erp-mini-local-demo-products";
const CATEGORIES_KEY = "erp-mini-local-demo-product-categories";
const TRANSACTIONS_KEY = "erp-mini-local-demo-inventory-transactions";
const BOM_KEY = "erp-mini-local-demo-product-bom";

const DEFAULT_CATEGORIES: LocalProductCategory[] = [
  createCategorySeed("local-cat-finished-goods", "Thanh pham", "#2563EB", 1),
  createCategorySeed("local-cat-materials", "Nguyen vat lieu", "#16A34A", 2),
  createCategorySeed("local-cat-services", "Dich vu", "#9333EA", 3),
  createCategorySeed("local-cat-consumables", "Vat tu tieu hao", "#F59E0B", 4),
];

function createCategorySeed(id: string, name: string, color: string, sortOrder: number): LocalProductCategory {
  const timestamp = "2026-01-01T00:00:00.000Z";
  return {
    id,
    name,
    description: null,
    color,
    icon: null,
    parent_id: null,
    is_active: true,
    sort_order: sortOrder,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown storage error";
    throw new Error(`Khong the luu du lieu local. Anh hoac du lieu co the qua lon. ${message}`);
  }
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now() {
  return new Date().toISOString();
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() || null;
}

function assertUniqueSku(products: Product[], companyId: string, sku: string, ignoreId?: string) {
  const normalizedSku = sku.trim().toLowerCase();
  const duplicate = products.find(
    (product) =>
      product.company_id === companyId &&
      product.id !== ignoreId &&
      product.sku.trim().toLowerCase() === normalizedSku
  );
  if (duplicate) {
    throw new Error(`SKU "${sku}" da ton tai trong kho local.`);
  }
}

export function getLocalProducts(companyId = LOCAL_DEMO_COMPANY_ID): Product[] {
  return readJson<Product[]>(PRODUCTS_KEY, [])
    .filter((product) => product.company_id === companyId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function createLocalProduct(input: ProductInsert, companyId = LOCAL_DEMO_COMPANY_ID): Product {
  const products = readJson<Product[]>(PRODUCTS_KEY, []);
  assertUniqueSku(products, companyId, input.sku);

  const timestamp = now();
  const product: Product = {
    avg_daily_sales: input.avg_daily_sales ?? null,
    category: normalizeText(input.category),
    company_id: companyId,
    cost_price: input.cost_price ?? 0,
    created_at: input.created_at ?? timestamp,
    description: normalizeText(input.description),
    has_variants: input.has_variants ?? false,
    id: input.id ?? createId(),
    image_url: normalizeText(input.image_url),
    is_active: input.is_active ?? true,
    is_service: input.is_service ?? false,
    lead_time_days: input.lead_time_days ?? 0,
    min_stock: input.is_service ? 0 : input.min_stock ?? 0,
    name: input.name,
    reorder_point: input.reorder_point ?? null,
    selling_price: input.selling_price ?? 0,
    sku: input.sku,
    stock_quantity: input.is_service ? 0 : input.stock_quantity ?? 0,
    unit: normalizeText(input.unit) ?? "cai",
    updated_at: input.updated_at ?? timestamp,
  };

  writeJson(PRODUCTS_KEY, [product, ...products]);
  return product;
}

export function updateLocalProduct(input: ProductUpdate & { id: string }): Product {
  const products = readJson<Product[]>(PRODUCTS_KEY, []);
  const index = products.findIndex((product) => product.id === input.id);
  if (index < 0) throw new Error("Khong tim thay san pham local.");

  const current = products[index];
  if (input.sku) {
    assertUniqueSku(products, current.company_id ?? LOCAL_DEMO_COMPANY_ID, input.sku, input.id);
  }

  const updated: Product = {
    ...current,
    ...input,
    category: input.category !== undefined ? normalizeText(input.category) : current.category,
    description: input.description !== undefined ? normalizeText(input.description) : current.description,
    image_url: input.image_url !== undefined ? normalizeText(input.image_url) : current.image_url,
    unit: input.unit !== undefined ? normalizeText(input.unit) : current.unit,
    stock_quantity: input.is_service ? 0 : input.stock_quantity ?? current.stock_quantity,
    min_stock: input.is_service ? 0 : input.min_stock ?? current.min_stock,
    updated_at: now(),
  };

  products[index] = updated;
  writeJson(PRODUCTS_KEY, products);
  return updated;
}

export function deleteLocalProduct(id: string) {
  const products = readJson<Product[]>(PRODUCTS_KEY, []);
  writeJson(PRODUCTS_KEY, products.filter((product) => product.id !== id));

  const transactions = readJson<InventoryTransaction[]>(TRANSACTIONS_KEY, []);
  writeJson(TRANSACTIONS_KEY, transactions.filter((transaction) => transaction.product_id !== id));

  const bomItems = readJson<ProductBom[]>(BOM_KEY, []);
  writeJson(
    BOM_KEY,
    bomItems.filter((item) => item.product_id !== id && item.material_id !== id)
  );
}

export function upsertLocalProducts(rows: ProductInsert[], companyId = LOCAL_DEMO_COMPANY_ID) {
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const existing = getLocalProducts(companyId).find(
      (product) => product.sku.trim().toLowerCase() === row.sku.trim().toLowerCase()
    );
    if (existing) {
      updateLocalProduct({ id: existing.id, ...row, company_id: companyId });
      updated += 1;
    } else {
      createLocalProduct({ ...row, company_id: companyId }, companyId);
      created += 1;
    }
  }

  return { created, updated, total: created + updated };
}

export function getLocalProductCategories(): LocalProductCategory[] {
  const categories = readJson<LocalProductCategory[]>(CATEGORIES_KEY, []);
  if (categories.length === 0) {
    writeJson(CATEGORIES_KEY, DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
  return categories.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
}

export function createLocalProductCategory(input: Partial<LocalProductCategory> & { name: string }) {
  const categories = getLocalProductCategories();
  const duplicate = categories.find((category) => category.name.trim().toLowerCase() === input.name.trim().toLowerCase());
  if (duplicate) throw new Error(`Danh muc "${input.name}" da ton tai trong local.`);

  const timestamp = now();
  const category: LocalProductCategory = {
    id: input.id ?? createId(),
    name: input.name.trim(),
    description: input.description ?? null,
    color: input.color ?? "#3B82F6",
    icon: input.icon ?? null,
    parent_id: input.parent_id ?? null,
    is_active: input.is_active ?? true,
    sort_order: input.sort_order ?? categories.length + 1,
    created_at: input.created_at ?? timestamp,
    updated_at: input.updated_at ?? timestamp,
  };

  writeJson(CATEGORIES_KEY, [...categories, category]);
  return category;
}

export function updateLocalProductCategory(input: Partial<LocalProductCategory> & { id: string }) {
  const categories = getLocalProductCategories();
  const index = categories.findIndex((category) => category.id === input.id);
  if (index < 0) throw new Error("Khong tim thay danh muc local.");

  const updated = { ...categories[index], ...input, updated_at: now() };
  categories[index] = updated;
  writeJson(CATEGORIES_KEY, categories);
  return updated;
}

export function deleteLocalProductCategory(id: string) {
  const categories = getLocalProductCategories().filter((category) => category.id !== id);
  writeJson(CATEGORIES_KEY, categories);
}

export function getLocalInventoryTransactions(companyId = LOCAL_DEMO_COMPANY_ID): LocalInventoryTransaction[] {
  const products = getLocalProducts(companyId);
  const productMap = new Map(products.map((product) => [product.id, product]));
  return readJson<InventoryTransaction[]>(TRANSACTIONS_KEY, [])
    .filter((transaction) => productMap.has(transaction.product_id))
    .map((transaction) => {
      const product = productMap.get(transaction.product_id);
      return {
        ...transaction,
        products: product
          ? {
              name: product.name,
              sku: product.sku,
              company_id: product.company_id,
            }
          : undefined,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function createLocalInventoryTransaction(input: {
  product_id: string;
  transaction_type: "in" | "out";
  quantity: number;
  notes?: string | null;
}) {
  const products = readJson<Product[]>(PRODUCTS_KEY, []);
  const productIndex = products.findIndex((product) => product.id === input.product_id);
  if (productIndex < 0) throw new Error("Khong tim thay san pham local.");

  const product = products[productIndex];
  if (product.is_service) throw new Error("San pham dich vu khong quan ly ton kho.");
  if (!isPositiveQuantity(input.quantity)) throw new Error("So luong giao dich phai lon hon 0.");

  const delta = input.transaction_type === "in" ? input.quantity : -input.quantity;
  const currentStock = product.stock_quantity ?? 0;
  if (currentStock + delta < 0) {
    throw new Error(`Khong du ton kho. Chi con ${currentStock} san pham.`);
  }

  products[productIndex] = {
    ...product,
    stock_quantity: roundStockQuantity(currentStock + delta),
    updated_at: now(),
  };
  writeJson(PRODUCTS_KEY, products);

  const timestamp = now();
  const transaction: InventoryTransaction = {
    id: createId(),
    product_id: input.product_id,
    transaction_type: input.transaction_type,
    quantity: delta,
    notes: normalizeText(input.notes),
    reference_id: null,
    reference_type: "local-demo",
    created_by: LOCAL_DEMO_USER_ID,
    created_at: timestamp,
  };

  const transactions = readJson<InventoryTransaction[]>(TRANSACTIONS_KEY, []);
  writeJson(TRANSACTIONS_KEY, [transaction, ...transactions]);
  return transaction;
}

export function getLocalProductBom(productId?: string): LocalProductBomItem[] {
  if (!productId) return [];
  const products = readJson<Product[]>(PRODUCTS_KEY, []);
  const productMap = new Map(products.map((product) => [product.id, product]));
  return readJson<ProductBom[]>(BOM_KEY, [])
    .filter((item) => item.product_id === productId)
    .map((item) => ({ ...item, material: productMap.get(item.material_id) }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function getLocalProductsWithBom() {
  return [
    ...new Set(
      readJson<ProductBom[]>(BOM_KEY, [])
        .filter((item) => item.is_active !== false)
        .map((item) => item.product_id)
    ),
  ];
}

export function addLocalBomItem(input: {
  product_id: string;
  material_id: string;
  quantity: number;
  unit?: string;
  notes?: string;
}) {
  if (!isPositiveQuantity(input.quantity)) {
    throw new Error("Dinh muc BOM phai lon hon 0.");
  }

  if (input.product_id === input.material_id) {
    throw new Error("Khong the them san pham lam NVL cua chinh no.");
  }

  const items = readJson<ProductBom[]>(BOM_KEY, []);
  const duplicate = items.find(
    (item) => item.product_id === input.product_id && item.material_id === input.material_id
  );
  if (duplicate) throw new Error("Nguyen vat lieu nay da ton tai trong BOM.");

  const timestamp = now();
  const item: ProductBom = {
    id: createId(),
    product_id: input.product_id,
    material_id: input.material_id,
    quantity: input.quantity,
    unit: normalizeText(input.unit),
    notes: normalizeText(input.notes),
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  };

  writeJson(BOM_KEY, [...items, item]);
  return item;
}

export function updateLocalBomItem(id: string, updates: Partial<ProductBom>) {
  const items = readJson<ProductBom[]>(BOM_KEY, []);
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Khong tim thay BOM local.");
  if (updates.quantity !== undefined && !isPositiveQuantity(Number(updates.quantity))) {
    throw new Error("Dinh muc BOM phai lon hon 0.");
  }

  const updated = { ...items[index], ...updates, updated_at: now() };
  items[index] = updated;
  writeJson(BOM_KEY, items);
  return updated;
}

export function deleteLocalBomItem(id: string) {
  const items = readJson<ProductBom[]>(BOM_KEY, []);
  writeJson(BOM_KEY, items.filter((item) => item.id !== id));
}

export function applyLocalProductionCompletion(input: {
  productionOrderId: string;
  productionNumber: string;
  productId: string;
  quantity: number;
}) {
  const products = readJson<Product[]>(PRODUCTS_KEY, []);
  const productIndex = products.findIndex((product) => product.id === input.productId);
  if (productIndex < 0) throw new Error("Khong tim thay thanh pham local.");

  const finishedProduct = products[productIndex];
  const productMap = new Map(products.map((product) => [product.id, product]));
  const bomItems = readJson<ProductBom[]>(BOM_KEY, [])
    .filter((item) => item.product_id === input.productId)
    .map((item) => ({ ...item, material: productMap.get(item.material_id) }));

  const plan = buildProductionStockPlan({
    finishedProduct,
    productionQuantity: input.quantity,
    bomItems,
    productionNumber: input.productionNumber,
  });

  if (!plan.canComplete) {
    throw new Error(`Khong du nguyen vat lieu: ${formatMaterialAvailabilityIssues(plan.issues)}`);
  }

  const timestamp = now();
  const updatedProducts = [...products];

  for (const move of plan.materialMoves) {
    const materialIndex = updatedProducts.findIndex((product) => product.id === move.product_id);
    if (materialIndex < 0) throw new Error("Khong tim thay nguyen vat lieu local.");
    const material = updatedProducts[materialIndex];
    updatedProducts[materialIndex] = {
      ...material,
      stock_quantity: roundStockQuantity((material.stock_quantity ?? 0) + move.signedQuantity),
      updated_at: timestamp,
    };
  }

  updatedProducts[productIndex] = {
    ...updatedProducts[productIndex],
    stock_quantity: plan.finishedStockAfter,
    cost_price: plan.finishedCostPriceAfter,
    updated_at: timestamp,
  };

  writeJson(PRODUCTS_KEY, updatedProducts);

  const transactions = readJson<InventoryTransaction[]>(TRANSACTIONS_KEY, []);
  const productionTransactions: InventoryTransaction[] = [
    ...plan.materialMoves.map((move) => ({
      id: createId(),
      product_id: move.product_id,
      transaction_type: move.transaction_type,
      quantity: move.signedQuantity,
      reference_id: input.productionOrderId,
      reference_type: "production_bom",
      notes: move.notes,
      created_by: LOCAL_DEMO_USER_ID,
      created_at: timestamp,
    })),
    {
      id: createId(),
      product_id: plan.finishedGoodMove.product_id,
      transaction_type: plan.finishedGoodMove.transaction_type,
      quantity: plan.finishedGoodMove.signedQuantity,
      reference_id: input.productionOrderId,
      reference_type: "production_finished_good",
      notes: plan.finishedGoodMove.notes,
      created_by: LOCAL_DEMO_USER_ID,
      created_at: timestamp,
    },
  ];

  writeJson(TRANSACTIONS_KEY, [...productionTransactions, ...transactions]);
  return plan;
}
