'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  filterReviewCases,
  generateUniqueHotspotId,
  nextPendingIndex,
  summarizeCases,
} from '@/lib/catalog-review';
import type {
  HotspotCoords,
  PendingCasesFile,
  ReviewCase,
  ReviewClassification,
  ReviewDecision,
  ReviewDecisionKind,
  ConfirmedDecisionsFile,
} from '@/lib/catalog-review/types';
import { HotspotEditor } from './HotspotEditor';

type LoadPayload = {
  pending: PendingCasesFile;
  decisions: ConfirmedDecisionsFile;
};

const CLASSIFICATIONS: Array<ReviewClassification | 'ALL'> = [
  'ALL',
  'MISMATCH_HIGH',
  'MISMATCH_MEDIUM',
  'AMBIGUOUS',
  'NOT_FOUND',
  'SHARED_CODE',
  'MISSING_HOTSPOT',
  'SIZES_MISMATCH',
  'COLORS_MISMATCH',
  'SIZES_MISSING',
  'COLORS_MISSING',
];

const BATCHES = [
  { id: 'ALL', label: 'Todos' },
  { id: 'A', label: 'Lote A · MISMATCH_HIGH' },
  { id: 'B', label: 'Lote B · MISMATCH_MEDIUM' },
  { id: 'C', label: 'Lote C · AMBIGUOUS/SHARED' },
  { id: 'D', label: 'Lote D · NOT_FOUND' },
  { id: 'E', label: 'Lote E · MISSING_HOTSPOT' },
  { id: 'ATTR', label: 'Atributos talles/colores' },
] as const;

