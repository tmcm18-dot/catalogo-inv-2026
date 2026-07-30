import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import hotspots from '@/data/hotspots.json';
import products from '@/data/products.json';
import pages from '@/data/catalog-pages.json';

const fixturePath = join(process.cwd(), 'e2e/fixtures/page-198.json');
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

describe('e2e fixture page-198 (integridad vs datos)', () => {
  it('coincide con catalog-pages / hotspots / products', () => {
    const pageMeta = pages.find((p) => p.pageNumber === fixture.page);
    expect(pageMeta?.title).toBe(fixture.title);
    expect(fixture.imagePath).toBe('/assets/catalogo/pages/page-198.jpg');

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
  });
});
