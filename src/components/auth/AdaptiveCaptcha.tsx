'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type AdaptiveCaptchaProps = {
  required: boolean;
  provider: 'mock' | 'turnstile' | string;
  siteKey: string | null;
  /** Increment to force widget remount / token clear after failed login. */
  resetSignal?: number;
  onTokenChange: (token: string | null) => void;
  disabled?: boolean;
};

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-turnstile="1"]',
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('No se pudo cargar Turnstile.')),
      );
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Turnstile.'));
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

/**
 * Adaptive CAPTCHA: hidden unless risk requires it.
 * Mock in development; Cloudflare Turnstile when CAPTCHA_PROVIDER=turnstile.
 */
export function AdaptiveCaptcha({
  required,
  provider,
  siteKey,
  resetSignal = 0,
  onTokenChange,
  disabled,
}: AdaptiveCaptchaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const labelId = useId();
  const [error, setError] = useState<string | null>(null);
  const [mockToken, setMockToken] = useState('mock-ok');

  const clearToken = useCallback(() => {
    onTokenChange(null);
  }, [onTokenChange]);

  useEffect(() => {
    if (!required) {
      clearToken();
      setError(null);
      return;
    }

    if (provider === 'mock') {
      onTokenChange(mockToken.trim() || null);
      return;
    }

    if (provider !== 'turnstile') {
      setError('Proveedor CAPTCHA no soportado.');
      clearToken();
      return;
    }

    if (!siteKey) {
      setError('Falta la clave pública de Turnstile.');
      clearToken();
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await loadTurnstileScript();
        if (cancelled || !containerRef.current || !window.turnstile) return;

        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
          widgetIdRef.current = null;
        }

        containerRef.current.innerHTML = '';
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            setError(null);
            onTokenChange(token);
          },
          'expired-callback': () => {
            clearToken();
            setError('El desafío expiró. Completalo nuevamente.');
          },
          'error-callback': () => {
            clearToken();
            setError('No se pudo completar el desafío. Reintentá.');
          },
          theme: 'auto',
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error de CAPTCHA.');
          clearToken();
        }
      }
    })();

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [required, provider, siteKey, resetSignal, mockToken, onTokenChange, clearToken]);

  if (!required) return null;

  if (provider === 'mock') {
    return (
      <div className="adaptiveCaptcha" role="group" aria-labelledby={labelId}>
        <p id={labelId} className="authSubtitle">
          Verificación adicional (modo prueba). Usá el token mock.
        </p>
        <label className="authField">
          <span>Token CAPTCHA de prueba</span>
          <input
            value={mockToken}
            disabled={disabled}
            onChange={(e) => {
              const next = e.target.value;
              setMockToken(next);
              onTokenChange(next.trim() || null);
            }}
            autoComplete="off"
            aria-describedby={error ? `${labelId}-error` : undefined}
          />
        </label>
        <button
          type="button"
          className="authSubmit"
          disabled={disabled}
          onClick={() => {
            setMockToken('mock-ok');
            onTokenChange('mock-ok');
            setError(null);
          }}
        >
          Usar mock-ok
        </button>
        {error ? (
          <p id={`${labelId}-error`} className="authError" role="alert" aria-live="polite">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="adaptiveCaptcha" role="group" aria-labelledby={labelId}>
      <p id={labelId} className="authSubtitle">
        Completá la verificación de seguridad para continuar.
      </p>
      <div ref={containerRef} />
      <button
        type="button"
        className="authSubmit"
        disabled={disabled}
        onClick={() => {
          clearToken();
          setError(null);
          if (widgetIdRef.current && typeof window !== 'undefined' && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
          }
        }}
      >
        Reintentar desafío
      </button>
      {error ? (
        <p id={`${labelId}-error`} className="authError" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
