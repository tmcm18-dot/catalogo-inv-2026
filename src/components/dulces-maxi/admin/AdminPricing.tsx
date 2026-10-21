'use client';

import { useMemo, useState } from 'react';
import { upsertProduct } from '@/lib/dulces-maxi/catalog';
import { computePrice, type PricingMethod } from '@/lib/dulces-maxi/pricing';
import { CATEGORY_LABELS, formatPrice } from '@/lib/dulces-maxi/products';
import { useAdminData } from './AdminShell';

export default function AdminPricing() {
  const { products, refresh } = useAdminData();
  const [scope, setScope] = useState('all');
  const [method, setMethod] = useState<PricingMethod>('markup');
  const [percentage, setPercentage] = useState(30);
  const [ending, setEnding] = useState(0);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const scoped = products.filter((product) => (scope === 'all' ? true : product.category === scope));
  const rows = useMemo(
    () =>
      scoped.map((product) => {
        const next = computePrice({
          costPrice: product.cost_price,
          additionalCosts: product.additional_costs,
          method,
          percentage,
          manualPrice: product.price,
          ending,
        });
        const skip = excluded.includes(product.id) || next.price < next.effectiveCost;
        return { product, next, skip, delta: next.price - product.price };
      }),
    [scoped, method, percentage, ending, excluded],
  );
  const applicable = rows.filter((row) => !row.skip);

  const apply = () => {
    if (!authorized) return;
    if (!window.confirm(`Se actualizarán ${applicable.length} productos. ¿Continuar?`)) return;
    setBusy(true);
    setError('');
    try {
      applicable.forEach(({ product, next }) => {
        upsertProduct({
          ...product,
          pricing_method: method,
          markup_percentage: method === 'markup' ? percentage : next.markup,
          target_margin_percentage: method === 'margen_real' ? percentage : next.realMargin,
          rounding_ending: ending,
          price: next.price,
        });
      });
      refresh();
    } catch {
      setError('No se pudieron aplicar los precios.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="dm-admin-kicker">Rentabilidad</p>
      <h1>Costos, precios y márgenes</h1>
      <p className="dm-admin-lead">
        Simulá el cambio antes de aplicarlo. El sistema diferencia recargo sobre costo y margen real.
      </p>
      {error && <p className="dm-admin-alert">{error}</p>}
      <section className="dm-admin-card dm-admin-form__grid">
        <label>
          Aplicar a
          <select value={scope} onChange={(event) => setScope(event.target.value)}>
            <option value="all">Todo el catálogo</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Método
          <select value={method} onChange={(event) => setMethod(event.target.value as PricingMethod)}>
            <option value="markup">Recargo sobre el costo</option>
            <option value="margen_real">Margen real deseado</option>
          </select>
        </label>
        <label>
          Porcentaje
          <input type="number" min={0} value={percentage} onChange={(event) => setPercentage(Number(event.target.value))} />
        </label>
        <label>
          Terminación
          <select value={ending} onChange={(event) => setEnding(Number(event.target.value))}>
            <option value={0}>Sin redondeo</option>
            <option value={9}>9</option>
            <option value={90}>90</option>
            <option value={99}>99</option>
          </select>
        </label>
      </section>
      <p className="dm-admin-muted">Nunca se aplicará un precio inferior al costo efectivo.</p>
      <div className="dm-admin-table-wrap">
        <table className="dm-admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Costo</th>
              <th>Precio actual</th>
              <th>Precio nuevo</th>
              <th>Ganancia</th>
              <th>Margen real</th>
              <th>Variación</th>
              <th>Excluir</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8}>No hay productos en el alcance seleccionado.</td>
              </tr>
            ) : (
              rows.map(({ product, next, skip, delta }) => (
                <tr key={product.id} className={skip ? 'is-muted' : undefined}>
                  <td>{product.name}</td>
                  <td>{formatPrice(next.effectiveCost)}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>{formatPrice(next.price)}</td>
                  <td>{formatPrice(next.grossProfit)}</td>
                  <td>{next.realMargin}%</td>
                  <td>{formatPrice(delta)}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={excluded.includes(product.id)}
                      onChange={(event) =>
                        setExcluded((current) =>
                          event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id),
                        )
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="dm-admin-lead">Vista previa · {applicable.length} productos</p>
      <label className="dm-admin-check">
        <input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} />
        Revisé la simulación y autorizo el cambio masivo.
      </label>
      <button type="button" className="dm-btn dm-btn--primary" disabled={!authorized || busy} onClick={apply}>
        {busy ? 'Aplicando…' : 'Aplicar precios'}
      </button>
    </div>
  );
}
