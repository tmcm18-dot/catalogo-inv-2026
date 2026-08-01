import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import hotspots from '@/data/hotspots.json';
import products from '@/data/products.json';
import pages from '@/data/catalog-pages.json';

const fixturePath = join(process.cwd(), 'e2e/fixtures/page-109.json');
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
  page: number;
  title: string;
  imagePath: string;
  expectations: { hotspotCount: number; productCodes: string[] };
  hotspots: Array<{
    id: string;
    productId: string;
    code: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    ariaLabel: string;
  }>;
};

describe('e2e fixture page-109 (integridad vs datos)', () => {
  it('coincide con catalog-pages / hotspots / products', () => {
    const pageMeta = pages.find((p) => p.pageNumber === fixture.page);
    expect(pageMeta?.title).toBe(fixture.title);
    expect(fixture.imagePath).toBe('/assets/catalogo/pages/page-109.jpg');

    const pageHotspots = hotspots.filter((h) => h.page === fixture.page && h.isActive);
    expect(pageHotspots).toHaveLength(fixture.expectations.hotspotCount);
    expect(fixture.hotspots).toHaveLength(fixture.expectations.hotspotCount);

    for (const entry of fixture.hotspots) {
      const hotspot = pageHotspots.find((h) => h.id === entry.id);
      expect(hotspot, `hotspot ${entry.id}`).toBeTruthy();
      expect(hotspot!.productId).toBe(entry.productId);
      expect(hotspot!.x).toBe(entry.x);
      expect(hotspot!.y).toBe(entry.y);
      expect(hotspot!.width).toBe(entry.width);
      expect(hotspot!.height).toBe(entry.height);

      const product = products.find((p) => p.id === entry.productId);
      expect(product, `product ${entry.productId}`).toBeTruthy();
      expect(product!.code).toBe(entry.code);
      expect(product!.name).toBe(entry.name);
      expect(product!.page).toBe(fixture.page);
      expect(entry.ariaLabel).toBe(`Ver producto ${product!.code} - ${product!.name}`);
    }

    expect(fixture.expectations.productCodes).toEqual(
      fixture.hotspots.map((h) => h.code),
    );

    // No debe quedar el hotspot superior-derecho incorrecto de 161.
    expect(pageHotspots.some((h) => h.id === 'hotspot-161-p109')).toBe(false);
    expect(pageHotspots.filter((h) => h.productId === '161-p109')).toHaveLength(1);
  });


  it('mantiene las variantes confirmadas de los productos 101 y 107', () => {
    const product101 = products.find((p) => p.id === '109');
    expect(product101?.name).toContain('101 Corpiño seamless');
    expect(product101?.sizes).toEqual(['S', 'M', 'L', 'XL']);
    expect(product101?.colors).toEqual(['Blanco', 'Negro', 'Nude']);

    const product107 = products.find((p) => p.id === '107-p109');
    expect(product107?.code).toBe('107');
    expect(product107?.sizes).toEqual(['S', 'M', 'L', 'XL', 'XXL']);
    expect(product107?.colors).toEqual(['Cásico (Blanco, Negro y Nude)']);
  });
});
