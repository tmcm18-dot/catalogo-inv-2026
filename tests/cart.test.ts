import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COLOR_OPTION,
  DEFAULT_SIZE_OPTION,
  ORDER_VENDOR,
  addOrMergeCartItem,
  buildOrderWhatsAppUrl,
  createCartItem,
  createWhatsAppUrl,
  generateWhatsAppMessage,
  getCartCount,
  getProductColorOptions,
  getProductSizeOptions,
  normalizeQuantity,
  parseStoredCart,
  updateCartItemQuantity,
} from '@/lib/cart';
import { catalogProducts } from '@/lib/catalog';
import type { CartItem, Product } from '@/types';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '8248',
    code: '8248',
    name: 'Conjunto de puntilla',
    description: 'Corpiño con arco y cola less.',
    brand: 'Kaury',
    category: 'Corsetería',
    page: 4,
    sizes: ['85', '90', '95'],
    colors: ['Blanco', 'Negro'],
    price: null,
    sourcePagePdf: '/assets/catalogo/pdf/inv-2026.pdf',
    isActive: true,
    ...overrides,
  };
}

describe('createCartItem', () => {
  it('genera un id normalizado (minúsculas y sin espacios)', () => {
    const product = makeProduct({ id: 'AB 12', name: 'Nombre' });
    const item = createCartItem(product, 'Talle M', 'Rosa Vintage', 2);
    expect(item.id).toBe('ab%2012__talle%20m__rosa%20vintage');
    expect(item.productId).toBe('AB 12');
    expect(item.selectedSize).toBe('Talle M');
    expect(item.selectedColor).toBe('Rosa Vintage');
    expect(item.quantity).toBe(2);
  });

  it('copia los datos del producto en el ítem', () => {
    const product = makeProduct();
    const item = createCartItem(product, '90', 'Negro', 1);
    expect(item).toMatchObject({
      productId: product.id,
      code: product.code,
      name: product.name,
      description: product.description,
      brand: product.brand,
      category: product.category,
      page: product.page,
    });
  });

  it('deja precio y subtotal en null cuando el producto no tiene precio', () => {
    const item = createCartItem(makeProduct({ price: null }), '90', 'Negro', 3);
    expect(item.unitPrice).toBeNull();
    expect(item.subtotal).toBeNull();
  });

  it('calcula subtotal = precio * cantidad cuando hay precio', () => {
    const item = createCartItem(makeProduct({ price: 1000 }), '90', 'Negro', 3);
    expect(item.unitPrice).toBe(1000);
    expect(item.subtotal).toBe(3000);
  });

  it('trata precio 0 como sin subtotal (falsy)', () => {
    const item = createCartItem(makeProduct({ price: 0 }), '90', 'Negro', 3);
    expect(item.unitPrice).toBe(0);
    expect(item.subtotal).toBeNull();
  });

  it('normaliza cantidad mínima y opciones vacías con fallbacks reales', () => {
    const item = createCartItem(makeProduct({ sizes: [], colors: [] }), '', '', 0);
    expect(item.quantity).toBe(1);
    expect(item.selectedSize).toBe(DEFAULT_SIZE_OPTION);
    expect(item.selectedColor).toBe(DEFAULT_COLOR_OPTION);
  });
});

describe('opciones de producto para carrito', () => {
  it('ofrece talle y color para todos los productos del catálogo sin modificar datos', () => {
    for (const product of catalogProducts) {
      expect(getProductSizeOptions(product), product.id).not.toHaveLength(0);
      expect(getProductColorOptions(product), product.id).not.toHaveLength(0);
      expect(getProductSizeOptions(product).every((size) => size.trim().length > 0)).toBe(true);
      expect(getProductColorOptions(product).every((color) => color.trim().length > 0)).toBe(true);
    }
  });

  it('mantiene opciones reales existentes y solo usa fallback si falta la lista', () => {
    const product = makeProduct({ sizes: [' 90 ', '90', '95'], colors: [] });
    expect(getProductSizeOptions(product)).toEqual(['90', '95']);
    expect(getProductColorOptions(product)).toEqual([DEFAULT_COLOR_OPTION]);
  });
});

describe('addOrMergeCartItem', () => {
  it('agrega un ítem nuevo al carrito sin mutar el original', () => {
    const cart: CartItem[] = [];
    const item = createCartItem(makeProduct(), '90', 'Negro', 1);
    const next = addOrMergeCartItem(cart, item);
    expect(next).toHaveLength(1);
    expect(cart).toHaveLength(0);
  });

  it('fusiona por productId + talle + color sumando cantidades', () => {
    const base = createCartItem(makeProduct({ price: 500 }), '90', 'Negro', 2);
    const again = createCartItem(makeProduct({ price: 500 }), '90', 'Negro', 3);
    const merged = addOrMergeCartItem([base], again);
    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(5);
    expect(merged[0].subtotal).toBe(2500);
  });

  it('mantiene subtotal null al fusionar productos sin precio', () => {
    const base = createCartItem(makeProduct({ price: null }), '90', 'Negro', 2);
    const again = createCartItem(makeProduct({ price: null }), '90', 'Negro', 1);
    const merged = addOrMergeCartItem([base], again);
    expect(merged[0].quantity).toBe(3);
    expect(merged[0].subtotal).toBeNull();
  });

  it('no fusiona variantes distintas (distinto talle o color)', () => {
    const p = makeProduct();
    const a = createCartItem(p, '90', 'Negro', 1);
    const bTalle = createCartItem(p, '95', 'Negro', 1);
    const bColor = createCartItem(p, '90', 'Blanco', 1);
    const cart = addOrMergeCartItem(addOrMergeCartItem([a], bTalle), bColor);
    expect(cart).toHaveLength(3);
  });

  it('fusiona solo la variante exacta aunque existan ids heredados duplicados', () => {
    const productA = makeProduct({ id: 'AB 12', code: 'A12' });
    const productB = makeProduct({ id: 'AB-12', code: 'B12' });
    const base = { ...createCartItem(productA, '90', 'Negro', 1), id: 'legacy-collision' };
    const other = { ...createCartItem(productB, '90', 'Negro', 4), id: 'legacy-collision' };
    const merged = addOrMergeCartItem([base, other], createCartItem(productA, '90', 'Negro', 2));
    expect(merged).toHaveLength(2);
    expect(merged.find((item) => item.productId === productA.id)?.quantity).toBe(3);
    expect(merged.find((item) => item.productId === productB.id)?.quantity).toBe(4);
  });
});

