'use client';

import { useMemo, useState } from 'react';
import { isConfirmedSale, type AdminOrder } from '@/lib/dulces-maxi/admin-data';
import { formatPrice, type Product } from '@/lib/dulces-maxi/products';
import { useAdminData } from './AdminShell';

type RangeKey = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'custom';

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function rangeBounds(key: RangeKey, from: string, to: string): { start: Date; end: Date } {
  const now = new Date();
  const today = startOfDay(now);
  if (key === 'today') return { start: today, end: now };
  if (key === 'yesterday') {
    const start = new Date(today);
    start.setDate(start.getDate() - 1);
    return { start, end: today };
  }
  if (key === 'week') {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { start, end: now };
  }
  if (key === 'month') {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { start, end: now };
  }
  if (key === 'quarter') {
    const start = new Date(today);
    start.setDate(start.getDate() - 89);
    return { start, end: now };
  }
  return { start: from ? new Date(`${from}T00:00:00`) : today, end: to ? new Date(`${to}T23:59:59`) : now };
}

function inRange(iso: string, start: Date, end: Date): boolean {
  const time = Date.parse(iso);
  return time >= start.getTime() && time <= end.getTime();
}

function summarize(orders: AdminOrder[], products: Product[], events: { type: string; created_at: string }[], start: Date, end: Date) {
  const periodOrders = orders.filter((order) => inRange(order.created_at, start, end));
  const confirmed = periodOrders.filter((order) => isConfirmedSale(order.status));
  const revenue = confirmed.reduce((sum, order) => sum + order.total, 0);
  const cost = confirmed.reduce((sum, order) => sum + order.total_cost, 0);
  const profit = revenue - cost;
  const clicks = events.filter((event) => event.type === 'whatsapp_click' && inRange(event.created_at, start, end)).length;
  const units = new Map<string, number>();
  confirmed.forEach((order) =>
    order.items.forEach((item) => units.set(item.product_id, (units.get(item.product_id) || 0) + item.quantity)),
  );
  const top = [...units.entries()]
    .map(([id, qty]) => ({ product: products.find((item) => item.id === id), qty }))
    .filter((row) => row.product)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);
  return {
    sales: confirmed.length,
    orders: periodOrders.length,
    revenue,
    cost,
    profit,
    ticket: confirmed.length ? revenue / confirmed.length : 0,
    margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    clicks,
    conversion: periodOrders.length ? (confirmed.length / periodOrders.length) * 100 : 0,
    top,
  };
}

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'yesterday', label: 'Ayer' },
  { key: 'week', label: 'Últimos 7 días' },
  { key: 'month', label: 'Últimos 30 días' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'custom', label: 'Rango personalizado' },
];

export default function AdminDashboard() {
  const data = useAdminData();
  const [range, setRange] = useState<RangeKey>('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const bounds = rangeBounds(range, from, to);
  const stats = useMemo(
    () => summarize(data.orders, data.products, data.events, bounds.start, bounds.end),
    [data.orders, data.products, data.events, bounds.start, bounds.end],
  );
  const newCustomers = data.customers.filter((customer) => inRange(customer.created_at, bounds.start, bounds.end)).length;
  const recurring = data.customers.filter((customer) => customer.status === 'frecuente' || customer.status === 'activo').length;

  const exportCsv = () => {
    const rows = [
      ['Métrica', 'Valor'],
      ['Ventas confirmadas', String(stats.sales)],
      ['Pedidos', String(stats.orders)],
      ['Facturación', String(stats.revenue)],
      ['Costo total', String(stats.cost)],
      ['Ganancia estimada', String(stats.profit)],
      ['Ticket promedio', String(stats.ticket)],
      ['Margen real', `${stats.margin.toFixed(1)}%`],
      ['Pedidos iniciados por WhatsApp', String(stats.clicks)],
    ];
    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dulces-maxi-resumen.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <p className="dm-admin-kicker">Información del negocio</p>
      <div className="dm-admin-head">
        <div>
          <h1>Dashboard principal</h1>
          <p>Ventas solo cuentan cuando el pedido fue confirmado; WhatsApp se informa por separado.</p>
        </div>
        <div className="dm-admin-head__tools">
          <select value={range} onChange={(event) => setRange(event.target.value as RangeKey)}>
            {RANGES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
          {range === 'custom' && (
            <>
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </>
          )}
          <button type="button" className="dm-btn dm-btn--outline" onClick={exportCsv}>
            CSV
          </button>
        </div>
      </div>
      <div className="dm-admin-kpis">
        {[
          ['Ventas confirmadas', String(stats.sales)],
          ['Pedidos', String(stats.orders)],
          ['Facturación', formatPrice(stats.revenue)],
          ['Costo total', formatPrice(stats.cost)],
          ['Ganancia estimada', formatPrice(stats.profit)],
          ['Ticket promedio', formatPrice(stats.ticket)],
          ['Margen real', `${stats.margin.toFixed(1)}%`],
          ['Clics WhatsApp', String(stats.clicks)],
          ['Conversión', `${stats.conversion.toFixed(0)}%`],
        ].map(([label, value]) => (
          <article key={label} className="dm-admin-kpi">
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="dm-admin-split">
        <section className="dm-admin-card">
          <h2>Evolución de facturación</h2>
          {stats.sales === 0 ? (
            <p className="dm-admin-empty">Todavía no hay ventas confirmadas en este período.</p>
          ) : (
            <p className="dm-admin-lead">
              {stats.sales} ventas · {formatPrice(stats.revenue)}
            </p>
          )}
        </section>
        <section className="dm-admin-card">
          <h2>Estado de carritos</h2>
          <p className="dm-admin-muted">Solo se registran carritos de visitantes que aceptaron analítica.</p>
          <p className="dm-admin-lead">{data.carts.length} carritos registrados</p>
        </section>
      </div>
      <div className="dm-admin-split">
        <section className="dm-admin-card">
          <h2>Productos destacados</h2>
          {stats.top.length === 0 ? (
            <p className="dm-admin-empty">Sin unidades vendidas en el período.</p>
          ) : (
            <table className="dm-admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Unidades vendidas</th>
                </tr>
              </thead>
              <tbody>
                {stats.top.map((row) => (
                  <tr key={row.product!.id}>
                    <td>{row.product!.name}</td>
                    <td>{row.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="dm-admin-card">
          <h2>Clientes</h2>
          <p>
            Nuevos {newCustomers} · Recurrentes {recurring}
          </p>
        </section>
      </div>
    </div>
  );
}
