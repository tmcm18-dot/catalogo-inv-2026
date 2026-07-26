import { describe, expect, it } from 'vitest';
import {
  ORDER_VENDOR,
  addOrMergeCartItem,
  buildOrderWhatsAppUrl,
  createCartItem,
  createWhatsAppUrl,
  generateWhatsAppMessage,
  getCartCount,
} from '@/lib/cart';
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
    expect(item.id).toBe('ab-12-talle-m-rosa-vintage');
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
