import type { CartItem, Product } from '@/types';

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

export function createCartItem(product: Product, selectedSize: string, selectedColor: string, quantity: number): CartItem { return { id: `${product.id}-${selectedSize}-${selectedColor}`.replace(/\s+/g, '-').toLowerCase(), productId: product.id, code: product.code, name: product.name, description: product.description, brand: product.brand, category: product.category, page: product.page, selectedSize, selectedColor, quantity, unitPrice: product.price ?? null, subtotal: product.price ? product.price * quantity : null }; }
export function addOrMergeCartItem(cart: CartItem[], newItem: CartItem): CartItem[] { const existing = cart.find((item) => item.productId === newItem.productId && item.selectedSize === newItem.selectedSize && item.selectedColor === newItem.selectedColor); if (!existing) return [...cart, newItem]; return cart.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + newItem.quantity, subtotal: item.unitPrice ? item.unitPrice * (item.quantity + newItem.quantity) : null } : item); }
export function getCartCount(cart: CartItem[]) { return cart.reduce((total, item) => total + item.quantity, 0); }
export function generateWhatsAppMessage(cart: CartItem[]) { const lines: string[] = ['Hola, quiero hacer este pedido:', '']; cart.forEach((item, index) => { lines.push(`${index + 1}) Producto: ${item.code} - ${item.name}`); lines.push(`Marca: ${item.brand}`); lines.push(`Categoría: ${item.category}`); lines.push(`Talle: ${item.selectedSize}`); lines.push(`Color: ${item.selectedColor}`); lines.push(`Cantidad: ${item.quantity}`); lines.push(`Página: ${item.page}`); lines.push(''); }); lines.push(`Total de productos: ${getCartCount(cart)}`); lines.push(''); lines.push('Muchas gracias.'); return lines.join('\n'); }
export function createWhatsAppUrl(phoneNumber: string, message: string) { return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`; }
export function buildOrderWhatsAppUrl(cart: CartItem[]) {
  return createWhatsAppUrl(ORDER_VENDOR.whatsapp, generateWhatsAppMessage(cart));
}
