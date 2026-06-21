export interface ParsedRow {
  order_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  shipping_address?: string;
  product_sku?: string;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  payment_method?: string;
  notes?: string;
  channel_name?: string;
  warehouse_name?: string;
  platform_order_id?: string;
}

// Column mapping: file header -> internal field
export const COLUMN_MAP: Record<string, keyof ParsedRow> = {
  "mã đơn": "order_number",
  "order_number": "order_number",
  "ma don": "order_number",
  "tên khách": "customer_name",
  "ten khach": "customer_name",
  "customer_name": "customer_name",
  "khách hàng": "customer_name",
  "khach hang": "customer_name",
  "số điện thoại": "customer_phone",
  "so dien thoai": "customer_phone",
  "sdt": "customer_phone",
  "phone": "customer_phone",
  "customer_phone": "customer_phone",
  "địa chỉ": "customer_address",
  "dia chi": "customer_address",
  "address": "customer_address",
  "customer_address": "customer_address",
  "địa chỉ giao": "shipping_address",
  "dia chi giao": "shipping_address",
  "shipping_address": "shipping_address",
  "mã sản phẩm": "product_sku",
  "ma san pham": "product_sku",
  "sku": "product_sku",
  "product_sku": "product_sku",
  "tên sản phẩm": "product_name",
  "ten san pham": "product_name",
  "product_name": "product_name",
  "số lượng": "quantity",
  "so luong": "quantity",
  "quantity": "quantity",
  "đơn giá": "unit_price",
  "don gia": "unit_price",
  "unit_price": "unit_price",
  "giá": "unit_price",
  "gia": "unit_price",
  "price": "unit_price",
  "thanh toán": "payment_method",
  "thanh toan": "payment_method",
  "payment_method": "payment_method",
  "payment": "payment_method",
  "ghi chú": "notes",
  "ghi chu": "notes",
  "notes": "notes",
  "kênh": "channel_name",
  "kenh": "channel_name",
  "channel": "channel_name",
  "kho": "warehouse_name",
  "warehouse": "warehouse_name",
  "mã đơn sàn": "platform_order_id",
  "ma don san": "platform_order_id",
  "platform_order_id": "platform_order_id",
};

/**
 * Normalizes header strings for safe character comparison.
 */
export function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .replace(/[^\wàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ ]/gi, "")
    .trim(); // Trim again in case removing special chars left trailing spaces
}

/**
 * Auto-maps array of raw headers to ParsedRow fields.
 */
export function autoMapHeaders(headers: string[]): Record<number, keyof ParsedRow> {
  const mapping: Record<number, keyof ParsedRow> = {};
  
  // Prep normalized entries sorted by key length descending
  const sortedEntries = Object.entries(COLUMN_MAP)
    .map(([key, field]) => ({
      rawKey: key,
      normalizedKey: normalizeHeader(key),
      field,
    }))
    .sort((a, b) => b.normalizedKey.length - a.normalizedKey.length);

  headers.forEach((header, idx) => {
    const normalized = normalizeHeader(header);
    if (!normalized) return;

    // 1. Try EXACT MATCH first
    const exactMatch = sortedEntries.find((entry) => entry.normalizedKey === normalized);
    if (exactMatch) {
      mapping[idx] = exactMatch.field;
      return;
    }

    // 2. Try PARTIAL MATCH (longer key first)
    const partialMatch = sortedEntries.find(
      (entry) => normalized.includes(entry.normalizedKey) || entry.normalizedKey.includes(normalized)
    );
    if (partialMatch) {
      mapping[idx] = partialMatch.field;
    }
  });

  return mapping;
}

/**
 * Parses grid rows using column mapping record.
 */
export function parseRowsWithMapping(
  jsonData: any[][],
  mapping: Record<number, keyof ParsedRow>
): ParsedRow[] {
  const rows: ParsedRow[] = [];
  for (let i = 1; i < jsonData.length; i++) {
    const rowArray = jsonData[i] as any[];
    if (!rowArray || rowArray.length === 0 || rowArray.every((cell) => cell === undefined || cell === null || String(cell).trim() === "")) continue;

    const row: ParsedRow = {};
    Object.entries(mapping).forEach(([idxStr, field]) => {
      const idx = Number(idxStr);
      const val = rowArray[idx];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        if (field === "quantity" || field === "unit_price") {
          const num = Number(val);
          (row as any)[field] = isNaN(num) ? 0 : num;
        } else {
          (row as any)[field] = String(val).trim();
        }
      }
    });
    rows.push(row);
  }
  return rows;
}
