'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Minus, Plus, X } from 'lucide-react';
import { removeFromCart, updateQuantity, useCart } from '@/lib/dulces-maxi/cart';
import { DM_BASE, formatPrice } from '@/lib/dulces-maxi/products';

export default function CartPage() {
  const { items, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="dm-container dm-cart-empty">
        <div className="dm-cart-empty__icon" aria-hidden="true">
          🍓
        </div>
        <h1>Tu carrito está vacío</h1>
        <p>
          Elegí una mermelada, un dulce regional o un combo artesanal y volvé cuando quieras: guardamos
          tu selección en este dispositivo.
        </p>
        <Link href={DM_BASE} className="dm-btn dm-btn--primary dm-btn--pill">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="dm-container dm-cart">
      <Link href={DM_BASE} className="dm-back" style={{ letterSpacing: '0.18em', fontWeight: 700 }}>
        <ArrowLeft size={16} aria-hidden="true" /> Seguir comprando
      </Link>
      <div className="dm-cart__grid">
        <section>
          <h1>Tu carrito</h1>
          <p className="dm-cart__count">
            {items.length} {items.length === 1 ? 'producto' : 'productos'} seleccionados
          </p>
          <div className="dm-cart__list">
            {items.map((item) => (
              <article key={item.product_id} className="dm-cart__item">
                <div className="dm-cart__thumb">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.name} fill sizes="96px" />
                  ) : null}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p className="dm-cart__kind">{item.category === 'licor' ? 'Licor +18' : 'Mermelada'}</p>
                  <h2 className="dm-cart__name">{item.name}</h2>
                  <p className="dm-cart__meta">
                    {item.size} · {formatPrice(item.price)} c/u
                  </p>
                  <div className="dm-cart__qty">
                    <button
                      type="button"
                      aria-label={`Restar una unidad de ${item.name}`}
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Sumar una unidad de ${item.name}`}
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="dm-cart__side">
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product_id)}
                    className="dm-cart__remove"
                    aria-label={`Quitar ${item.name}`}
                  >
                    <X size={16} />
                  </button>
                  <p className="dm-cart__subtotal">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="dm-summary">
          <h2>Resumen</h2>
          <div className="dm-summary__row">
            <span>Productos</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="dm-summary__total">
            <span>Total estimado</span>
            <span>{formatPrice(total)}</span>
          </div>
          <p className="dm-summary__note">
            El costo de entrega y la forma de pago se coordinan al confirmar el pedido.
          </p>
          <Link href={`${DM_BASE}/checkout`} className="dm-btn dm-btn--primary">
            Continuar con el pedido
          </Link>
        </aside>
      </div>
    </div>
  );
}
