'use client';

import { useEffect, useState } from 'react';
import { CATALOG_EVENT, listCatalogAll, listCatalogVisible } from '@/lib/dulces-maxi/catalog';
import { listProducts, type Product } from '@/lib/dulces-maxi/products';

function useCatalogList(all: boolean): Product[] {
  const [products, setProducts] = useState<Product[]>(() => (all ? listProducts() : listProducts()));
  useEffect(() => {
    const sync = () => setProducts(all ? listCatalogAll() : listCatalogVisible());
    sync();
    window.addEventListener(CATALOG_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CATALOG_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [all]);
  return products;
}

export function useVisibleCatalog(): Product[] {
  return useCatalogList(false);
}

export function useAllCatalog(): Product[] {
  return useCatalogList(true);
}
