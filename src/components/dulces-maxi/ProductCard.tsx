'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CakeSlice, Heart, ShoppingCart } from 'lucide-react';
import { addToCart, readFavorites, toggleFavorite } from '@/lib/dulces-maxi/cart';
import ProductPhoto from './ProductPhoto';
import {
  BADGE_LABELS,
  CATEGORY_LABELS,
  formatPrice,
  isPastry,
  pastryQuoteHref,
  productHref,
  type Product,
} from '@/lib/dulces-maxi/products';

export default function ProductCard({ product }: { product: Product }) {
  const pastry = isPastry(product);
  const soldOut = !pastry && Number(product.stock) <= 0;
  const [added, setAdded] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const hasDiscount = Number(product.compare_at_price) > Number(product.price);

  useEffect(() => {
    setFavorite(readFavorites().includes(product.id));
  }, [product.id]);

  const handleAdd = () => {
    if (soldOut) return;
    addToCart(product, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  const badgeLabel = BADGE_LABELS[product.badge] || (product.featured ? 'Destacado' : '');

  return (
    <article className="dm-card">
      <div className="dm-card__media">
        <Link href={productHref(product.id)} className="dm-card__img" aria-label={`Ver ${product.name}`}>
          <ProductPhoto
            src={product.image_url}
            alt={product.image_alt || product.name}
            fill
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 33vw, 50vw"
          />
        </Link>
        <div className="dm-card__badges">
          {badgeLabel && <span className="dm-tag dm-tag--yellow">{badgeLabel}</span>}
          {product.category === 'licor' && <span className="dm-tag dm-tag--purple">+18</span>}
          {pastry && <span className="dm-tag dm-tag--green">Por encargo</span>}
        </div>
        <button
          type="button"
          onClick={() => setFavorite(toggleFavorite(product.id))}
          className="dm-card__fav"
          aria-label={`${favorite ? 'Quitar ' : 'Agregar '}${product.name}${favorite ? ' de favoritos' : ' a favoritos'}`}
        >
          <Heart size={20} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        {soldOut && <div className="dm-card__soldout">Sin stock</div>}
      </div>
      <div className="dm-card__body">
        <p className="dm-card__cat">{CATEGORY_LABELS[product.category] || product.category}</p>
        <Link href={productHref(product.id)} className="dm-card__name">
          {product.name}
        </Link>
        <p className="dm-card__size">{product.size}</p>
        <div className="dm-card__foot">
          {hasDiscount && <p className="dm-card__compare">{formatPrice(product.compare_at_price)}</p>}
          {pastry && Number(product.price) <= 0 ? (
            <p className="dm-price dm-card__price dm-card__price--quote">Precio a presupuestar</p>
          ) : (
            <p className="dm-price dm-card__price">
              {pastry ? 'Desde ' : ''}
              {formatPrice(product.price)}
            </p>
          )}
          <p className="dm-card__stock">
            {pastry
              ? 'Disponible solo por encargo'
              : soldOut
                ? 'No disponible'
                : `${product.stock} disponibles`}
          </p>
          {pastry ? (
            <Link href={pastryQuoteHref(product)} className="dm-btn dm-btn--green">
              <CakeSlice size={16} /> Pedir por encargo
            </Link>
          ) : (
            <button type="button" onClick={handleAdd} disabled={soldOut} className="dm-btn dm-btn--primary">
              <ShoppingCart size={16} /> {soldOut ? 'Sin stock' : added ? '¡Agregado!' : 'Agregar'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