describe('normalizeQuantity / updateCartItemQuantity', () => {
  it('impone cantidad mínima 1 y usa enteros', () => {
    expect(normalizeQuantity('2')).toBe(2);
    expect(normalizeQuantity(0)).toBe(1);
    expect(normalizeQuantity(-3)).toBe(1);
    expect(normalizeQuantity('')).toBe(1);
    expect(normalizeQuantity('2.9')).toBe(1);
    expect(normalizeQuantity('valor inválido')).toBe(1);
  });

  it('actualiza cantidad y subtotal sin permitir cero', () => {
    const item = createCartItem(makeProduct({ price: 500 }), '90', 'Negro', 2);
    const [updated] = updateCartItemQuantity([item], item.id, 0);
    expect(updated.quantity).toBe(1);
    expect(updated.subtotal).toBe(500);
  });
});

describe('parseStoredCart', () => {
  it('devuelve carrito vacío con storage vacío, inválido o corrupto', () => {
    expect(parseStoredCart(null)).toEqual([]);
    expect(parseStoredCart('')).toEqual([]);
    expect(parseStoredCart('{')).toEqual([]);
    expect(parseStoredCart(JSON.stringify({ items: [] }))).toEqual([]);
  });

  it('filtra ítems corruptos, normaliza cantidades y fusiona duplicados por variante', () => {
    const first = createCartItem(makeProduct({ price: 100 }), '90', 'Negro', 0);
    const second = createCartItem(makeProduct({ price: 100 }), '90', 'Negro', 2);
    const restored = parseStoredCart(JSON.stringify([first, { productId: '' }, second]));
    expect(restored).toHaveLength(1);
    expect(restored[0].quantity).toBe(3);
    expect(restored[0].subtotal).toBe(300);
  });
});

describe('getCartCount', () => {
  it('suma las cantidades de todos los ítems', () => {
    const cart = [
      createCartItem(makeProduct(), '90', 'Negro', 2),
      createCartItem(makeProduct({ id: 'x' }), '85', 'Blanco', 4),
    ];
    expect(getCartCount(cart)).toBe(6);
  });

  it('devuelve 0 para un carrito vacío', () => {
    expect(getCartCount([])).toBe(0);
  });
});

describe('generateWhatsAppMessage', () => {
  it('incluye encabezado, datos del ítem, total y despedida', () => {
    const cart = [createCartItem(makeProduct(), '90', 'Negro', 2)];
    const message = generateWhatsAppMessage(cart);
    expect(message).toContain('Hola, quiero hacer este pedido:');
    expect(message).toContain('1) Producto: 8248 - Conjunto de puntilla');
    expect(message).toContain('Marca: Kaury');
    expect(message).toContain('Categoría: Corsetería');
    expect(message).toContain('Talle: 90');
    expect(message).toContain('Color: Negro');
    expect(message).toContain('Cantidad: 2');
    expect(message).toContain('Página: 4');
    expect(message).toContain('Total de productos: 2');
    expect(message).toContain('Muchas gracias.');
  });

  it('numera correctamente múltiples ítems y suma el total', () => {
    const cart = [
      createCartItem(makeProduct({ id: 'a', code: 'A1' }), '90', 'Negro', 1),
      createCartItem(makeProduct({ id: 'b', code: 'B2' }), '85', 'Blanco', 3),
    ];
    const message = generateWhatsAppMessage(cart);
    expect(message).toContain('1) Producto: A1');
    expect(message).toContain('2) Producto: B2');
    expect(message).toContain('Total de productos: 4');
  });

  it('genera un mensaje coherente con carrito vacío (total 0)', () => {
    const message = generateWhatsAppMessage([]);
    expect(message).toContain('Total de productos: 0');
    expect(message).not.toContain('1) Producto');
  });
});

describe('createWhatsAppUrl', () => {
  it('codifica el mensaje en el parámetro text', () => {
    const url = createWhatsAppUrl('549123', 'hola mundo & más');
    expect(url).toBe(`https://wa.me/549123?text=${encodeURIComponent('hola mundo & más')}`);
  });
});

describe('buildOrderWhatsAppUrl', () => {
  it('usa el teléfono del vendedor y el mensaje generado', () => {
    const cart = [createCartItem(makeProduct(), '90', 'Negro', 1)];
    const url = buildOrderWhatsAppUrl(cart);
    expect(url.startsWith(`https://wa.me/${ORDER_VENDOR.whatsapp}?text=`)).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1])).toBe(generateWhatsAppMessage(cart));
  });
});
