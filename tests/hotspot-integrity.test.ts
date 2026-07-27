import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CartItem, Hotspot, Product } from '@/types';
import { getHotspotsByPage, getProductById } from '@/lib/catalog';
import { createCartItem, generateWhatsAppMessage, getCartCount } from '@/lib/cart';

const root = resolve(process.cwd());
const products = JSON.parse(readFileSync(resolve(root, 'src/data/products.json'), 'utf8')) as Product[];
const hotspots = JSON.parse(readFileSync(resolve(root, 'src/data/hotspots.json'), 'utf8')) as Hotspot[];
const productIds = new Set(products.map((p) => p.id));

describe('integridad estructural de hotspots', () => {
  it('todos los hotspots referencian productos existentes', () => {
    const orphans = hotspots.filter((h) => !productIds.has(h.productId));
    expect(orphans).toEqual([]);
  });

  it('coordenadas de todos los hotspots están en 0..100', () => {
    for (const h of hotspots) {
      expect(h.x).toBeGreaterThanOrEqual(0);
      expect(h.y).toBeGreaterThanOrEqual(0);
      expect(h.width).toBeGreaterThan(0);
      expect(h.height).toBeGreaterThan(0);
      expect(h.x + h.width).toBeLessThanOrEqual(100.0001);
      expect(h.y + h.height).toBeLessThanOrEqual(100.0001);
    }
  });
});

describe('regresión página 5 (hotspots intercambiados)', () => {
  it('izquierda superior abre 8252 y derecha superior abre 8249', () => {
    const pageHotspots = getHotspotsByPage(5);
    const leftTop = pageHotspots.find((h) => h.x < 50 && h.y < 40);
    const rightTop = pageHotspots.find((h) => h.x >= 50 && h.y < 40);
    expect(leftTop).toBeDefined();
    expect(rightTop).toBeDefined();
    expect(getProductById(leftTop!.productId)?.code).toBe('8252');
    expect(getProductById(rightTop!.productId)?.code).toBe('8249');
  });

  it('izquierda inferior abre 8231 y derecha inferior abre 8204', () => {
    const pageHotspots = getHotspotsByPage(5);
    const leftBottom = pageHotspots.find((h) => h.x < 50 && h.y >= 40);
    const rightBottom = pageHotspots.find((h) => h.x >= 50 && h.y >= 40);
    expect(getProductById(leftBottom!.productId)?.code).toBe('8231');
    expect(getProductById(rightBottom!.productId)?.code).toBe('8204');
  });

  it('las coordenadas de página 5 no fueron alteradas (sólo productId)', () => {
    const expected = [
      { id: 'hotspot-8249', x: 2, y: 8, width: 47, height: 38 },
      { id: 'hotspot-8252', x: 51, y: 8, width: 47, height: 38 },
      { id: 'hotspot-8204', x: 2, y: 50, width: 47, height: 42 },
      { id: 'hotspot-8231', x: 51, y: 50, width: 47, height: 42 },
    ];
    for (const exp of expected) {
      const h = hotspots.find((x) => x.id === exp.id);
      expect(h).toMatchObject(exp);
    }
  });
});

describe('regresión página 18 (127 vs 131)', () => {
  it('izquierda superior abre 127 y derecha superior abre 131', () => {
    const pageHotspots = getHotspotsByPage(18);
    const leftTop = pageHotspots.find((h) => h.x < 50 && h.y < 40);
    const rightTop = pageHotspots.find((h) => h.x >= 50 && h.y < 40);
    expect(getProductById(leftTop!.productId)?.code).toBe('127');
    expect(getProductById(rightTop!.productId)?.code).toBe('131');
  });

  it('existe el producto 131 con talles/colores del PDF', () => {
    const p = getProductById('131');
    expect(p).toBeDefined();
    expect(p!.code).toBe('131');
    expect(p!.page).toBe(18);
    expect(p!.sizes).toEqual(['Único']);
    expect(p!.colors).toEqual(['Blanco - Negro - Rosa vintage']);
  });
});

describe('correcciones documentales de atributos', () => {
  it('producto 103 (p18) ya no arrastra ruido PACK X en colores', () => {
    const p = getProductById('103');
    expect(p?.colors.join(' ')).not.toMatch(/PACK\s*X/i);
    expect(p?.colors).toEqual(['Rosa vintage - Blanco', 'Gris melange - Negro']);
  });
});

describe('carrito / WhatsApp sin side-effects de red', () => {
  it('genera mensaje a partir de un hotspot corregido de página 5', () => {
    const product = getProductById('8252');
    expect(product).toBeDefined();
    const item = createCartItem(product!, '2', 'Negro', 1);
    const cart: CartItem[] = [item];
    expect(getCartCount(cart)).toBe(1);
    const message = generateWhatsAppMessage(cart);
    expect(message).toContain('8252');
    expect(message).not.toContain('wa.me');
  });
});
