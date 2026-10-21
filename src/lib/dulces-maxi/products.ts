import rawProducts from '@/data/dulces-maxi/products.json';

export const DM_BASE = '/dulces-maxi';
export const WHATSAPP_NUMBER = '5493876106268';
export const WHATSAPP_DISPLAY = '387 610-6268';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export type ProductCategory =
  | 'mermelada'
  | 'dulce_regional'
  | 'pasteleria'
  | 'licor'
  | 'combo'
  | 'edicion_especial';

export type ProductBadge = 'mas_vendido' | 'nuevo' | 'oferta' | 'ultimas_unidades' | '';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory | string;
  subcategory: string;
  short_description: string;
  description: string;
  price: number;
  compare_at_price: number;
  stock: number;
  size: string;
  image_url: string;
  image_alt: string;
  featured: boolean;
  badge: ProductBadge | string;
  tags: string[];
  ingredients: string;
  allergens: string;
  conservation: string;
  active: boolean;
  status: string;
}

export const BADGE_LABELS: Record<string, string> = {
  mas_vendido: 'Más vendido',
  nuevo: 'Nuevo',
  oferta: 'Oferta',
  ultimas_unidades: 'Últimas unidades',
};

export const CATEGORY_LABELS: Record<string, string> = {
  mermelada: 'Mermelada',
  dulce_regional: 'Dulce regional',
  pasteleria: 'Pastelería por encargo',
  licor: 'Licor artesanal',
  combo: 'Combo y regalo',
  edicion_especial: 'Edición especial',
};

export const CATALOG_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'mermelada', label: 'Mermeladas' },
  { key: 'dulce_regional', label: 'Dulces regionales' },
  { key: 'pasteleria', label: 'Pastelería por encargo' },
  { key: 'combo', label: 'Combos y regalos' },
] as const;

export type CatalogFilterKey = (typeof CATALOG_FILTERS)[number]['key'];

const HIDDEN_STATUSES = new Set(['borrador', 'oculto', 'discontinuado']);

export function isPastry(product: Pick<Product, 'category'> | null | undefined): boolean {
  return product?.category === 'pasteleria';
}

export function containsAlcohol(
  product: Pick<Product, 'category'> & { alcohol_percentage?: number },
): boolean {
  return product.category === 'licor' || Number(product.alcohol_percentage) > 0;
}

export function isSellable(product: Product): boolean {
  return !containsAlcohol(product);
}

export function isVisible(product: Product): boolean {
  return isSellable(product) && product.active !== false && !HIDDEN_STATUSES.has(product.status);
}

const ALL_PRODUCTS: Product[] = rawProducts as Product[];

/** Catálogo visible, destacados primero (equivale a `list('-featured')`). */
export function listProducts(): Product[] {
  return ALL_PRODUCTS.filter(isVisible).sort((a, b) => Number(b.featured) - Number(a.featured));
}

export function getProduct(id: string): Product | null {
  const product = ALL_PRODUCTS.find((item) => item.id === id);
  if (!product || product.active === false) return null;
  return product;
}

export function isValidFilter(value: string | null | undefined): value is CatalogFilterKey {
  return CATALOG_FILTERS.some((filter) => filter.key === value);
}

export function filterProducts(
  products: Product[],
  filter: CatalogFilterKey,
  query: string,
): Product[] {
  const q = query.trim().toLowerCase();
  return products.filter((product) => {
    const matchesCategory = filter === 'all' || product.category === filter;
    const haystack = [
      product.name,
      product.description,
      product.short_description,
      product.category,
      ...(product.tags || []),
    ]
      .join(' ')
      .toLowerCase();
    return matchesCategory && (!q || haystack.includes(q));
  });
}

export function pickHeroStrawberry(products: Product[]): Product | null {
  return (
    products.find((product) => {
      const text = [product.name, product.short_description, product.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return product.category === 'mermelada' && !!product.image_url && text.includes('frutill');
    }) || null
  );
}

export function pickHeroFeatured(products: Product[], exclude: Product | null): Product | null {
  const featured = products.filter((product) => product.featured && product.image_url);
  return featured.find((product) => product.id !== exclude?.id) || featured[0] || null;
}

const PASTRY_TYPES = new Set(['torta', 'tarta', 'mesa_dulce']);

export function pastryTypeFor(product: Pick<Product, 'subcategory'> | null | undefined): string {
  const sub = (product?.subcategory || '').trim().toLowerCase();
  if (sub === 'cupcake' || sub === 'cupcakes') return 'mesa_dulce';
  return PASTRY_TYPES.has(sub) ? sub : 'torta';
}

export function pastryQuoteHref(product: Pick<Product, 'id' | 'name' | 'subcategory'>): string {
  const params = new URLSearchParams();
  if (product.id) params.set('producto', product.id);
  if (product.name) params.set('nombre', product.name);
  params.set('tipo', pastryTypeFor(product));
  return `${DM_BASE}/pasteleria?${params.toString()}#solicitar-presupuesto`;
}

export function productHref(id: string): string {
  return `${DM_BASE}/product/${id}`;
}

export function formatPrice(value: number | string = 0): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}
