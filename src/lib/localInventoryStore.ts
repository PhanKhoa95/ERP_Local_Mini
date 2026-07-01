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
  createCategorySeed("local-cat-materials", "Vat tu & Muc in", "#16A34A", 2),
  createCategorySeed("local-cat-services", "Dich vu", "#9333EA", 3),
  createCategorySeed("local-cat-combos", "Combo & Bo san pham", "#F59E0B", 4),
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

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "local-prod-sticker",
    name: "Sticker logo decal giấy",
    sku: "PRD-STICKER",
    category: "Thanh pham",
    company_id: LOCAL_DEMO_COMPANY_ID,
    cost_price: 44275,
    selling_price: 99000,
    stock_quantity: 450,
    min_stock: 50,
    unit: "tem",
    is_active: true,
    is_service: false,
    lead_time_days: 2,
    has_variants: false,
    avg_daily_sales: null,
    reorder_point: null,
    image_url: null,
    description: "100 tem tròn/vuông decal giấy, cán màng bóng/mờ",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "local-prod-card",
    name: "Card cảm ơn / Thank you card",
    sku: "PRD-CARD",
    category: "Thanh pham",
    company_id: LOCAL_DEMO_COMPANY_ID,
    cost_price: 56875,
    selling_price: 119000,
    stock_quantity: 600,
    min_stock: 100,
    unit: "cái",
    is_active: true,
    is_service: false,
    lead_time_days: 2,
    has_variants: false,
    avg_daily_sales: null,
    reorder_point: null,
    image_url: null,
    description: "100 card C250/C300 cắt sẵn",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "local-prod-qr-board",
    name: "Bảng QR để bàn mica",
    sku: "PRD-QR-BOARD",
    category: "Thanh pham",
    company_id: LOCAL_DEMO_COMPANY_ID,
    cost_price: 50575,
    selling_price: 109000,
    stock_quantity: 80,
    min_stock: 10,
    unit: "cái",
    is_active: true,
    is_service: false,
    lead_time_days: 3,
    has_variants: false,
    avg_daily_sales: null,
    reorder_point: null,
    image_url: null,
    description: "01 bảng QR mica/formex để bàn",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "local-prod-qr-sticker",
    name: "Tem QR thanh toán decal",
    sku: "PRD-QR-STICKER",
    category: "Thanh pham",
    company_id: LOCAL_DEMO_COMPANY_ID,
    cost_price: 25900,
    selling_price: 69000,
    stock_quantity: 200,
    min_stock: 20,
    unit: "tem",
    is_active: true,
    is_service: false,
    lead_time_days: 1,
    has_variants: false,
    avg_daily_sales: null,
    reorder_point: null,
    image_url: null,
    description: "50 tem QR decal siêu nét",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "local-prod-qr-card",
    name: "Thẻ QR cá nhân thông minh",
    sku: "PRD-QR-CARD",
    category: "Thanh pham",
    company_id: LOCAL_DEMO_COMPANY_ID,
    cost_price: 27388,
    selling_price: 69000,
    stock_quantity: 150,
    min_stock: 15,
    unit: "thẻ",
    is_active: true,
    is_service: false,
    lead_time_days: 2,
    has_variants: false,
    avg_daily_sales: null,
    reorder_point: null,
    image_url: null,
    description: "01 thẻ QR cá nhân/cửa hàng bỏ ví",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "local-prod-combo-new",
    name: "Combo Shop Mới Khởi Nghiệp",
    sku: "PRD-COMBO-NEW",
    category: "Thanh pham",
    company_id: LOCAL_DEMO_COMPANY_ID,
    cost_price: 173513,
    selling_price: 349000,
    stock_quantity: 40,
    min_stock: 5,
    unit: "bộ",
    is_active: true,
    is_service: false,
    lead_time_days: 4,
    has_variants: false,
    avg_daily_sales: null,
    reorder_point: null,
    image_url: null,
    description: "100 tem + 100 card + 01 bảng QR + avatar số",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "local-prod-design-qr",
    name: "Dịch vụ thiết kế Avatar & QR",
    sku: "PRD-DESIGN-QR",
    category: "Dich vu",
    company_id: LOCAL_DEMO_COMPANY_ID,
    cost_price: 40000,
    selling_price: 149000,
    stock_quantity: 0,
    min_stock: 0,
    unit: "gói",
    is_active: true,
    is_service: true,
    lead_time_days: 0,
    has_variants: false,
    avg_daily_sales: null,
    reorder_point: null,
    image_url: null,
    description: "01 gói file số dùng Zalo/Facebook/Shopee",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "local-prod-box",
    name: "Bao bì / Hộp gia công nhỏ",
    sku: "PRD-BOX",
    category: "Thanh pham",
    company_id: LOCAL_DEMO_COMPANY_ID,
    cost_price: 119438,
    selling_price: 179000,
    stock_quantity: 200,
    min_stock: 30,
    unit: "cái",
    is_active: true,
    is_service: false,
    lead_time_days: 5,
    has_variants: false,
    avg_daily_sales: null,
    reorder_point: null,
    image_url: null,
    description: "01 đơn nhỏ gia công hộp/túi/nhãn",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "local-mat-decal",
    name: "Giấy decal bóng (A4)",
    sku: "MAT-DECAL",
    category: "Vat tu & Muc in",
    company_id: LOCAL_DEMO_COMPANY_ID,
    cost_price: 1500,
    selling_price: 3000,
    stock_quantity: 1000,
    min_stock: 100,
    unit: "tờ",
    is_active: true,
    is_service: false,
    lead_time_days: 1,
    has_variants: false,
    avg_daily_sales: null,
    reorder_point: null,
    image_url: null,
    description: "Decal giấy để vàng in tem nhãn",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "local-mat-couche",
    name: "Giấy Couche 300gsm (A4)",
    sku: "MAT-COUCHE",
    category: "Vat tu & Muc in",
    company_id: LOCAL_DEMO_COMPANY_ID,
    cost_price: 2000,
    selling_price: 4000,
    stock_quantity: 1500,
    min_stock: 200,
    unit: "tờ",
    is_active: true,
    is_service: false,
    lead_time_days: 1,
    has_variants: false,
    avg_daily_sales: null,
    reorder_point: null,
    image_url: null,
    description: "Giấy Couche bóng in card/tờ rơi",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "local-mat-ink",
    name: "Mực in Pigment (ml)",
    sku: "MAT-INK",
    category: "Vat tu & Muc in",
    company_id: LOCAL_DEMO_COMPANY_ID,
    cost_price: 500,
    selling_price: 1000,
    stock_quantity: 2000,
    min_stock: 500,
    unit: "ml",
    is_active: true,
    is_service: false,
    lead_time_days: 1,
    has_variants: false,
    avg_daily_sales: null,
    reorder_point: null,
    image_url: null,
    description: "Mực in dầu Pigment bền màu",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "local-mat-mica",
    name: "Tấm mica trong 2mm (A4 size)",
    sku: "MAT-MICA",
    category: "Vat tu & Muc in",
    company_id: LOCAL_DEMO_COMPANY_ID,
    cost_price: 15000,
    selling_price: 30000,
    stock_quantity: 200,
    min_stock: 20,
    unit: "tấm",
    is_active: true,
    is_service: false,
    lead_time_days: 2,
    has_variants: false,
    avg_daily_sales: null,
    reorder_point: null,
    image_url: null,
    description: "Tấm Mica Đài Loan trong suốt 2mm",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "local-mat-formex",
    name: "Tấm Formex 3mm (A4 size)",
    sku: "MAT-FORMEX",
    category: "Vat tu & Muc in",
    company_id: LOCAL_DEMO_COMPANY_ID,
    cost_price: 8000,
    selling_price: 16000,
    stock_quantity: 300,
    min_stock: 30,
    unit: "tấm",
    is_active: true,
    is_service: false,
    lead_time_days: 1,
    has_variants: false,
    avg_daily_sales: null,
    reorder_point: null,
    image_url: null,
    description: "Tấm Formex trắng 3mm làm chân dựng",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "local-mat-box",
    name: "Hộp carton & băng keo",
    sku: "MAT-BOX",
    category: "Vat tu & Muc in",
    company_id: LOCAL_DEMO_COMPANY_ID,
    cost_price: 3000,
    selling_price: 6000,
    stock_quantity: 500,
    min_stock: 50,
    unit: "bộ",
    is_active: true,
    is_service: false,
    lead_time_days: 1,
    has_variants: false,
    avg_daily_sales: null,
    reorder_point: null,
    image_url: null,
    description: "Hộp đóng hàng và vật tư đóng gói",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  }
];

