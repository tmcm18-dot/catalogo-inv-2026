import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Catálogo INV 2026', description: 'Catálogo digital interactivo con PDF.js, carrito y WhatsApp' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
