import type { CartItem, Product } from '@/types';

export const CART_STORAGE_KEY = 'inv2026-cart';
export const DEFAULT_SIZE_OPTION = 'Único';
export const DEFAULT_COLOR_OPTION = 'Color según catálogo';

export const ORDER_VENDOR = {
  name: 'Maxi',
  whatsapp: '5493876106268',
} as const;

/** Reserved for future order history / repeat-order features. */
export type CompletedOrder = {
  id: string;
  createdAt: string;
  vendor: typeof ORDER_VENDOR;
  items: CartItem[];
  message: string;
};

function normalizeOption(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeOptionList(values: unknown, fallback: string) {
  if (!Array.isArray(values)) return [fallback];
  const normalized = values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean);
  return normalized.length > 0 ? Array.from(new Set(normalized)) : [fallback];
}

export function getProductSizeOptions(product: Product) {
  return normalizeOptionList(product.sizes, DEFAULT_SIZE_OPTION);
}

export function getProductColorOptions(product: Product) {
  return normalizeOptionList(product.colors, DEFAULT_COLOR_OPTION);
}

export function normalizeQuantity(value: unknown) {
  const quantity = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.floor(quantity));
}

function createCartItemId(productId: string, selectedSize: string, selectedColor: string) {
  return [productId, selectedSize, selectedColor]
    .map((part) => encodeURIComponent(part.trim().toLowerCase().replace(/\s+/g, ' ')))
    .join('__');
}

function calculateSubtotal(unitPrice: number | null | undefined, quantity: number) {
  return unitPrice ? unitPrice * quantity : null;
}

function hasSameVariant(a: CartItem, b: CartItem) {
  return (
    a.productId === b.productId &&
    a.selectedSize === b.selectedSize &&
    a.selectedColor === b.selectedColor
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readRequiredString(source: Record<string, unknown>, key: keyof CartItem) {
  const value = source[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeStoredCartItem(value: unknown): CartItem | null {
  if (!isRecord(value)) return null;

  const productId = readRequiredString(value, 'productId');
  const code = readRequiredString(value, 'code');
  const name = readRequiredString(value, 'name');
  const description = readRequiredString(value, 'description');
  const brand = readRequiredString(value, 'brand');
  const category = readRequiredString(value, 'category');
  const page = Number(value.page);
  if (!productId || !code || !name || !description || !brand || !category || !Number.isFinite(page)) {
    return null;
  }

  const selectedSize = normalizeOption(value.selectedSize, DEFAULT_SIZE_OPTION);
  const selectedColor = normalizeOption(value.selectedColor, DEFAULT_COLOR_OPTION);
  const quantity = normalizeQuantity(value.quantity);
  const unitPrice = typeof value.unitPrice === 'number' && Number.isFinite(value.unitPrice)
    ? value.unitPrice
    : null;

  return {
    id: createCartItemId(productId, selectedSize, selectedColor),
    productId,
    code,
    name,
    description,
    brand,
    category,
    page,
    selectedSize,
    selectedColor,
    quantity,
    unitPrice,
    subtotal: calculateSubtotal(unitPrice, quantity),
  };
}

export function createCartItem(
  product: Product,
  selectedSize: string,
  selectedColor: string,
  quantity: number,
): CartItem {
  const normalizedSize = normalizeOption(selectedSize, DEFAULT_SIZE_OPTION);
  const normalizedColor = normalizeOption(selectedColor, DEFAULT_COLOR_OPTION);
  const normalizedQuantity = normalizeQuantity(quantity);
  const unitPrice = product.price ?? null;

  return {
    id: createCartItemId(product.id, normalizedSize, normalizedColor),
    productId: product.id,
    code: product.code,
    name: product.name,
    description: product.description,
    brand: product.brand,
    category: product.category,
    page: product.page,
    selectedSize: normalizedSize,
    selectedColor: normalizedColor,
    quantity: normalizedQuantity,
    unitPrice,
    subtotal: calculateSubtotal(unitPrice, normalizedQuantity),
  };
}

export function addOrMergeCartItem(cart: CartItem[], newItem: CartItem): CartItem[] {
  const normalizedNewItem = normalizeStoredCartItem(newItem);
  if (!normalizedNewItem) return cart;

  const existing = cart.find((item) => hasSameVariant(item, normalizedNewItem));
  if (!existing) return [...cart, normalizedNewItem];

  return cart.map((item) => {
    if (!hasSameVariant(item, normalizedNewItem)) return item;
    const quantity = normalizeQuantity(item.quantity) + normalizedNewItem.quantity;
    return {
      ...item,
      quantity,
      subtotal: calculateSubtotal(item.unitPrice, quantity),
    };
  });
}

export function updateCartItemQuantity(cart: CartItem[], itemId: string, quantity: unknown) {
  const normalizedQuantity = normalizeQuantity(quantity);
  return cart.map((item) =>
    item.id === itemId
      ? {
          ...item,
          quantity: normalizedQuantity,
          subtotal: calculateSubtotal(item.unitPrice, normalizedQuantity),
        }
      : item,
  );
}

export function parseStoredCart(value: string | null) {
  if (!value?.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.reduce<CartItem[]>((next, item) => {
      const normalized = normalizeStoredCartItem(item);
      return normalized ? addOrMergeCartItem(next, normalized) : next;
    }, []);
  } catch {
    return [];
  }
}

export function getCartCount(cart: CartItem[]) {
  return cart.reduce((total, item) => total + normalizeQuantity(item.quantity), 0);
}

export function generateWhatsAppMessage(cart: CartItem[]) {
  const lines: string[] = ['Hola, quiero hacer este pedido:', ''];
  cart.forEach((item, index) => {
    lines.push(`${index + 1}) Producto: ${item.code} - ${item.name}`);
    lines.push(`Marca: ${item.brand}`);
    lines.push(`Categoría: ${item.category}`);
    lines.push(`Talle: ${item.selectedSize}`);
    lines.push(`Color: ${item.selectedColor}`);
    lines.push(`Cantidad: ${normalizeQuantity(item.quantity)}`);
    lines.push(`Página: ${item.page}`);
    lines.push('');
  });
  lines.push(`Total de productos: ${getCartCount(cart)}`);
  lines.push('');
  lines.push('Muchas gracias.');
  return lines.join('\n');
}

export function createWhatsAppUrl(phoneNumber: string, message: string) {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export function buildOrderWhatsAppUrl(cart: CartItem[]) {
  return createWhatsAppUrl(ORDER_VENDOR.whatsapp, generateWhatsAppMessage(cart));
}