export function CatalogReviewApp() {
  const [cases, setCases] = useState<ReviewCase[]>([]);
  const [decisions, setDecisions] = useState<ReviewDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [classification, setClassification] = useState<(typeof CLASSIFICATIONS)[number]>('ALL');
  const [batch, setBatch] = useState<(typeof BATCHES)[number]['id']>('ALL');
  const [pageFilter, setPageFilter] = useState('');
  const [codeQuery, setCodeQuery] = useState('');
  const [productIdQuery, setProductIdQuery] = useState('');
  const [onlyPending, setOnlyPending] = useState(true);
  const [comment, setComment] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [draftCoords, setDraftCoords] = useState<HotspotCoords | null>(null);
  const [editCoordsMode, setEditCoordsMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/catalog-review/cases', { cache: 'no-store' });
      if (res.status === 404) {
        setError('Herramienta deshabilitada (404). Usá npm run review:catalog');
        setCases([]);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as LoadPayload;
      setCases(data.pending.cases || []);
      setDecisions(data.decisions.decisions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      filterReviewCases(cases, {
        classification,
        batch,
        page: pageFilter ? Number(pageFilter) : null,
        codeQuery,
        productIdQuery,
        onlyPending,
      }),
    [cases, classification, batch, pageFilter, codeQuery, productIdQuery, onlyPending],
  );

  useEffect(() => {
    setIndex(0);
  }, [classification, batch, pageFilter, codeQuery, productIdQuery, onlyPending]);

  const current = filtered[index] || null;

  useEffect(() => {
    if (!current) {
      setSelectedProductId('');
      setDraftCoords(null);
      setEditCoordsMode(false);
      setComment('');
      return;
    }
    setSelectedProductId(current.suggestedProductId || current.productId || '');
    setDraftCoords(current.coordinates);
    setEditCoordsMode(current.classification === 'MISSING_HOTSPOT');
    setComment('');
    setMessage(null);
  }, [current?.caseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = useMemo(() => summarizeCases(cases), [cases]);
  const decisionByCase = useMemo(() => new Map(decisions.map((d) => [d.caseId, d])), [decisions]);

  const cropStyle = useMemo(() => {
    const coords = current?.coordinates;
    if (!coords || !current) return null;
    const pad = 4;
    const x = Math.max(0, coords.x - pad);
    const y = Math.max(0, coords.y - pad);
    const w = Math.min(100 - x, coords.width + pad * 2);
    const h = Math.min(100 - y, coords.height + pad * 2);
    return {
      backgroundImage: `url(${current.pageImage})`,
      backgroundSize: `${10000 / w}% ${10000 / h}%`,
      backgroundPosition: `${(x / (100 - w || 1)) * 100}% ${(y / (100 - h || 1)) * 100}%`,
    } as React.CSSProperties;
  }, [current]);

  async function saveDecision(partial: {
    decision: ReviewDecisionKind;
    confirmed: boolean;
    newValue?: Record<string, unknown> | null;
    previousValue?: Record<string, unknown> | null;
    productId?: string | null;
    hotspotId?: string | null;
  }) {
    if (!current) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload: Partial<ReviewDecision> = {
        caseId: current.caseId,
        classification: current.classification,
        decision: partial.decision,
        previousValue: partial.previousValue ?? {
          productId: current.productId,
          coordinates: current.coordinates,
          sizes: current.currentSizes,
          colors: current.currentColors,
        },
        newValue: partial.newValue ?? null,
        evidence: current.evidencePath,
        comment,
        confidence: current.confidence,
        confirmed: partial.confirmed,
        timestamp: new Date().toISOString(),
        page: current.page,
        hotspotId: partial.hotspotId ?? current.hotspotId,
        productId: partial.productId ?? current.productId,
      };
      const res = await fetch('/api/catalog-review/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details?.join?.('; ') || data.error || 'Error al guardar');
      setDecisions(data.file.decisions);
      setCases((prev) =>
        prev.map((item) =>
          item.caseId === current.caseId ? { ...item, reviewStatus: data.decision.reviewStatus } : item,
        ),
      );
      setMessage('Decisión guardada en reports/catalog-review/confirmed-decisions.json');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function deleteDecision() {
    if (!current) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/catalog-review/decisions?caseId=${encodeURIComponent(current.caseId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al borrar');
      setDecisions(data.file.decisions);
      setCases((prev) =>
        prev.map((item) => (item.caseId === current.caseId ? { ...item, reviewStatus: 'pending' } : item)),
      );
      setMessage('Decisión eliminada');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al borrar');
    } finally {
      setSaving(false);
    }
  }

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }
  function goNext() {
    setIndex((i) => Math.min(filtered.length - 1, i + 1));
  }
  function goNextPending() {
    const next = nextPendingIndex(filtered, index);
    if (next >= 0) setIndex(next);
  }

  if (loading) {
    return <main className="reviewShell"><p>Cargando cola de revisión…</p></main>;
  }
  if (error) {
    return (
      <main className="reviewShell">
        <h1>Revisión de catálogo</h1>
        <p className="reviewWarn">{error}</p>
      </main>
    );
  }

  return (
    <main className="reviewShell">
      <header className="reviewHeader">
        <div>
          <h1>Revisión asistida · INV 2026</h1>
          <p className="reviewMuted">Solo local · no modifica products/hotspots hasta review:apply --confirm</p>
        </div>
        <div className="reviewSummary">
          <span>Pendientes: {summary.pending}</span>
          <span>Revisados: {summary.reviewed}</span>
          <span>Confirmados: {summary.confirmed}</span>
          <span>Ambiguos: {summary.ambiguous}</span>
          <span>Rechazados: {summary.rejected}</span>
        </div>
      </header>

      <section className="reviewFilters" aria-label="Filtros">
        <label>
          Clasificación
          <select value={classification} onChange={(e) => setClassification(e.target.value as typeof classification)}>
            {CLASSIFICATIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Lote
          <select value={batch} onChange={(e) => setBatch(e.target.value as typeof batch)}>
            {BATCHES.map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
        </label>
        <label>
          Página
          <input value={pageFilter} onChange={(e) => setPageFilter(e.target.value)} inputMode="numeric" placeholder="ej. 18" />
        </label>
        <label>
          Código
          <input value={codeQuery} onChange={(e) => setCodeQuery(e.target.value)} placeholder="buscar código" />
        </label>
        <label>
          productId
          <input value={productIdQuery} onChange={(e) => setProductIdQuery(e.target.value)} placeholder="buscar id" />
        </label>
        <label className="reviewCheck">
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} />
          Solo pendientes
        </label>
        <button type="button" onClick={() => void load()}>Recargar</button>
      </section>

      <div className="reviewNav">
        <button type="button" onClick={goPrev} disabled={index <= 0}>Anterior</button>
        <button type="button" onClick={goNext} disabled={index >= filtered.length - 1}>Siguiente</button>
        <button type="button" onClick={goNextPending}>Siguiente pendiente</button>
        <span className="reviewMuted">
          {filtered.length ? `${index + 1} / ${filtered.length}` : '0 casos'}
        </span>
      </div>

      {!current ? (
        <p>No hay casos con los filtros actuales. Generá la cola con <code>npm run review:generate</code>.</p>
      ) : (
        <div className="reviewGrid">
          <section className="reviewPanel">
            <h2>{current.classification} · p{current.page}</h2>
            <p><strong>caseId:</strong> {current.caseId}</p>
            <p><strong>Estado:</strong> {current.reviewStatus}</p>
            <p><strong>Confianza:</strong> {current.confidence}</p>
            <p><strong>Explicación:</strong> {current.explanation}</p>
            {current.evidencePath ? (
              <p>
                <strong>Evidencia:</strong> <code>{current.evidencePath}</code>
              </p>
            ) : null}
            {decisionByCase.get(current.caseId) ? (
              <p className="reviewMuted">
                Decisión guardada: {decisionByCase.get(current.caseId)?.decision}
              </p>
            ) : null}

            <div className="reviewPageFrame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.pageImage} alt={`Página ${current.page}`} />
              {current.coordinates ? (
                <div
                  className="reviewOverlayBox"
                  style={{
                    left: `${current.coordinates.x}%`,
                    top: `${current.coordinates.y}%`,
                    width: `${current.coordinates.width}%`,
                    height: `${current.coordinates.height}%`,
                  }}
                />
              ) : null}
            </div>

            {cropStyle ? (
              <div className="reviewCrop" style={cropStyle} aria-label="Recorte de la zona del producto" />
            ) : null}

            {(editCoordsMode || current.classification === 'MISSING_HOTSPOT') ? (
              <HotspotEditor
                pageImage={current.pageImage}
                initial={draftCoords}
                enabled
                onChange={setDraftCoords}
              />
            ) : null}
          </section>

          <section className="reviewPanel">
            <h3>Producto enlazado</h3>
            <ul className="reviewList">
              <li>productId: {current.productId || '—'}</li>
              <li>código: {current.currentCode || '—'}</li>
              <li>nombre: {current.currentName || '—'}</li>
              <li>marca: {current.currentBrand || '—'}</li>
              <li>categoría: {current.currentCategory || '—'}</li>
              <li>página: {current.page}</li>
              <li>talles: {current.currentSizes.join(', ') || '—'}</li>
              <li>colores: {current.currentColors.join(', ') || '—'}</li>
            </ul>

            <h3>Detectado en catálogo / PDF</h3>
            <ul className="reviewList">
              <li>código impreso: {current.printedCode || '—'}</li>
              <li>talles detectados: {current.printedSizes.join(', ') || '—'}</li>
              <li>colores detectados: {current.printedColors.join(', ') || '—'}</li>
              <li>T/C raw: {current.tcRaw || '—'}</li>
            </ul>

            <h3>Candidatos</h3>
            <div className="reviewCandidates">
              {current.candidateProducts.length === 0 ? <p className="reviewMuted">Sin candidatos</p> : null}
              {current.candidateProducts.map((c) => (
                <label key={c.productId} className="reviewCandidate">
                  <input
                    type="radio"
                    name="candidate"
                    checked={selectedProductId === c.productId}
                    onChange={() => setSelectedProductId(c.productId)}
                  />
                  <span>{c.productId} · {c.code} · {c.name}</span>
                </label>
              ))}
            </div>

            <label className="reviewComment">
              Comentario / motivo
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
            </label>

            <div className="reviewActions">
              <button
                type="button"
                disabled={saving || !current.hotspotId}
                onClick={() => void saveDecision({ decision: 'confirm-current', confirmed: true })}
              >
                Confirmar producto actual
              </button>
              <button
                type="button"
                disabled={saving || !selectedProductId || !current.hotspotId}
                onClick={() =>
                  void saveDecision({
                    decision: 'reassign-product',
                    confirmed: true,
                    productId: selectedProductId,
                    newValue: { productId: selectedProductId },
                  })
                }
              >
                Reasignar productId
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditCoordsMode((v) => !v)}
              >
                {editCoordsMode ? 'Ocultar editor coords' : 'Coords incorrectas / editar'}
              </button>
              <button
                type="button"
                disabled={saving || !draftCoords || !current.hotspotId}
                onClick={() =>
                  void saveDecision({
                    decision: 'fix-coordinates',
                    confirmed: true,
                    newValue: { coordinates: draftCoords },
                  })
                }
              >
                Confirmar coordenadas
              </button>
              <button
                type="button"
                disabled={saving || current.printedSizes.length === 0}
                onClick={() =>
                  void saveDecision({
                    decision: 'update-sizes',
                    confirmed: true,
                    productId: current.productId,
                    newValue: { sizes: current.printedSizes, productId: current.productId },
                  })
                }
              >
                Confirmar talles impresos
              </button>
              <button
                type="button"
                disabled={saving || current.printedColors.length === 0}
                onClick={() =>
                  void saveDecision({
                    decision: 'update-colors',
                    confirmed: true,
                    productId: current.productId,
                    newValue: { colors: current.printedColors, productId: current.productId },
                  })
                }
              >
                Confirmar colores impresos
              </button>
              <button
                type="button"
                disabled={saving || current.classification !== 'MISSING_HOTSPOT' || !draftCoords || !selectedProductId}
                onClick={() => {
                  const existing = new Set(
                    cases.map((c) => c.hotspotId).filter(Boolean) as string[],
                  );
                  const hotspotId = generateUniqueHotspotId(selectedProductId, current.page, existing);
                  void saveDecision({
                    decision: 'create-hotspot',
                    confirmed: true,
                    productId: selectedProductId,
                    hotspotId,
                    newValue: {
                      productId: selectedProductId,
                      hotspotId,
                      coordinates: draftCoords,
                      page: current.page,
                    },
                  });
                }}
              >
                Confirmar creación de hotspot
              </button>
              <button
                type="button"
                disabled={saving || !current.hotspotId}
                onClick={() =>
                  void saveDecision({
                    decision: 'remove-hotspot',
                    confirmed: true,
                    newValue: { hotspotId: current.hotspotId },
                  })
                }
              >
                Proponer eliminación
              </button>
              <button type="button" disabled={saving} onClick={() => void saveDecision({ decision: 'mark-ambiguous', confirmed: false })}>
                Marcar ambiguo
              </button>
              <button type="button" disabled={saving} onClick={() => void saveDecision({ decision: 'mark-rejected', confirmed: false })}>
                Rechazar
              </button>
              <button type="button" disabled={saving} onClick={() => void saveDecision({ decision: 'needs-manual-source', confirmed: false })}>
                Requiere fuente manual
              </button>
              <button type="button" disabled={saving || !decisionByCase.has(current.caseId)} onClick={() => void deleteDecision()}>
                Borrar decisión
              </button>
            </div>
            {message ? <p className="reviewMsg">{message}</p> : null}
            <p className="reviewMuted">
              PDF: <a href="/assets/catalogo/pdf/inv-2026.pdf" target="_blank" rel="noreferrer">inv-2026.pdf</a>
              {' · '}página {current.page}
            </p>
          </section>
        </div>
      )}

      <section className="reviewPanel">
        <h3>Casos por clasificación</h3>
        <ul className="reviewList inline">
          {Object.entries(summary.byClassification).map(([key, value]) => (
            <li key={key}>{key}: {value}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
