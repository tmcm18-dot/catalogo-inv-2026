export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function normalizeIdentifier(identifier: string): {
  kind: 'email' | 'phone';
  value: string;
  normalized: string;
} {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    const normalized = normalizeEmail(trimmed);
    return { kind: 'email', value: trimmed, normalized };
  }
  const normalized = normalizePhone(trimmed);
  return { kind: 'phone', value: trimmed, normalized };
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  return `${local.slice(0, 2)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = normalizePhone(phone);
  const visible = digits.slice(-4);
  return `******${visible}`;
}
