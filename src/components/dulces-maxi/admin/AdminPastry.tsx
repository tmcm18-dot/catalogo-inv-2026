'use client';

import { useMemo, useState } from 'react';
import {
  PASTRY_STATUS_LABELS,
  PASTRY_STATUSES,
  updatePastryRequest,
  type PastryRequestStatus,
} from '@/lib/dulces-maxi/admin-data';
import { COVER_OPTIONS, PASTRY_CATEGORY_LABELS, PRESENTATION_OPTIONS } from '@/lib/dulces-maxi/pastry';
import { WHATSAPP_NUMBER } from '@/lib/dulces-maxi/products';
import { useAdminData } from './AdminShell';

const COVER = Object.fromEntries(COVER_OPTIONS);
const PRESENTATION = Object.fromEntries(PRESENTATION_OPTIONS);

export default function AdminPastry() {
  const { pastry_requests: requests, refresh } = useAdminData();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<PastryRequestStatus | 'todos'>('todos');
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');
  const visible = useMemo(
    () =>
      requests.filter((item) => {
        const haystack = `${item.customer_name} ${item.phone} ${item.product_name}`.toLowerCase();
        const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
        const matchesStatus = status === 'todos' || item.status === status;
        return matchesQuery && matchesStatus;
      }),
    [requests, query, status],
  );
  const current = requests.find((item) => item.id === selected) || visible[0] || null;
  const news = requests.filter((item) => item.status === 'nuevo').length;

  const save = (id: string, patch: Parameters<typeof updatePastryRequest>[1]) => {
    setError('');
    if (!updatePastryRequest(id, patch)) setError('No se pudo actualizar la solicitud.');
    refresh();
  };

  return (
    <div>
      <p className="dm-admin-kicker">Solo por encargo</p>
      <h1>Pastelería</h1>
      <p className="dm-admin-lead">
        Presupuestos de tortas, tartas y mesas dulces. {news} nuevas
      </p>
      {error && <p className="dm-admin-alert">{error}</p>}
      <div className="dm-admin-form__grid">
        <label>
          Buscar solicitudes
          <input
            placeholder="Buscar por cliente, teléfono o producto"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          Filtrar por estado
          <select value={status} onChange={(event) => setStatus(event.target.value as PastryRequestStatus | 'todos')}>
            <option value="todos">Todos los estados</option>
            {PASTRY_STATUSES.map((value) => (
              <option key={value} value={value}>
                {PASTRY_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="dm-admin-split">
        <section className="dm-admin-card">
          {visible.length === 0 ? (
            <p>No hay solicitudes con estos filtros.</p>
          ) : (
            <ul className="dm-admin-list">
              {visible.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => setSelected(item.id)}>
                    <strong>{item.customer_name || 'Sin nombre'}</strong>
                    <p>
                      {item.request_number} · {PASTRY_STATUS_LABELS[item.status]}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="dm-admin-card">
          {!current ? (
            <p>Seleccioná una solicitud.</p>
          ) : (
            <>
              <p className="dm-admin-muted">Recibido {current.created_at.slice(0, 16).replace('T', ' ')}</p>
              <h2>{current.request_number}</h2>
              <p>
                Cliente {current.customer_name} · {current.phone}
              </p>
              <p>
                Tipo {PASTRY_CATEGORY_LABELS[current.category as keyof typeof PASTRY_CATEGORY_LABELS] || current.category}
              </p>
              <p>Nombre o estilo {current.cake_name || current.product_name}</p>
              <p>Cantidad {current.desired_kg ? `${current.desired_kg} kg` : 'Sin kilos indicados'}</p>
              {current.event_date && <p>Fecha del evento {current.event_date}</p>}
              {current.cover && <p>Cobertura {COVER[current.cover] || current.cover}</p>}
              {current.budget_amount && <p>Presupuesto disponible del cliente {current.budget_amount} ARS</p>}
              <p>Descripción del cliente {current.description}</p>
              {current.dessert_items?.length > 0 && (
                <ul>
                  {current.dessert_items.map((item, index) => (
                    <li key={`${item.dessert_name}-${index}`}>
                      {item.quantity} × {item.dessert_name} ({PRESENTATION[item.presentation_mode] || item.presentation_mode})
                    </li>
                  ))}
                </ul>
              )}
              <p>{current.photo_count ? `${current.photo_count} fotos adjuntas` : 'La persona no adjuntó fotos.'}</p>
              <label>
                Estado
                <select
                  value={current.status}
                  onChange={(event) => save(current.id, { status: event.target.value as PastryRequestStatus })}
                >
                  {PASTRY_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {PASTRY_STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Presupuesto cotizado (ARS)
                <input
                  defaultValue={current.quote_amount}
                  onBlur={(event) => save(current.id, { quote_amount: event.target.value })}
                />
              </label>
              {current.quote_amount && <p>Último importe guardado: {current.quote_amount}</p>}
              <label>
                Notas internas
                <textarea
                  rows={3}
                  placeholder="Acuerdos, cambios, fecha de entrega, seña…"
                  defaultValue={current.internal_notes}
                  onBlur={(event) => save(current.id, { internal_notes: event.target.value })}
                />
              </label>
              <a
                className="dm-btn dm-btn--primary"
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  `Hola ${current.customer_name || ''}, te escribimos de Dulces Maxi por tu solicitud de pastelería ${current.request_number}.`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
              <button type="button" className="dm-btn dm-btn--outline" onClick={() => save(current.id, {})}>
                Guardar cambios
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
