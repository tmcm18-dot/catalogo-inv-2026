/** Réplica de la lógica de precios del panel original (base44). */

export function money(value: number | string | null | undefined): number {
  return Math.max(0, Math.round((Number(value) || 0) * 100) / 100);
}

/** Redondea para que el entero termine en `ending` (0–999), p. ej. 99 → $1.299. */
export function roundEnding(value: number, ending = 0): number {
  const amount = money(value);
  const suffix = Math.max(0, Math.min(999, Math.floor(Number(ending) || 0)));
  return suffix ? Math.ceil((amount - suffix) / 1000) * 1000 + suffix : Math.round(amount);
}

export type PricingMethod = 'manual' | 'markup' | 'margen_real';

export interface PriceInput {
  costPrice?: number | string;
  additionalCosts?: number | string;
  method?: PricingMethod | string;
  percentage?: number | string;
  manualPrice?: number | string;
  ending?: number | string;
}

export interface PriceResult {
  effectiveCost: number;
  price: number;
  grossProfit: number;
  realMargin: number;
  markup: number;
}

export function computePrice(input: PriceInput): PriceResult {
  const effectiveCost = money(Number(input.costPrice || 0) + Number(input.additionalCosts || 0));
  const percentage = Number(input.percentage) || 0;
  const method = input.method || 'manual';
  let price = Number(input.manualPrice) || 0;
  if (method === 'markup') price = effectiveCost * (1 + percentage / 100);
  if (method === 'margen_real') price = percentage >= 100 ? 0 : effectiveCost / (1 - percentage / 100);
  price = roundEnding(price, Number(input.ending) || 0);
  const grossProfit = money(price - effectiveCost);
  const realMargin = price > 0 ? money((grossProfit / price) * 100) : 0;
  const markup = effectiveCost > 0 ? money((grossProfit / effectiveCost) * 100) : 0;
  return { effectiveCost, price, grossProfit, realMargin, markup };
}

export const CSV_HEADERS = [
  'sku',
  'nombre',
  'descripcion_corta',
  'descripcion_completa',
  'categoria',
  'subcategoria',
  'peso_o_volumen',
  'stock',
  'stock_minimo',
  'precio_costo',
  'costos_adicionales',
  'metodo_precio',
  'porcentaje',
  'precio_venta',
  'proveedor',
  'imagen_principal',
  'lote',
  'vencimiento',
  'estado',
] as const;

export interface CsvRow {
  __row: number;
  [key: string]: string | number;
}

export function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      cells.push(current.trim());
      if (cells.some(Boolean)) rows.push(cells);
      cells = [];
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  if (cells.some(Boolean)) rows.push(cells);
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  return rows.slice(1).map((row, index) => ({
    __row: index + 2,
    ...Object.fromEntries(headers.map((header, cell) => [header, row[cell] ?? ''])),
  }));
}