const DEFAULT_BOM_ITEMS: ProductBom[] = [
  // BOM for local-prod-sticker (100 stickers)
  {
    id: "local-bom-1",
    product_id: "local-prod-sticker",
    material_id: "local-mat-decal",
    quantity: 1.5,
    unit: "tờ",
    notes: "Decal giấy đế vàng",
    is_active: true,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "local-bom-2",
    product_id: "local-prod-sticker",
    material_id: "local-mat-ink",
    quantity: 10,
    unit: "ml",
    notes: "Mực in dầu Pigment",
    is_active: true,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "local-bom-3",
    product_id: "local-prod-sticker",
    material_id: "local-mat-box",
    quantity: 1,
    unit: "bộ",
    notes: "Hộp giấy & băng keo đóng gói",
    is_active: true,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z"
  },
  // BOM for local-prod-card (100 cards)
  {
    id: "local-bom-4",
    product_id: "local-prod-card",
    material_id: "local-mat-couche",
    quantity: 2,
    unit: "tờ",
    notes: "Giấy Couche 300gsm A3",
    is_active: true,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "local-bom-5",
    product_id: "local-prod-card",
    material_id: "local-mat-ink",
    quantity: 5,
    unit: "ml",
    notes: "Mực in dầu Pigment",
    is_active: true,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "local-bom-6",
    product_id: "local-prod-card",
    material_id: "local-mat-box",
    quantity: 1,
    unit: "bộ",
    notes: "Hộp giấy & băng keo đóng gói",
    is_active: true,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z"
  },
  // BOM for local-prod-qr-board (1 board)
  {
    id: "local-bom-7",
    product_id: "local-prod-qr-board",
    material_id: "local-mat-mica",
    quantity: 1,
    unit: "tấm",
    notes: "Tấm Mica trong 2mm A4",
    is_active: true,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "local-bom-8",
    product_id: "local-prod-qr-board",
    material_id: "local-mat-formex",
    quantity: 1,
    unit: "tấm",
    notes: "Tấm Formex 3mm A4",
    is_active: true,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "local-bom-9",
    product_id: "local-prod-qr-board",
    material_id: "local-mat-decal",
    quantity: 1,
    unit: "tờ",
    notes: "Decal nhựa siêu dính",
    is_active: true,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "local-bom-10",
    product_id: "local-prod-qr-board",
    material_id: "local-mat-ink",
    quantity: 5,
    unit: "ml",
    notes: "Mực in dầu Pigment",
    is_active: true,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "local-bom-11",
    product_id: "local-prod-qr-board",
    material_id: "local-mat-box",
    quantity: 1,
    unit: "bộ",
    notes: "Hộp giấy & băng keo đóng gói",
    is_active: true,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z"
  }
];

