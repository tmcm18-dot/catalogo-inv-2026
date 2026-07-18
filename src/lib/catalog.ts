import products from '@/data/products.json';
import pages from '@/data/catalog-pages.json';
import hotspots from '@/data/hotspots.json';
import brands from '@/data/brands.json';
import categories from '@/data/categories.json';
import type { Product, CatalogPage, Hotspot } from '@/types';

export const catalogPages = pages as CatalogPage[];
export const catalogProducts = products as Product[];
export const catalogHotspots = hotspots as Hotspot[];
export const catalogBrands = brands as { id: string; name: string; category: string; isActive: boolean }[];
export const catalogCategories = categories as { id: string; name: string; slug: string; isActive: boolean }[];

const MANUAL_PAGE_TITLES: Record<number, string> = {
  1: 'Portada INV 2026',
  2: 'Índice',
  3: 'Secciones del catálogo',
};

const PLACEHOLDER_TITLES = new Set(['', 'Sin título', 'Sin marca · Sin categoría']);

export function getPageImage(pageNumber: number) {
  const padded = String(pageNumber).padStart(3, '0');
  return `/assets/catalogo/pages/page-${padded}.jpg`;
}

type PageImageCacheEntry = {
  src: string;
  loaded: boolean;
  naturalWidth: number | null;
  naturalHeight: number | null;
  error: boolean;
};

const pageImageCache = new Map<number, PageImageCacheEntry>();
const preloadPromises = new Map<number, Promise<PageImageCacheEntry>>();

function getCacheEntry(pageNumber: number): PageImageCacheEntry {
  let entry = pageImageCache.get(pageNumber);
  if (!entry) {
    entry = {
      src: getPageImage(pageNumber),
      loaded: false,
      naturalWidth: null,
      naturalHeight: null,
      error: false,
    };
    pageImageCache.set(pageNumber, entry);
  }
  return entry;
}

export function isPageImageCached(pageNumber: number) {
  const entry = getCacheEntry(pageNumber);
  return entry.loaded && entry.naturalWidth !== null && entry.naturalHeight !== null;
}

export function cachePageImageDimensions(pageNumber: number, naturalWidth: number, naturalHeight: number) {
  const entry = getCacheEntry(pageNumber);
  entry.loaded = true;
  entry.naturalWidth = naturalWidth;
  entry.naturalHeight = naturalHeight;
}

export function getCachedPageImageWidth(pageNumber: number) {
  return getCacheEntry(pageNumber).naturalWidth;
}

export function getCachedPageImageHeight(pageNumber: number) {
  return getCacheEntry(pageNumber).naturalHeight;
}

export function preloadPageImage(pageNumber: number): Promise<PageImageCacheEntry> {
  if (pageNumber < 1 || pageNumber > catalogPages.length) {
    return Promise.resolve(getCacheEntry(pageNumber));
  }

  const entry = getCacheEntry(pageNumber);
  if (entry.loaded && entry.naturalWidth && entry.naturalHeight) return Promise.resolve(entry);
  if (entry.error) return Promise.resolve(entry);

  const pending = preloadPromises.get(pageNumber);
  if (pending) return pending;

  const promise = new Promise<PageImageCacheEntry>((resolve) => {
    const img = new Image();
    img.onload = () => {
      entry.loaded = true;
      entry.naturalWidth = img.naturalWidth;
      entry.naturalHeight = img.naturalHeight;
      resolve(entry);
    };
    img.onerror = () => {
      entry.error = true;
      resolve(entry);
    };
    img.src = entry.src;
  });

  preloadPromises.set(pageNumber, promise);
  promise.finally(() => preloadPromises.delete(pageNumber));
  return promise;
}

export function getAdjacentPagesToPreload(currentPage: number) {
  return [currentPage - 1, currentPage + 1, currentPage + 2].filter(
    (page) => page >= 1 && page <= catalogPages.length,
  );
}

export function getPageTitle(pageNumber: number) {
  if (MANUAL_PAGE_TITLES[pageNumber]) return MANUAL_PAGE_TITLES[pageNumber];
  const page = catalogPages.find((p) => p.pageNumber === pageNumber);
  const title = page?.title?.trim();
  if (!title || PLACEHOLDER_TITLES.has(title) || title.startsWith('Sin marca')) {
    return `Página ${pageNumber}`;
  }
  return title;
}

export function getProductById(id: string) { return catalogProducts.find((p) => p.id === id); }
export function getHotspotsByPage(page: number) { return catalogHotspots.filter((h) => h.page === page && h.isActive); }
export function normalizeText(value: string) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
