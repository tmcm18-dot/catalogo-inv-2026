'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { registerBatch, registerMovement, type StockMovement } from '@/lib/dulces-maxi/admin-data';
import { formatPrice } from '@/lib/dulces-maxi/products';
import { useAdminData } from './AdminShell';

const TYPES: { value: StockMovement['type']; label: string }[] = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ajuste', label: 'Ajuste (+/-)' },
  { value: 'perdida', label: 'Pérdida' },
  { value: 'rotura', label: 'Rotura' },
  { value: 'vencimiento', label: 'Vencimiento' },
  { value: 'devolucion', label: 'Devolución' },
];

export default function AdminInventory() {
  const { products, movements, batches, refresh } = useAdminData();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [movement, setMovement] = useState({ product_id: '', type: 'entrada' as StockMovement['type'], quantity: 1, reason: '' });
  const [batch, setBatch] = useState({ product_id: '', lot_code: '', quantity: 1, made_at: '', unit_cost: 0 });

  const valued = useMemo(
    () => products.reduce((sum, product) => sum + Number(product.stock) * Number(product.effective_cost || product.cost_price || 0), 0),
    [products],
  );
  const low = products.filter((product) => Number(product.stock) <= Number(product.minimum_stock || 3)).length;
  const expiring = products.filter((product) => {
    if (!product.expires_at) return false;
    const days = (Date.parse(product.expires_at) - Date.now()) / 864e5;
    return days >= 0 && days <= 30;
  }).length;

  const submitMovement = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      registerMovement(movement);
      setNotice('Movimiento registrado.');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el movimiento.');
    }
  };

  const submitBatch = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      registerBatch(batch);
      setNotice('Lote e ingreso de stock registrados.');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el lote.');
    }
  };

  return (
    <div>
      <p className="dm-admin-kicker">Operación</p>
      <h1>Inventario y vencimientos</h1>
      <p className="dm-admin-lead">Stock disponible, movimientos auditables y lotes de producción.</p>
      {error && <p className="dm-admin-alert">{error}</p>}
      {notice && <p className="dm-admin-ok">{notice}</p>}
      <div className="dm-admin-kpis">
        <article className="dm-admin-kpi">
          <p>Inventario valorizado</p>
          <strong>{formatPrice(valued)}</strong>
        </article>
        <article className="dm-admin-kpi">
          <p>Stock bajo</p>
          <strong>{low}</strong>
        </article>
        <article className="dm-admin-kpi">
          <p>Vencen en 30 días</p>
          <strong>{expiring}</strong>
        </article>
      </div>
      <div className="dm-admin-split">
        <form className="dm-admin-card" onSubmit={submitMovement}>
          <h2>Movimiento manual</h2>
          <label>
            Producto
            <select
              value={movement.product_id}
              onChange={(event) => setMovement({ ...movement, product_id: event.target.value })}
            >
              <option value="">Seleccionar</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · Stock {product.stock}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo
            <select
              value={movement.type}
              onChange={(event) => setMovement({ ...movement, type: event.target.value as StockMovement['type'] })}
            >
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cantidad
            <input
              type="number"
              value={movement.quantity}
              onChange={(event) => setMovement({ ...movement, quantity: Number(event.target.value) })}
            />
          </label>
          <label>
            Motivo
            <input value={movement.reason} onChange={(event) => setMovement({ ...movement, reason: event.target.value })} />
          </label>
          <button type="submit" className="dm-btn dm-btn--primary">
            Registrar movimiento
          </button>
        </form>
        <form className="dm-admin-card" onSubmit={submitBatch}>
          <h2>Nuevo lote de producción</h2>
          <label>
            Producto
            <select value={batch.product_id} onChange={(event) => setBatch({ ...batch, product_id: event.target.value })}>
              <option value="">Seleccionar</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Código de lote
            <input value={batch.lot_code} onChange={(event) => setBatch({ ...batch, lot_code: event.target.value })} />
          </label>
          <label>
            Cantidad producida
            <input
              type="number"
              min={1}
              value={batch.quantity}
              onChange={(event) => setBatch({ ...batch, quantity: Number(event.target.value) })}
            />
          </label>
          <label>
            Elaboración
            <input type="date" value={batch.made_at} onChange={(event) => setBatch({ ...batch, made_at: event.target.value })} />
          </label>
          <label>
            Costo unitario
            <input
              type="number"
              min={0}
              value={batch.unit_cost}
              onChange={(event) => setBatch({ ...batch, unit_cost: Number(event.target.value) })}
            />
          </label>
          <button type="submit" className="dm-btn dm-btn--primary">
            Registrar lote e ingreso
          </button>
        </form>
      </div>
      <section className="dm-admin-card" style={{ marginTop: 20 }}>
        <h2>Últimos movimientos</h2>
        <table className="dm-admin-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Stock</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {movements.slice(0, 30).map((item) => (
              <tr key={item.id}>
                <td>{item.created_at.slice(0, 16).replace('T', ' ')}</td>
                <td>{item.product_name}</td>
                <td>{item.type}</td>
                <td>{item.quantity}</td>
                <td>{item.stock_after}</td>
                <td>{item.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {batches.length > 0 && <p className="dm-admin-muted">{batches.length} lotes registrados</p>}
      </section>
    </div>
  );
}
