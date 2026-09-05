import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión 2026 | ERP + CRM + Retail + IA',
  description: 'MVP de gestión integral para ventas, stock, clientes, finanzas e IA asistida.',
};

export default function GestionLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
