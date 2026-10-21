export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T, eventName?: string): T {
  if (!isBrowser()) return value;
  window.localStorage.setItem(key, JSON.stringify(value));
  if (eventName) window.dispatchEvent(new Event(eventName));
  return value;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(prefix = 'dm'): string {
  return `${prefix}_${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`;
}
