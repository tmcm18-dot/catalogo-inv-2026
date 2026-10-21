'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, CakeSlice, Heart, Minus, PackageCheck, Plus, ZoomIn } from 'lucide-react';
import { addToCart } from '@/lib/dulces-maxi/cart';
import {
  DM_BASE,
  formatPrice,
  isPastry,
  pastryQuoteHref,
  type Product,
} from '@/lib/dulces-maxi/products';

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const stock = Number(product.stock) || 0;
  const pastry = isPastry(product);
  const soldOut = !pastry && stock <= 0;
  const maxQuantity = Math.max(1, Math.min(99, Math.floor(stock)));
  const hasDiscount = Number(product.compare_at_price) > Number(product.price);

  const add = () => {
    if (soldOut) return;
    addToCart(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const buyNow = () => {
    add();
    if (!soldOut) router.push(`${DM_BASE}/cart`);
  };

  return (
    <div className="dm-container dm-product">
      <Link href={DM_BASE} className="dm-back">
        <ArrowLeft size={16} /> Volver a la tienda
      </Link>
      <div className="dm-product__grid">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="dm-product__photo"
          aria-label="Ampliar fotografía"
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.image_alt || product.name}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          ) : (
            <div className="dm-card__nophoto">Falta cargar la foto</div>
          )}
          <span className="dm-product__zoom">
            <ZoomIn size={20} />
          </span>
        </button>
        <div className="dm-product__detail">
          <p className="dm-product__kind">{pastry ? 'Pastelería por encargo' : 'Dulce artesanal'}</p>
          <h1 className="dm-product__title">{product.name}</h1>
          <div className="dm-product__pricing">
            {pastry && Number(product.price) <= 0 ? (
              <p className="dm-price dm-product__price" style={{ fontSize: 24 }}>
                Precio a presupuestar
              </p>
            ) : (
              <p className="dm-price dm-product__price">
                {pastry ? 'Desde ' : ''}
                {formatPrice(product.price)}
              </p>
            )}
            {hasDiscount && <span className="dm-product__compare">{formatPrice(product.compare_at_price)}</span>}
            <span className="dm-product__size">Presentación {product.size}</span>
          </div>
          <p className="dm-product__desc">{product.description}</p>
          <div className="dm-product__info">
            <p>
              <PackageCheck size={20} />{' '}
              {pastry
                ? 'Elaboración disponible solo por encargo'
                : soldOut
                  ? 'Producto sin stock por el momento'
                  : `${stock} unidades disponibles`}
            </p>
          </div>
          {(product.ingredients || product.allergens || product.conservation) && (
            <dl className="dm-product__details">
              {product.ingredients && (
                <div>
                  <dt>Ingredientes</dt>
                  <dd>{product.ingredients}</dd>
                </div>
              )}
              {product.allergens && (
                <div>
                  <dt>Alérgenos</dt>
                  <dd>{product.allergens}</dd>
                </div>
              )}
              {product.conservation && (
                <div>
                  <dt>Conservación</dt>
                  <dd>{product.conservation}</dd>
                </div>
              )}
            </dl>
          )}
          {pastry ? (
            <div className="dm-product__quote">
              <p>
                Este producto se prepara especialmente para vos. La fecha, cantidad, decoración y precio
                final se coordinan mediante un presupuesto.
              </p>
              <Link href={pastryQuoteHref(product)} className="dm-btn dm-btn--green">
                <CakeSlice size={20} /> Pedir por encargo
              </Link>
            </div>
          ) : (
            <>
              <div className="dm-product__buy">
                <div className="dm-qty">
                  <button
                    type="button"
                    aria-label="Restar una unidad"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus size={16} />
                  </button>
                  <span aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Sumar una unidad"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={soldOut || quantity >= maxQuantity}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button type="button" onClick={add} disabled={soldOut} className="dm-btn dm-btn--primary">
                  <Heart size={16} /> {soldOut ? 'Sin stock' : added ? 'Agregado al carrito ✓' : 'Agregar al carrito'}
                </button>
              </div>
              <button type="button" onClick={buyNow} disabled={soldOut} className="dm-product__buynow">
                Comprar ahora
              </button>
            </>
          )}
        </div>
      </div>
      {zoomed && (
        <div className="dm-lightbox" role="dialog" aria-modal="true" onClick={() => setZoomed(false)}>
          <button type="button" className="dm-lightbox__close">
            Cerrar
          </button>
          <Image
            src={product.image_url}
            alt={product.image_alt || product.name}
            width={1200}
            height={1200}
            sizes="95vw"
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
      )}
    </div>
  );
}
