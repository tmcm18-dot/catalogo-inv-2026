'use client';

import { useMemo, useState } from 'react';
import { isConfirmedSale, updateCustomer } from '@/lib/dulces-maxi/admin-data';
import { formatPrice } from '@/lib/dulces-maxi/products';
import { useAdminData } from './AdminShell';

export default function AdminCustomers() {
  const { customers, orders, refresh } = useAdminData();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return customers.filter((customer) => {
      const haystack = `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase();
      return !needle || haystack.includes(needle);
    });
  }, [customers, query]);
  const current = customers.find((customer) => customer.id === selected) || visible[0] || null;
  const related = orders.filter(
    (order) => current && (order.email === current.email || order.phone === current.phone),
  );
  const confirmed = related.filter((order) => isConfirmedSale(order.status));
  const spent = confirmed.reduce((sum, order) => sum + order.total, 0);

  const exportCsv = () => {
    const rows = [
      ['nombre', 'email', 'telefono', 'estado', 'segmento', 'marketing'],
      ...customers.map((customer) => [
        customer.name,
        customer.email,
        customer.phone,
        customer.status,
        customer.segment,
        customer.marketing ? 'si' : 'no',
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clientes-dulces-maxi.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <p className="dm-admin-kicker">Relaciones</p>
      <div className="dm-admin-head">
        <div>
          <h1>Clientes 360°</h1>
          <p>Actividad, pedidos, valor y consentimiento desde un perfil unificado.</p>
        </div>
        <button type="button" className="dm-btn dm-btn--outline" onClick={exportCsv}>
          Exportar
        </button>
      </div>
      <input
        className="dm-admin-search"
        placeholder="Buscar por nombre, email o teléfono"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="dm-admin-split">
        <section className="dm-admin-card">
          <table className="dm-admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Segmento RFM</th>
                <th>Pedidos</th>
                <th>Total</th>
                <th>Última compra</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={5}>No encontramos clientes.</td>
                </tr>
              ) : (
                visible.map((customer) => {
                  const theirs = orders.filter(
                    (order) => order.email === customer.email || order.phone === customer.phone,
                  );
                  const sales = theirs.filter((order) => isConfirmedSale(order.status));
                  return (
                    <tr key={customer.id} className={current?.id === customer.id ? 'is-active' : undefined}>
                      <td>
                        <button type="button" onClick={() => setSelected(customer.id)}>
                          {customer.name || 'Sin nombre'}
                        </button>
                      </td>
                      <td>{customer.segment || 'Todavía sin datos suficientes'}</td>
                      <td>{sales.length}</td>
                      <td>{formatPrice(sales.reduce((sum, order) => sum + order.total, 0))}</td>
                      <td>{customer.last_purchase ? customer.last_purchase.slice(0, 10) : '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
        <section className="dm-admin-card">
          {!current ? (
            <p>Seleccioná un cliente.</p>
          ) : (
            <>
              <h2>{current.name || 'Sin nombre'}</h2>
              <p>
                {current.email || 'sin email'} · {current.phone || 'sin teléfono'}
              </p>
              <p>Total gastado {formatPrice(spent)}</p>
              <p>Ticket promedio {formatPrice(confirmed.length ? spent / confirmed.length : 0)}</p>
              <p>Primera compra {related.at(-1)?.created_at.slice(0, 10) || '—'}</p>
              <p>Fuente {current.source}</p>
              <p>Preferencias · Comunicaciones {current.marketing ? 'Autorizadas' : 'No autorizadas'}</p>
              <label>
                Estado
                <select
                  value={current.status}
                  onChange={(event) => {
                    updateCustomer(current.id, { status: event.target.value as typeof current.status });
                    refresh();
                  }}
                >
                  <option value="nuevo">Nuevo</option>
                  <option value="activo">Activo</option>
                  <option value="frecuente">Frecuente</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="bloqueado">Bloqueado</option>
                </select>
              </label>
              <label>
                Notas internas
                <textarea
                  rows={3}
                  defaultValue={current.notes}
                  onBlur={(event) => {
                    updateCustomer(current.id, { notes: event.target.value });
                    refresh();
                  }}
                />
              </label>
              <h3>Historial · {related.length}</h3>
              <ul>
                {related.map((order) => (
                  <li key={order.id}>
                    {order.order_number} · {order.status} · {formatPrice(order.total)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
