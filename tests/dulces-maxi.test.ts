import { describe, expect, it } from 'vitest';
import {
  addProductToItems,
  buildOrderMessage,
  buildOrderWhatsAppUrl,
  generateReference,
  removeItem,
  setItemQuantity,
  summarizeCart,
  type CartItem,
} from '@/lib/dulces-maxi/cart';
import {
  INITIAL_PASTRY_FORM,
  buildPastryMessage,
  isCustomDessertTable,
  validatePastryForm,
  type PastryForm,
} from '@/lib/dulces-maxi/pastry';
import {
  WHATSAPP_NUMBER,
  filterProducts,
  formatPrice,
  getProduct,
  isPastry,
  isValidFilter,
  listProducts,
  pastryQuoteHref,
  pickHeroFeatured,
  pickHeroStrawberry,
  type Product,
} from '@/lib/dulces-maxi/products';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    sku: '0001',
    name: 'mermelada de prueba',
    category: 'mermelada',
    subcategory: '',
    short_description: '',
    description: '',
    price: 1000,
    compare_at_price: 0,
    stock: 5,
    size: '500 g',
    image_url: '/assets/dulces-maxi/productos/0001.webp',
    image_alt: '',
    featured: false,
    badge: '',
    tags: [],
    ingredients: '',
    allergens: '',
    conservation: '',
    active: true,
    status: 'activo',
    ...overrides,
  };
}

