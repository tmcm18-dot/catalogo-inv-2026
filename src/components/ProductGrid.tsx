'use client';

import { memo, useEffect, useState } from 'react';
import { initialProductRenderCount, nextProductRenderCount } from '@/lib/catalog';
import type { Product } from '@/types';

type ProductGridProps = {
  products: Product[];
  onOpenPage: (page: number) => void;
  onSelect: (product: Product) => void;
};

function ProductGrid({ products, onOpenPage, onSelect }: ProductGridProps) {
  const [count, setCount] = useState(() => initialProductRenderCount(products.length));

  useEffect(() => {
    if (count >= products.length) return undefined;
    const frame = requestAnimationFrame(() => {
      setCount((current) => nextProductRenderCount(current, products.length));
    });
    return () => cancelAnimationFrame(frame);
  }, [count, products.length]);

  const visible = products.slice(0, count);

  return (
    <div className="productGrid" aria-busy={count < products.length}>
      {visible.map((product) => (
        <article className="productCard" key={product.id}>
          <span className="tag">{product.brand}</span>
          <h3>{product.name}</h3>
          <p>Cód. {product.code} · Página {product.page}</p>
          <p>{product.description}</p>
          <p><b>Talles:</b> {product.sizes.join(', ')}</p>
          <p><b>Colores:</b> {product.colors.join(', ')}</p>
          <button type="button" onClick={() => onOpenPage(product.page)}>Ver en revista</button>
          <button type="button" onClick={() => onSelect(product)}>Seleccionar</button>
        </article>
      ))}
    </div>
  );
}

export default memo(ProductGrid);
