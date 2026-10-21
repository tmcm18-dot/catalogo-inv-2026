import { useEffect, useState } from 'react';
import { WHATSAPP_NUMBER, formatPrice, isPastry, isSellable, type Product } from './products';

export const CART_KEY = 'dulces_maxi_cart_v2';
const LEGACY_CART_KEY = 'dulces_maxi_cart_v1';
export const CART_EVENT = 'dulces_maxi_cart_updated';
export const FAVORITES_KEY = 'dulces_maxi_favorites';
export const MAX_QUANTITY = 99;

export interface CartItem {
  product_id: string;
  sku: string;
  name: string;
  category: string;
  size: string;
  price: number;
  image_url: string;
  stock: number;
  quantity: number;
}

export interface CartSummary {
  items: CartItem[];
  total: number;
  count: number;
  containsAlcohol: boolean;
}

export function summarizeCart(items: CartItem[]): CartSummary {
  return {
    items,
    total: items.reduce((acc, item) => acc + Number(item.price) * Number(item.quantity), 0),
    count: items.reduce((acc, item) => acc + Number(item.quantity), 0),
    containsAlcohol: items.some((item) => item.category === 'licor'),
  };
}

function clampStock(stock: number | undefined): number {
  return Math.max(0, Math.min(MAX_QUANTITY, Math.floor(Number(stock) || MAX_QUANTITY)));
}

/** Lógica pura: agrega un producto a una lista de ítems y devuelve la nueva lista. */
export function addProductToItems(items: CartItem[], product: Product, quantity = 1): CartItem[] {
  if (!isSellable(product) || isPastry(product)) return items;
  const stock = clampStock(product.stock);
  const qty = Math.max(1, Math.min(stock || 1, Number(quantity) || 1));
  const existing = items.find((item) => item.product_id === product.id);
  if (existing) {
    return items.map((item) =>
      item.product_id === product.id
        ? {
            ...item,
            quantity: Math.min(stock || MAX_QUANTITY, item.quantity + qty),
            price: Number(product.price),
            stock,
          }
        : item,
    );
  }
  return [
    ...items,
    {
      product_id: product.id,
      sku: product.sku || '',
      name: product.name,
      category: product.category,
      size: product.size,
      price: Number(product.price),
      image_url: product.image_url,
      stock,
      quantity: qty,
    },
  ];
}

export function setItemQuantity(items: CartItem[], productId: string, quantity: number): CartItem[] {
  const current = items.find((item) => item.product_id === productId);
  const max = Math.max(1, Math.min(MAX_QUANTITY, Number(current?.stock) || MAX_QUANTITY));
  const next = Math.min(max, Math.max(0, Number(quantity) || 0));
  return items
    .map((item) => (item.product_id === productId ? { ...item, quantity: next } : item))
    .filter((item) => item.quantity > 0);
}

export function removeItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter((item) => item.product_id !== productId);
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function readCart(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY) || window.localStorage.getItem(LEGACY_CART_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? (parsed as CartItem[]) : [];
    return list.filter((item) => item && item.category !== 'licor');
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]): CartItem[] {
  if (!isBrowser()) return items;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.localStorage.removeItem(LEGACY_CART_KEY);
  window.dispatchEvent(new Event(CART_EVENT));
  return items;
}

export function addToCart(product: Product, quantity = 1): boolean {
  if (!isSellable(product) || isPastry(product)) return false;
  writeCart(addProductToItems(readCart(), product, quantity));
  return true;
}

export function updateQuantity(productId: string, quantity: number): void {
  writeCart(setItemQuantity(readCart(), productId, quantity));
}

export function removeFromCart(productId: string): void {
  writeCart(removeItem(readCart(), productId));
}

export function clearCart(): void {
  writeCart([]);
}

export function useCart(): CartSummary {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return summarizeCart(items);
}

export function readFavorites(): string[] {
  if (!isBrowser()) return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || '[]');
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(productId: string): boolean {
  const current = readFavorites();
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId];
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next.includes(productId);
}

export interface OrderMessageInput {
  orderNumber: string;
  customer: string;
  items: Pick<CartItem, 'quantity' | 'name' | 'size' | 'price'>[];
  total: number;
  deliveryMethod: 'envio' | 'retiro';
  address?: string;
  notes?: string;
}

export function buildOrderMessage(input: OrderMessageInput): string {
  const lines = input.items.map(
    (item) =>
      `• ${item.quantity} x ${item.name} (${item.size || 'sin presentación'}) — ${formatPrice(item.price * item.quantity)}`,
  );
  return [
    '¡Hola! Quiero confirmar este pedido en Dulces Maxi:',
    '',
    `Pedido: ${input.orderNumber}`,
    `Cliente: ${input.customer}`,
    ...lines,
    '',
    `Total: ${formatPrice(input.total)}`,
    `Entrega: ${input.deliveryMethod === 'retiro' ? 'Retiro a coordinar' : 'Envío a coordinar'}`,
    input.address ? `Dirección: ${input.address}` : null,
    input.notes ? `Notas: ${input.notes}` : null,
    '',
    'Quedo a la espera de la confirmación de disponibilidad, envío y forma de pago.',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

export function buildOrderWhatsAppUrl(input: OrderMessageInput): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildOrderMessage(input))}`;
}

/** Número legible y único por dispositivo, p. ej. `DM-20261021-4F3A`. */
export function generateReference(prefix: string, now: Date = new Date()): string {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
  return `${prefix}-${date}-${random}`;
}