describe('Dulces Maxi · catálogo', () => {
  it('lista los productos visibles con los destacados primero', () => {
    const products = listProducts();
    expect(products.length).toBeGreaterThan(0);
    const firstNonFeatured = products.findIndex((p) => !p.featured);
    const lastFeatured = products.map((p) => p.featured).lastIndexOf(true);
    if (firstNonFeatured !== -1) expect(lastFeatured).toBeLessThan(firstNonFeatured);
    for (const product of products) {
      expect(product.active).toBe(true);
      expect(product.image_url).toMatch(/^\/assets\/dulces-maxi\/productos\/.+\.webp$/);
    }
  });

  it('getProduct devuelve null para ids desconocidos', () => {
    expect(getProduct('no-existe')).toBeNull();
    const first = listProducts()[0];
    expect(getProduct(first.id)?.name).toBe(first.name);
  });

  it('filtra por categoría y texto', () => {
    const products = [
      makeProduct({ id: 'a', name: 'mermelada de kinotos', tags: ['cítrico'] }),
      makeProduct({ id: 'b', name: 'dulce de cayote', category: 'dulce_regional' }),
      makeProduct({ id: 'c', name: 'torta', category: 'pasteleria' }),
    ];
    expect(filterProducts(products, 'all', '').map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(filterProducts(products, 'mermelada', '').map((p) => p.id)).toEqual(['a']);
    expect(filterProducts(products, 'all', 'KINOTO').map((p) => p.id)).toEqual(['a']);
    expect(filterProducts(products, 'all', 'cítrico').map((p) => p.id)).toEqual(['a']);
    expect(filterProducts(products, 'combo', '')).toEqual([]);
    expect(isValidFilter('mermelada')).toBe(true);
    expect(isValidFilter('licor')).toBe(false);
  });

  it('elige la mermelada de frutilla y el destacado para el hero', () => {
    const strawberry = makeProduct({ id: 'f', name: 'dulce de frutilla' });
    const featured = makeProduct({ id: 'd', featured: true });
    const both = makeProduct({ id: 'fd', name: 'frutilla especial', featured: true });
    expect(pickHeroStrawberry([featured, strawberry])?.id).toBe('f');
    expect(pickHeroFeatured([featured, strawberry], strawberry)?.id).toBe('d');
    expect(pickHeroFeatured([both], both)?.id).toBe('fd');
    expect(pickHeroStrawberry([featured])).toBeNull();
  });

  it('arma el enlace de presupuesto para pastelería', () => {
    const cake = makeProduct({ id: 'c1', name: 'Torta mousse', category: 'pasteleria', subcategory: 'cupcakes' });
    expect(isPastry(cake)).toBe(true);
    expect(pastryQuoteHref(cake)).toBe(
      '/dulces-maxi/pasteleria?producto=c1&nombre=Torta+mousse&tipo=mesa_dulce#solicitar-presupuesto',
    );
  });

  it('formatea precios en ARS sin decimales', () => {
    expect(formatPrice(8522)).toMatch(/^\$\s?8\.522$/);
    expect(formatPrice('abc')).toMatch(/^\$\s?0$/);
  });
});

describe('Dulces Maxi · carrito', () => {
  it('agrega, fusiona y respeta el stock', () => {
    const product = makeProduct({ stock: 3 });
    let items = addProductToItems([], product, 2);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    items = addProductToItems(items, product, 5);
    expect(items[0].quantity).toBe(3);
    expect(summarizeCart(items)).toMatchObject({ total: 3000, count: 3, containsAlcohol: false });
  });

  it('no agrega pastelería ni licores', () => {
    expect(addProductToItems([], makeProduct({ category: 'pasteleria' }))).toEqual([]);
    expect(addProductToItems([], makeProduct({ category: 'licor' }))).toEqual([]);
  });

  it('actualiza cantidades y elimina al llegar a cero', () => {
    const items: CartItem[] = addProductToItems([], makeProduct({ stock: 10 }), 1);
    expect(setItemQuantity(items, 'p1', 4)[0].quantity).toBe(4);
    expect(setItemQuantity(items, 'p1', 50)[0].quantity).toBe(10);
    expect(setItemQuantity(items, 'p1', 0)).toEqual([]);
    expect(removeItem(items, 'p1')).toEqual([]);
    expect(removeItem(items, 'otro')).toHaveLength(1);
  });

  it('genera el mensaje y la URL de WhatsApp del pedido', () => {
    const message = buildOrderMessage({
      orderNumber: 'DM-20260101-ABCD',
      customer: 'Ana',
      items: [{ quantity: 2, name: 'dulce de frutilla', size: '500 g', price: 6299 }],
      total: 12598,
      deliveryMethod: 'retiro',
      notes: 'sin azúcar',
    });
    expect(message).toContain('Pedido: DM-20260101-ABCD');
    expect(message).toContain('• 2 x dulce de frutilla (500 g) —');
    expect(message).toContain('Entrega: Retiro a coordinar');
    expect(message).toContain('Notas: sin azúcar');
    expect(message).not.toContain('Dirección');
    const url = buildOrderWhatsAppUrl({
      orderNumber: 'X',
      customer: 'Ana',
      items: [],
      total: 0,
      deliveryMethod: 'envio',
      address: 'Calle 1',
    });
    expect(url.startsWith(`https://wa.me/${WHATSAPP_NUMBER}?text=`)).toBe(true);
    expect(decodeURIComponent(url)).toContain('Dirección: Calle 1');
  });

  it('genera referencias con prefijo y fecha', () => {
    const ref = generateReference('DM', new Date('2026-10-21T12:00:00Z'));
    expect(ref).toMatch(/^DM-20261021-[A-Z0-9]{4}$/);
  });
});

describe('Dulces Maxi · pastelería', () => {
  const valid: PastryForm = {
    ...INITIAL_PASTRY_FORM,
    description: 'Torta de cumpleaños con flores de crema.',
    customer_name: 'Ana Pérez',
    phone: '387 123 4567',
    consent_terms: true,
  };

  it('valida los campos obligatorios de una torta', () => {
    expect(validatePastryForm(valid)).toBeNull();
    expect(validatePastryForm({ ...valid, description: 'corta' })).toMatch(/10 caracteres/);
    expect(validatePastryForm({ ...valid, consent_terms: false })).toMatch(/aceptá/);
    expect(validatePastryForm({ ...valid, desired_kg: '0' })).toMatch(/kilos/);
    expect(validatePastryForm({ ...valid, product_name: 'Torta personalizada', cake_name: '' })).toMatch(
      /estilo de la torta/,
    );
  });

  it('exige postres y presupuesto para la mesa dulce personalizada', () => {
    const table: PastryForm = {
      ...valid,
      category: 'mesa_dulce',
      product_name: 'Mesa dulce personalizada',
      cover: 'no_aplica',
    };
    expect(isCustomDessertTable(table)).toBe(true);
    expect(validatePastryForm(table)).toMatch(/nombre y una cantidad/);
    const withDesserts: PastryForm = {
      ...table,
      dessert_items: [{ dessert_name: 'Brownies', quantity: '12', presentation_mode: 'bandeja' }],
    };
    expect(validatePastryForm(withDesserts)).toMatch(/pensado gastar/);
    expect(validatePastryForm({ ...withDesserts, budget_amount: '150000' })).toBeNull();
    const message = buildPastryMessage({ ...withDesserts, budget_amount: '150000' }, 'PAS-1', 2);
    expect(message).toContain('• 12 x Brownies (Bandeja)');
    expect(message).toContain('Presupuesto disponible: 150000 ARS');
    expect(message).toContain('Adjunto 2 fotos de referencia');
    expect(message).not.toContain('Kilos');
  });

  it('incluye kilos y cobertura en el mensaje de una torta', () => {
    const message = buildPastryMessage({ ...valid, desired_kg: '2.5', cover: 'chocolate_cobertura' }, 'PAS-2');
    expect(message).toContain('Kilos: 2.5');
    expect(message).toContain('Cobertura: Chocolate cobertura');
    expect(message).toContain('Teléfono: 387 123 4567');
  });
});
