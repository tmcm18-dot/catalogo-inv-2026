import { describe, expect, it } from 'vitest';
import {
  cachePageImageDimensions,
  catalogPages,
  catalogProducts,
  clampPageNumber,
  filterProducts,
  getAdjacentPagesToPreload,
  getCachedPageImageHeight,
  getCachedPageImageWidth,
  getHotspotsByPage,
  getPageImage,
  getPageTitle,
  getProductById,
  isPageImageCached,
  normalizeText,
} from '@/lib/catalog';
import type { Product } from '@/types';

describe('getPageImage', () => {
  it('aplica padding de 3 dígitos a la ruta de la imagen', () => {
    expect(getPageImage(1)).toBe('/assets/catalogo/pages/page-001.jpg');
    expect(getPageImage(42)).toBe('/assets/catalogo/pages/page-042.jpg');
    expect(getPageImage(218)).toBe('/assets/catalogo/pages/page-218.jpg');
  });

  it('usa siempre minúsculas y ruta dentro de public (compatibilidad Linux/Vercel)', () => {
    const src = getPageImage(7);
    expect(src).toBe(src.toLowerCase());
    expect(src.startsWith('/assets/catalogo/pages/')).toBe(true);
    expect(src).not.toContain('..');
  });
});

describe('normalizeText', () => {
  it('pasa a minúsculas y elimina acentos', () => {
    expect(normalizeText('Corsetería')).toBe('corseteria');
    expect(normalizeText('ÁÉÍÓÚñ')).toBe('aeioun');
  });

  it('deja intacto el texto sin acentos', () => {
    expect(normalizeText('kaury 8248')).toBe('kaury 8248');
  });
});

describe('getProductById', () => {
  it('devuelve el producto existente por id', () => {
    const product = getProductById('8248');
    expect(product).toBeDefined();
    expect(product?.code).toBe('8248');
  });

  it('devuelve undefined para un id inexistente', () => {
    expect(getProductById('__no-existe__')).toBeUndefined();
  });
});

describe('getHotspotsByPage', () => {
  it('sólo devuelve hotspots activos de la página pedida', () => {
    const page = catalogProducts[0].page;
    const result = getHotspotsByPage(page);
    expect(result.every((h) => h.page === page && h.isActive)).toBe(true);
  });

  it('devuelve un arreglo vacío para una página sin hotspots', () => {
    expect(getHotspotsByPage(99999)).toEqual([]);
  });
});

describe('getPageTitle', () => {
  it('usa títulos manuales para las primeras páginas', () => {
    expect(getPageTitle(1)).toBe('Portada INV 2026');
    expect(getPageTitle(2)).toBe('Índice');
    expect(getPageTitle(3)).toBe('Secciones del catálogo');
  });

  it('usa el fallback "Página N" cuando no hay título válido', () => {
    expect(getPageTitle(99999)).toBe('Página 99999');
  });
});

describe('clampPageNumber (navegación)', () => {
  it('mantiene páginas dentro del rango válido', () => {
    expect(clampPageNumber(5)).toBe(5);
  });

  it('nunca baja de 1', () => {
    expect(clampPageNumber(0)).toBe(1);
    expect(clampPageNumber(-10)).toBe(1);
  });

  it('nunca supera el total de páginas', () => {
    expect(clampPageNumber(catalogPages.length + 50)).toBe(catalogPages.length);
  });

  it('respeta un total de páginas explícito', () => {
    expect(clampPageNumber(10, 5)).toBe(5);
    expect(clampPageNumber(3, 5)).toBe(3);
  });
});

describe('getAdjacentPagesToPreload (precarga)', () => {
  it('precarga anterior, siguiente y subsiguiente en el medio', () => {
    expect(getAdjacentPagesToPreload(5)).toEqual([4, 6, 7]);
  });

  it('descarta páginas por debajo de 1 en la primera página', () => {
    expect(getAdjacentPagesToPreload(1)).toEqual([2, 3]);
  });

  it('descarta páginas por encima del total en la última página', () => {
    const last = catalogPages.length;
    expect(getAdjacentPagesToPreload(last)).toEqual([last - 1]);
  });
});

describe('filterProducts (productos y variantes)', () => {
  it('sin filtros devuelve todos los productos', () => {
    expect(filterProducts(catalogProducts)).toHaveLength(catalogProducts.length);
    expect(filterProducts(catalogProducts, {})).toHaveLength(catalogProducts.length);
  });

  it('filtra por código', () => {
    const result = filterProducts(catalogProducts, { query: '8248' });
    expect(result.some((p) => p.code === '8248')).toBe(true);
  });

  it('la búsqueda ignora acentos y mayúsculas', () => {
    const withAccents = filterProducts(catalogProducts, { query: 'Corsetería' });
    const without = filterProducts(catalogProducts, { query: 'corseteria' });
    expect(withAccents.length).toBeGreaterThan(0);
    expect(withAccents.length).toBe(without.length);
  });

  it('filtra por marca exacta', () => {
    const brand = catalogProducts[0].brand;
    const result = filterProducts(catalogProducts, { brand });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.brand === brand)).toBe(true);
  });

  it('combina texto + marca + categoría', () => {
    const sample = catalogProducts[0];
    const result = filterProducts(catalogProducts, {
      query: sample.code,
      brand: sample.brand,
      category: sample.category,
    });
    expect(result.some((p) => p.id === sample.id)).toBe(true);
    expect(result.every((p) => p.brand === sample.brand && p.category === sample.category)).toBe(true);
  });

  it('permite buscar por talle y color (variantes)', () => {
    const variants: Product[] = [
      {
        id: 'v1',
        code: 'VAR',
        name: 'Producto variante',
        description: 'desc',
        brand: 'MarcaX',
        category: 'CatX',
        page: 10,
        sizes: ['XS', 'XL'],
        colors: ['Fucsia'],
        price: null,
        sourcePagePdf: '/x.pdf',
        isActive: true,
      },
    ];
    expect(filterProducts(variants, { query: 'xl' })).toHaveLength(1);
    expect(filterProducts(variants, { query: 'fucsia' })).toHaveLength(1);
    expect(filterProducts(variants, { query: 'inexistente' })).toHaveLength(0);
  });

  it('trata query vacío o con espacios como sin filtro', () => {
    expect(filterProducts(catalogProducts, { query: '   ' })).toHaveLength(catalogProducts.length);
  });

  it('devuelve vacío ante datos de entrada vacíos', () => {
    expect(filterProducts([], { query: 'algo' })).toEqual([]);
  });
});

describe('caché de dimensiones de página', () => {
  it('reporta no cacheada antes de guardar dimensiones', () => {
    expect(isPageImageCached(90001)).toBe(false);
    expect(getCachedPageImageWidth(90001)).toBeNull();
    expect(getCachedPageImageHeight(90001)).toBeNull();
  });

  it('guarda y recupera las dimensiones naturales', () => {
    cachePageImageDimensions(90002, 1080, 1920);
    expect(isPageImageCached(90002)).toBe(true);
    expect(getCachedPageImageWidth(90002)).toBe(1080);
    expect(getCachedPageImageHeight(90002)).toBe(1920);
  });
});
