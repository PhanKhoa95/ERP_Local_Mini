export type ExcelRow = Record<string, string | number | boolean | Date | null | undefined>;

export interface ExcelColumn {
  header: string;
  width?: number;
}

export async function exportRowsToExcel(
  rows: ExcelRow[],
  sheetName: string,
  fileName: string,
  columns?: ExcelColumn[]
) {
  const XLSX = await import("@e965/xlsx");
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] =
    columns?.map((column) => ({ wch: column.width ?? 15 })) ??
    Object.keys(rows[0] ?? {}).map(() => ({ wch: 15 }));

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}

export async function readFirstWorksheetRows(file: File): Promise<Record<string, unknown>[]> {
  const XLSX = await import("@e965/xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
}
