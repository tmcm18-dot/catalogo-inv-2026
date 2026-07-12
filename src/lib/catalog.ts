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
export function getProductById(id: string) { return catalogProducts.find((p) => p.id === id); }
export function getHotspotsByPage(page: number) { return catalogHotspots.filter((h) => h.page === page && h.isActive); }
export function normalizeText(value: string) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
