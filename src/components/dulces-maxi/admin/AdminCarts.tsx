'use client';

import { useState } from 'react';
import {
  CART_STATUSES,
  refreshCartStatuses,
  updateAdminCart,
  type AdminCartStatus,
} from '@/lib/dulces-maxi/admin-data';
import { formatPrice } from '@/lib/dulces-maxi/products';
import { useAdminData } from './AdminShell';

export default function AdminCarts() {
  const { carts, refresh } = useAdminData();
  const [filter, setFilter] = useState<AdminCartStatus | 'todos'>('todos');
  const [inactive, setInactive] = useState(2);
  const [abandoned, setAbandoned] = useState(24);
  const [error, setError] = useState('');
  const visible = carts.filter((cart) => filter === 'todos' || cart.status === filter);

  return (
    <div>
      <p className="dm-admin-kicker">Oportunidades</p>
      <h1>Carritos activos y abandonados</h1>
      <p className="dm-admin-lead">Los carritos aparecen únicamente cuando el visitante autorizó analítica opcional.</p>
      {error && <p className="dm-admin-alert">{error}</p>}
      <section className="dm-admin-card dm-admin-form__grid">
        <label>
          Inactivo después de
          <input type="number" min={1} value={inactive} onChange={(event) => setInactive(Number(event.target.value) || 1)} />
          <span className="dm-admin-muted">horas</span>
        </label>
        <label>
          Abandonado después de
          <input type="number" min={1} value={abandoned} onChange={(event) => setAbandoned(Number(event.target.value) || 1)} />
          <span className="dm-admin-muted">horas</span>
        </label>
        <button
          type="button"
          className="dm-btn dm-btn--primary"
          onClick={() => {
            setError('');
            refreshCartStatuses(inactive, abandoned);
            refresh();
          }}
        >
          Actualizar estados
        </button>
        <label>
          Filtrar carritos
          <select value={filter} onChange={(event) => setFilter(event.target.value as AdminCartStatus | 'todos')}>
            <option value="todos">todos</option>
            {CART_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </section>
      {visible.length === 0 ? (
        <p className="dm-admin-empty">No hay carritos con este estado.</p>
      ) : (
        visible.map((cart) => (
          <article key={cart.id} className="dm-admin-card">
            <div className="dm-admin-head">
              <strong>{formatPrice(cart.total)}</strong>
              <span className="dm-admin-pill">{cart.status}</span>
            </div>
            <p>Fuente: {cart.source === 'direct' ? 'direct' : cart.source}</p>
            <p>{cart.phone || 'Sin teléfono asociado'}</p>
            <p>Última actividad {cart.updated_at.slice(0, 16).replace('T', ' ')}</p>
            <ul>
              {cart.items.map((item) => (
                <li key={item.product_id}>
                  {item.quantity} × {item.name}
                </li>
              ))}
            </ul>
            <p className="dm-admin-muted">Valor recalculado en servidor</p>
            <div className="dm-admin-actions">
              <button type="button" className="dm-btn dm-btn--outline" onClick={() => { updateAdminCart(cart.id, 'confirmado'); refresh(); }}>
                Marcar atendido
              </button>
              <button type="button" className="dm-btn dm-btn--primary" onClick={() => { updateAdminCart(cart.id, 'convertido'); refresh(); }}>
                Marcar vendido
              </button>
              <button type="button" className="dm-btn dm-btn--ghost" onClick={() => { updateAdminCart(cart.id, 'cancelado'); refresh(); }}>
                Marcar perdido
              </button>
            </div>
            <p className="dm-admin-muted">No se envían recordatorios automáticos.</p>
          </article>
        ))
      )}
    </div>
  );
}
