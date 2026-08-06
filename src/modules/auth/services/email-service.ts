/**
 * Email transport for auth flows.
 * Phase 1 ships a stub that records messages in-memory and logs links in development.
 * Swap the transport for a real provider without changing callers.
 */

export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
};

export type EmailTransport = {
  send(message: OutboundEmail): Promise<void>;
};

const outbox: OutboundEmail[] = [];

const stubTransport: EmailTransport = {
  async send(message) {
    outbox.push(message);
    if (process.env.NODE_ENV !== 'test') {
      console.info('[email:stub]', message.to, message.subject);
      console.info(message.text);
    }
  },
};

let transport: EmailTransport = stubTransport;

export function setEmailTransport(next: EmailTransport): void {
  transport = next;
}

export function resetEmailTransport(): void {
  transport = stubTransport;
}

export function getEmailOutbox(): readonly OutboundEmail[] {
  return outbox;
}

export function clearEmailOutbox(): void {
  outbox.length = 0;
}

export async function sendEmail(message: OutboundEmail): Promise<void> {
  await transport.send(message);
}

export async function sendVerificationEmail(input: {
  to: string;
  token: string;
}): Promise<void> {
  const origin = process.env.APP_ORIGIN ?? 'http://localhost:3000';
  const url = `${origin}/cuenta/verificar?token=${encodeURIComponent(input.token)}`;
  await sendEmail({
    to: input.to,
    subject: 'Verificá tu cuenta — Catálogo INV 2026',
    text: `Para activar tu cuenta, abrí este enlace (válido por tiempo limitado):\n\n${url}\n\nSi no creaste esta cuenta, ignorá este mensaje.`,
  });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  token: string;
}): Promise<void> {
  const origin = process.env.APP_ORIGIN ?? 'http://localhost:3000';
  const url = `${origin}/cuenta/restablecer-contrasena?token=${encodeURIComponent(input.token)}`;
  await sendEmail({
    to: input.to,
    subject: 'Recuperación de acceso — Catálogo INV 2026',
    text: `Si solicitaste recuperar el acceso, usá este enlace (uso único):\n\n${url}\n\nSi no lo solicitaste, ignorá este mensaje.`,
  });
}

export async function sendSecurityAlertEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  await sendEmail(input);
}
