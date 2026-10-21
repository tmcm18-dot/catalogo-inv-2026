'use client';

import { useMemo, useState } from 'react';
import {
  nextOrderStatus,
  ORDER_STATUSES,
  PAYMENT_STATUS_LABELS,
  updateOrder,
  type OrderStatus,
} from '@/lib/dulces-maxi/admin-data';
import { formatPrice } from '@/lib/dulces-maxi/products';
import { useAdminData } from './AdminShell';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: 'pendiente',
  confirmado: 'confirmado',
  preparando: 'preparando',
  listo: 'listo',
  entregado: 'entregado',
  cancelado: 'cancelado',
};

export default function AdminOrders() {
  const { orders, refresh } = useAdminData();
  const [filter, setFilter] = useState<OrderStatus | 'todos'>('todos');
  const [error, setError] = useState('');
  const visible = useMemo(
    () => orders.filter((order) => filter === 'todos' || order.status === filter),
    [orders, filter],
  );

  const exportCsv = () => {
    const header = [
      'pedido',
      'fecha',
      'cliente',
      'telefono',
      'estado',
      'total',
      'costo',
      'ganancia',
      'whatsapp',
      'metodo_pago',
      'estado_pago',
      'id_pago',
    ];
    const rows = orders.map((order) => [
      order.order_number,
      order.created_at,
      order.customer_name,
      order.phone,
      order.status,
      String(order.total),
      String(order.total_cost),
      String(order.total - order.total_cost),
      order.whatsapp_sent ? 'si' : 'no',
      order.payment_method,
      order.payment_status,
      order.payment_id,
    ]);
    const blob = new Blob([[header, ...rows].map((row) => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pedidos-dulces-maxi.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const changeStatus = (id: string, status: OrderStatus) => {
    setError('');
    if (status === 'cancelado' && !window.confirm('¿Cambiar a cancelado?\n\nImportante: cancelar aquí NO reembolsa el pago de Mercado Pago.')) {
      return;
    }
    const next = updateOrder(id, { status });
    if (!next) setError('No se pudo actualizar el pedido.');
    refresh();
  };

  return (
    <div>
      <p className="dm-admin-kicker">Ventas</p>
      <div className="dm-admin-head">
        <div>
          <h1>Pedidos</h1>
          <p>
            El stock se descuenta al confirmar. Un pago aprobado no cambia solo el estado comercial y cancelar aquí no
            genera un reembolso.
          </p>
        </div>
        <button type="button" className="dm-btn dm-btn--outline" onClick={exportCsv}>
          Exportar CSV
        </button>
      </div>
      {error && <p className="dm-admin-alert">{error}</p>}
      <label>
        Filtrar por estado
        <select value={filter} onChange={(event) => setFilter(event.target.value as OrderStatus | 'todos')}>
          <option value="todos">todos</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </label>
      <div className="dm-admin-chips">
        {(['todos', ...ORDER_STATUSES] as const).map((status) => (
          <button
            key={status}
            type="button"
            className={filter === status ? 'is-active' : undefined}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="dm-admin-empty">No hay pedidos con este estado.</p>
      ) : (
        visible.map((order) => {
          const next = nextOrderStatus(order.status);
          return (
            <article key={order.id} className="dm-admin-card dm-admin-order">
              <div className="dm-admin-head">
                <div>
                  <strong>{order.order_number}</strong>
                  <p>
                    {order.customer_name} · {order.phone}
                  </p>
                </div>
                <span className="dm-admin-pill">{order.status}</span>
              </div>
              <p>
                {order.delivery_method === 'retiro' ? 'Retiro' : 'Envío a coordinar'}
                {order.address ? ` · ${order.address}` : ''}
              </p>
              <ul>
                {order.items.map((item) => (
                  <li key={item.product_id}>
                    {item.quantity} × {item.name} — {formatPrice(item.line_total)}
                  </li>
                ))}
              </ul>
              <p>
                Total {formatPrice(order.total)} · Costo {formatPrice(order.total_cost)} · Ganancia{' '}
                {formatPrice(order.total - order.total_cost)}
              </p>
              <p>
                Pago: {order.payment_method === 'mercadopago' ? 'Mercado Pago' : 'WhatsApp'} ·{' '}
                {PAYMENT_STATUS_LABELS[order.payment_status]}
                {order.whatsapp_sent ? ' · WhatsApp abierto' : ''}
              </p>
              {order.notes && <p>Nota del cliente: {order.notes}</p>}
              <label>
                Notas internas
                <textarea
                  rows={2}
                  defaultValue={order.internal_notes}
                  placeholder="Seguimiento, pago, entrega…"
                  onBlur={(event) => {
                    updateOrder(order.id, { internal_notes: event.target.value });
                    refresh();
                  }}
                />
              </label>
              <div className="dm-admin-actions">
                {next && (
                  <button type="button" className="dm-btn dm-btn--primary" onClick={() => changeStatus(order.id, next)}>
                    Siguiente estado
                  </button>
                )}
                {order.status !== 'cancelado' && order.status !== 'entregado' && (
                  <button type="button" className="dm-btn dm-btn--ghost" onClick={() => changeStatus(order.id, 'cancelado')}>
                    Cancelar
                  </button>
                )}
                {order.status === 'entregado' && <span className="dm-admin-muted">Estado final</span>}
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
