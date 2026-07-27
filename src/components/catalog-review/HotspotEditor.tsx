'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HotspotCoords } from '@/lib/catalog-review/types';
import { findWideOverlaps, roundCoord, validateCoords } from '@/lib/catalog-review/coords';

type Mode = 'idle' | 'draw' | 'move' | 'resize';

type Props = {
  pageImage: string;
  initial: HotspotCoords | null;
  otherHotspots?: HotspotCoords[];
  onChange: (coords: HotspotCoords | null) => void;
  enabled: boolean;
};

type Handle = 'nw' | 'ne' | 'sw' | 'se';

export function HotspotEditor({ pageImage, initial, otherHotspots = [], onChange, enabled }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<HotspotCoords | null>(initial);
  const [mode, setMode] = useState<Mode>('idle');
  const [activeHandle, setActiveHandle] = useState<Handle | null>(null);
  const dragOrigin = useRef<{ x: number; y: number; coords: HotspotCoords } | null>(null);
  const drawOrigin = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setCoords(initial);
  }, [initial]);

  const overlaps = useMemo(() => {
    if (!coords) return [];
    return findWideOverlaps(coords, otherHotspots);
  }, [coords, otherHotspots]);

  const validation = validateCoords(coords);

  const toPercent = useCallback((clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    };
  }, []);

  const commit = useCallback(
    (next: HotspotCoords | null) => {
      setCoords(next);
      onChange(next);
    },
    [onChange],
  );

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!enabled) return;
    const target = e.target as HTMLElement;
    const handle = target.dataset.handle as Handle | undefined;
    const point = toPercent(e.clientX, e.clientY);

    if (handle && coords) {
      setMode('resize');
      setActiveHandle(handle);
      dragOrigin.current = { x: point.x, y: point.y, coords: { ...coords } };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (coords) {
      const inside =
        point.x >= coords.x &&
        point.x <= coords.x + coords.width &&
        point.y >= coords.y &&
        point.y <= coords.y + coords.height;
      if (inside) {
        setMode('move');
        dragOrigin.current = { x: point.x, y: point.y, coords: { ...coords } };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
    }

    setMode('draw');
    drawOrigin.current = point;
    commit({ x: roundCoord(point.x), y: roundCoord(point.y), width: 0.5, height: 0.5 });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!enabled || mode === 'idle') return;
    const point = toPercent(e.clientX, e.clientY);

    if (mode === 'draw' && drawOrigin.current) {
      const x1 = drawOrigin.current.x;
      const y1 = drawOrigin.current.y;
      const x = Math.min(x1, point.x);
      const y = Math.min(y1, point.y);
      const width = Math.max(0.5, Math.abs(point.x - x1));
      const height = Math.max(0.5, Math.abs(point.y - y1));
      commit({
        x: roundCoord(x),
        y: roundCoord(y),
        width: roundCoord(Math.min(width, 100 - x)),
        height: roundCoord(Math.min(height, 100 - y)),
      });
      return;
    }

    if (!dragOrigin.current || !coords) return;
    const origin = dragOrigin.current;

    if (mode === 'move') {
      const dx = point.x - origin.x;
      const dy = point.y - origin.y;
      let x = origin.coords.x + dx;
      let y = origin.coords.y + dy;
      x = Math.min(100 - origin.coords.width, Math.max(0, x));
      y = Math.min(100 - origin.coords.height, Math.max(0, y));
      commit({
        ...origin.coords,
        x: roundCoord(x),
        y: roundCoord(y),
      });
      return;
    }

    if (mode === 'resize' && activeHandle) {
      let { x, y, width, height } = origin.coords;
      const right = x + width;
      const bottom = y + height;
      if (activeHandle.includes('e')) {
        width = Math.max(0.5, point.x - x);
      }
      if (activeHandle.includes('s')) {
        height = Math.max(0.5, point.y - y);
      }
      if (activeHandle.includes('w')) {
        x = Math.min(point.x, right - 0.5);
        width = right - x;
      }
      if (activeHandle.includes('n')) {
        y = Math.min(point.y, bottom - 0.5);
        height = bottom - y;
      }
      x = Math.max(0, x);
      y = Math.max(0, y);
      width = Math.min(width, 100 - x);
      height = Math.min(height, 100 - y);
      commit({
        x: roundCoord(x),
        y: roundCoord(y),
        width: roundCoord(width),
        height: roundCoord(height),
      });
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setMode('idle');
    setActiveHandle(null);
    dragOrigin.current = null;
    drawOrigin.current = null;
  }

  function updateField(field: keyof HotspotCoords, raw: string) {
    if (!coords) return;
    const value = Number(raw);
    const next = { ...coords, [field]: Number.isFinite(value) ? value : coords[field] };
    commit(next);
  }

  return (
    <div className="reviewEditor">
      <div
        ref={wrapRef}
        className={`reviewEditorCanvas${enabled ? ' isEnabled' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="application"
        aria-label="Editor de coordenadas del hotspot"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pageImage} alt="Página del catálogo" draggable={false} />
        {coords ? (
          <div
            className="reviewHotspotBox"
            style={{
              left: `${coords.x}%`,
              top: `${coords.y}%`,
              width: `${coords.width}%`,
              height: `${coords.height}%`,
            }}
          >
            {(['nw', 'ne', 'sw', 'se'] as Handle[]).map((handle) => (
              <button
                key={handle}
                type="button"
                className={`reviewHandle reviewHandle-${handle}`}
                data-handle={handle}
                aria-label={`Redimensionar ${handle}`}
                disabled={!enabled}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="reviewEditorMeta">
        <label>
          x
          <input
            type="number"
            step="0.01"
            value={coords?.x ?? ''}
            disabled={!enabled || !coords}
            onChange={(e) => updateField('x', e.target.value)}
          />
        </label>
        <label>
          y
          <input
            type="number"
            step="0.01"
            value={coords?.y ?? ''}
            disabled={!enabled || !coords}
            onChange={(e) => updateField('y', e.target.value)}
          />
        </label>
        <label>
          width
          <input
            type="number"
            step="0.01"
            value={coords?.width ?? ''}
            disabled={!enabled || !coords}
            onChange={(e) => updateField('width', e.target.value)}
          />
        </label>
        <label>
          height
          <input
            type="number"
            step="0.01"
            value={coords?.height ?? ''}
            disabled={!enabled || !coords}
            onChange={(e) => updateField('height', e.target.value)}
          />
        </label>
      </div>

      {!validation.ok ? (
        <p className="reviewWarn" role="alert">
          Coordenadas inválidas: {validation.errors.join('; ')}
        </p>
      ) : null}
      {overlaps.length > 0 ? (
        <p className="reviewWarn">
          Advertencia: superposición amplia con {overlaps.length} hotspot(s) (
          {overlaps.map((o) => `${Math.round(o.ratio * 100)}%`).join(', ')}). No se bloquea automáticamente.
        </p>
      ) : null}
    </div>
  );
}