export function getLocalProducts(companyId = LOCAL_DEMO_COMPANY_ID): Product[] {
  const products = readJson<Product[]>(PRODUCTS_KEY, []);
  if (products.length === 0) {
    writeJson(PRODUCTS_KEY, DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS.filter((product) => product.company_id === companyId);
  }
  return products
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

  // Log price or cost changes
  if (input.selling_price !== undefined && Number(input.selling_price) !== Number(current.selling_price)) {
    logLocalAction(
      "Sửa giá bán",
      "products",
      current.id,
      { selling_price: current.selling_price },
      { selling_price: input.selling_price }
    );
  }
  if (input.cost_price !== undefined && Number(input.cost_price) !== Number(current.cost_price)) {
    logLocalAction(
      "Sửa giá vốn",
      "products",
      current.id,
      { cost_price: current.cost_price },
      { cost_price: input.cost_price }
    );
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

  // Auto sync cost price of finished goods if price/cost changed
  syncBomCostToProducts();

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

export function logLocalAction(
  action: string,
  tableName: string,
  recordId: string,
  oldData?: any,
  newData?: any
) {
  try {
    const raw = localStorage.getItem("erp-mini-local-demo-audit-logs");
    const logs = raw ? JSON.parse(raw) : [];
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      action,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData || null,
      new_data: newData || null,
      created_at: new Date().toISOString(),
      user_email: "manager@erplocal.vn",
    };
    logs.unshift(newLog);
    localStorage.setItem("erp-mini-local-demo-audit-logs", JSON.stringify(logs));
  } catch (e) {
    console.error(e);
  }
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

  // Log stock transaction
  logLocalAction(
    input.transaction_type === "in" ? "Nhập kho vật tư" : "Xuất kho vật tư",
    "inventory_transactions",
    transaction.id,
    null,
    {
      product_name: product.name,
      sku: product.sku,
      quantity: input.quantity,
      notes: input.notes
    }
  );

  return transaction;
}

export function getLocalProductBom(productId?: string): LocalProductBomItem[] {
  if (!productId) return [];
  const products = readJson<Product[]>(PRODUCTS_KEY, []);
  const productMap = new Map(products.map((product) => [product.id, product]));
  let bomItems = readJson<ProductBom[]>(BOM_KEY, []);
  if (bomItems.length === 0) {
    bomItems = DEFAULT_BOM_ITEMS;
    writeJson(BOM_KEY, bomItems);
  }
  return bomItems
    .filter((item) => item.product_id === productId)
    .map((item) => ({ ...item, material: productMap.get(item.material_id) }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function getLocalProductsWithBom() {
  let bomItems = readJson<ProductBom[]>(BOM_KEY, []);
  if (bomItems.length === 0) {
    bomItems = DEFAULT_BOM_ITEMS;
    writeJson(BOM_KEY, bomItems);
  }
  return [
    ...new Set(
      bomItems
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

  // Log BOM addition
  logLocalAction(
    "Thêm định mức BOM",
    "product_bom",
    item.id,
    null,
    {
      product_id: input.product_id,
      material_id: input.material_id,
      quantity: input.quantity
    }
  );

  // Auto sync cost price of finished goods
  syncBomCostToProducts();

  return item;
}

export function updateLocalBomItem(id: string, updates: Partial<ProductBom>) {
  const items = readJson<ProductBom[]>(BOM_KEY, []);
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Khong tim thay BOM local.");
  if (updates.quantity !== undefined && !isPositiveQuantity(Number(updates.quantity))) {
    throw new Error("Dinh muc BOM phai lon hon 0.");
  }

  const current = items[index];
  const updated = { ...current, ...updates, updated_at: now() };
  items[index] = updated;
  writeJson(BOM_KEY, items);

  // Log BOM update
  logLocalAction(
    "Cập nhật định mức BOM",
    "product_bom",
    id,
    { quantity: current.quantity, notes: current.notes },
    { quantity: updated.quantity, notes: updated.notes }
  );

  // Auto sync cost price of finished goods
  syncBomCostToProducts();

  return updated;
}

export function deleteLocalBomItem(id: string) {
  const items = readJson<ProductBom[]>(BOM_KEY, []);
  const current = items.find((item) => item.id === id);
  writeJson(BOM_KEY, items.filter((item) => item.id !== id));

  if (current) {
    // Log BOM deletion
    logLocalAction(
      "Xóa định mức BOM",
      "product_bom",
      id,
      { product_id: current.product_id, material_id: current.material_id },
      null
    );
  }

  // Auto sync cost price of finished goods
  syncBomCostToProducts();
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

/**
 * BOM Sync: Cập nhật cost_price của thành phẩm theo tổng giá vốn NVL trong BOM.
 * Trả về danh sách sản phẩm đã được cập nhật.
 */
export function syncBomCostToProducts(): Array<{ id: string; sku: string; name: string; oldCost: number; newCost: number }> {
  const products = readJson<Product[]>(PRODUCTS_KEY, []);
  const bomItems = readJson<LocalProductBomItem[]>(BOM_KEY, []);
  const updated: Array<{ id: string; sku: string; name: string; oldCost: number; newCost: number }> = [];

  // Group BOM items by product_id
  const bomByProduct = new Map<string, LocalProductBomItem[]>();
  for (const item of bomItems) {
    if (item.is_active === false) continue;
    const list = bomByProduct.get(item.product_id) || [];
    list.push(item);
    bomByProduct.set(item.product_id, list);
  }

  // For each product that has BOM, recalculate cost_price
  for (const product of products) {
    const bom = bomByProduct.get(product.id);
    if (!bom || bom.length === 0) continue;
    if (product.is_service) continue;

    let expectedCost = 0;
    for (const item of bom) {
      const material = products.find((p) => p.id === item.material_id) || item.material;
      if (!material) continue;
      const qty = Number(item.quantity) || 0;
      const matCost = Number(material.cost_price) || 0;
      expectedCost += qty * matCost;
    }

    const roundedCost = Math.round(expectedCost);
    const currentCost = Number(product.cost_price) || 0;
    const delta = Math.abs(currentCost - roundedCost);

    if (delta > 1 && roundedCost > 0) {
      updated.push({
        id: product.id,
        sku: product.sku || "",
        name: product.name || "",
        oldCost: currentCost,
        newCost: roundedCost,
      });

      product.cost_price = roundedCost;
      product.updated_at = new Date().toISOString();

      logLocalAction("BOM Sync: Cập nhật giá vốn thành phẩm", "products", product.id,
        { cost_price: currentCost },
        { cost_price: roundedCost, source: "BOM sync" }
      );
    }
  }

  if (updated.length > 0) {
    writeJson(PRODUCTS_KEY, products);
  }

  return updated;
}
