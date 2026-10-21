import rawProducts from '@/data/dulces-maxi/products.json';
import { computePrice } from './pricing';
import { isVisible, type PricingMethod, type Product } from './products';
import { isBrowser, newId, readJson, writeJson } from './storage';

export const CATALOG_KEY = 'dulces_maxi_catalog_v1';
export const CATALOG_EVENT = 'dulces_maxi_catalog_updated';

interface CatalogOverlay {
  products: Product[];
  deletedIds: string[];
}

const BASE_PRODUCTS = rawProducts as Product[];

function emptyOverlay(): CatalogOverlay {
  return { products: [], deletedIds: [] };
}

export function readOverlay(): CatalogOverlay {
  const parsed = readJson<CatalogOverlay>(CATALOG_KEY, emptyOverlay());
  return {
    products: Array.isArray(parsed.products) ? parsed.products : [],
    deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
  };
}

function writeOverlay(overlay: CatalogOverlay): CatalogOverlay {
  return writeJson(CATALOG_KEY, overlay, CATALOG_EVENT);
}

/** Catálogo completo (incluye borradores y ocultos). En el servidor no hay overlay. */
export function listCatalogAll(): Product[] {
  const byId = new Map<string, Product>();
  for (const product of BASE_PRODUCTS) byId.set(product.id, product);
  if (!isBrowser()) return Array.from(byId.values());
  const overlay = readOverlay();
  for (const product of overlay.products) byId.set(product.id, product);
  for (const id of overlay.deletedIds) byId.delete(id);
  return Array.from(byId.values()).sort((a, b) => Number(b.featured) - Number(a.featured));
}

export function listCatalogVisible(): Product[] {
  return listCatalogAll().filter(isVisible);
}

export function getCatalogProduct(id: string): Product | null {
  return listCatalogAll().find((product) => product.id === id) || null;
}

export function findBySku(sku: string, exceptId?: string): Product | null {
  const needle = sku.trim().toLowerCase();
  if (!needle) return null;
  return (
    listCatalogAll().find(
      (product) => product.sku.trim().toLowerCase() === needle && product.id !== exceptId,
    ) || null
  );
}

export function emptyProductDraft(): Product {
  return {
    id: '',
    sku: '',
    name: '',
    category: 'mermelada',
    subcategory: '',
    short_description: '',
    description: '',
    price: 0,
    compare_at_price: 0,
    stock: 0,
    size: '',
    image_url: '',
    image_alt: '',
    featured: false,
    badge: '',
    tags: [],
    ingredients: '',
    allergens: '',
    conservation: '',
    active: true,
    status: 'activo',
    gallery: [],
    cost_price: 0,
    additional_costs: 0,
    pricing_method: 'manual',
    markup_percentage: 0,
    target_margin_percentage: 0,
    rounding_ending: 0,
    minimum_stock: 3,
    supplier: '',
    lot_code: '',
    expires_at: '',
    alcohol_percentage: 0,
  };
}

export function applyPricing(product: Product): Product {
  const method = (product.pricing_method || 'manual') as PricingMethod;
  const percentage =
    method === 'margen_real' ? product.target_margin_percentage : product.markup_percentage;
  const computed = computePrice({
    costPrice: product.cost_price,
    additionalCosts: product.additional_costs,
    method,
    percentage,
    manualPrice: product.price,
    ending: product.rounding_ending,
  });
  return {
    ...product,
    effective_cost: computed.effectiveCost,
    price: computed.price,
    gross_profit: computed.grossProfit,
    real_margin: computed.realMargin,
    markup_percentage: computed.markup,
    target_margin_percentage: computed.realMargin,
    active: product.status === 'activo',
    image_alt: product.image_alt || product.name,
    image_url: product.gallery?.[0] || product.image_url || '',
  };
}

const CATEGORIES = new Set([
  'mermelada',
  'dulce_regional',
  'pasteleria',
  'licor',
  'combo',
  'edicion_especial',
]);
const PASTRY_TYPES = new Set(['torta', 'tarta', 'mesa_dulce', 'cupcake']);

export function validateProduct(product: Product, exceptId?: string): string | null {
  if (!product.sku.trim()) return 'SKU obligatorio';
  if (!product.name.trim()) return 'Nombre obligatorio';
  if (!CATEGORIES.has(product.category)) return 'Categoría inválida';
  if (product.category === 'pasteleria' && !PASTRY_TYPES.has((product.subcategory || '').toLowerCase())) {
    return 'Usá torta, tarta, mesa_dulce o cupcake';
  }
  if (product.category === 'licor' && Number(product.alcohol_percentage) <= 0) {
    return 'Ingresá la graduación alcohólica del licor.';
  }
  const priced = applyPricing(product);
  if (priced.price < (priced.effective_cost || 0)) {
    return 'El precio no puede quedar por debajo del costo efectivo.';
  }
  const duplicate = findBySku(product.sku, exceptId || product.id);
  if (duplicate) return `El SKU ya pertenece a ${duplicate.name}`;
  return null;
}

export function upsertProduct(input: Product): Product {
  const product = applyPricing({
    ...input,
    id: input.id || newId('prod'),
    sku: input.sku.trim(),
    name: input.name.trim(),
  });
  const overlay = readOverlay();
  const exists = overlay.products.some((item) => item.id === product.id);
  overlay.products = exists
    ? overlay.products.map((item) => (item.id === product.id ? product : item))
    : [...overlay.products, product];
  overlay.deletedIds = overlay.deletedIds.filter((id) => id !== product.id);
  writeOverlay(overlay);
  return product;
}

export function deleteProduct(id: string): void {
  const overlay = readOverlay();
  overlay.products = overlay.products.filter((product) => product.id !== id);
  if (!overlay.deletedIds.includes(id)) overlay.deletedIds.push(id);
  writeOverlay(overlay);
}

export function setProductStock(id: string, stock: number, extras: Partial<Product> = {}): Product | null {
  const current = getCatalogProduct(id);
  if (!current) return null;
  return upsertProduct({ ...current, ...extras, stock: Math.max(0, Math.floor(stock)) });
}

export function replaceCatalog(products: Product[]): void {
  const overlay = readOverlay();
  const ids = new Set(products.map((product) => product.id));
  overlay.products = products.map(applyPricing);
  overlay.deletedIds = BASE_PRODUCTS.map((product) => product.id).filter((id) => !ids.has(id));
  writeOverlay(overlay);
}
