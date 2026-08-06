'use client';

import { FormEvent, useState } from 'react';

type Field = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
};

type Props = {
  title: string;
  subtitle?: string;
  fields: Field[];
  submitLabel: string;
  footer?: React.ReactNode;
  extras?: React.ReactNode;
  onSubmit: (values: Record<string, string | boolean>) => Promise<void>;
};

export function AuthForm({
  title,
  subtitle,
  fields,
  submitLabel,
  footer,
  extras,
  onSubmit,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const values: Record<string, string | boolean> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value === 'string') values[key] = value;
    }
    for (const field of fields) {
      if (field.type === 'checkbox') {
        values[field.name] = form.get(field.name) === 'on';
      }
    }

    try {
      await onSubmit(values);
      setMessage('Operación completada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="authCard">
      <h1>{title}</h1>
      {subtitle ? <p className="authSubtitle">{subtitle}</p> : null}
      <form onSubmit={handleSubmit} className="authForm" noValidate>
        {fields.map((field) => {
          if (field.type === 'checkbox') {
            return (
              <label key={field.name} className="authCheck">
                <input type="checkbox" name={field.name} required={field.required} />
                <span>{field.label}</span>
              </label>
            );
          }

          const isPassword = field.type === 'password';
          return (
            <label key={field.name} className="authField">
              <span>{field.label}</span>
              <div className="authInputRow">
                <input
                  name={field.name}
                  type={isPassword && showPassword ? 'text' : field.type ?? 'text'}
                  autoComplete={field.autoComplete}
                  required={field.required !== false}
                  disabled={loading}
                />
                {isPassword ? (
                  <button
                    type="button"
                    className="authToggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                ) : null}
              </div>
            </label>
          );
        })}
        {extras}
        {error ? (
          <p className="authError" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="authOk" role="status">
            {message}
          </p>
        ) : null}
        <button type="submit" className="authSubmit" disabled={loading}>
          {loading ? 'Procesando…' : submitLabel}
        </button>
      </form>
      {footer ? <div className="authFooter">{footer}</div> : null}
    </section>
  );
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'No fue posible completar la operación.');
  }
  return payload.data as T;
}
