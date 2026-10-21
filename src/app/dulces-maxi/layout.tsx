import './dulces-maxi.css';
import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito_Sans } from 'next/font/google';
import StoreShell from '@/components/dulces-maxi/StoreShell';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--dm-font-fredoka',
  display: 'swap',
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--dm-font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Dulces Maxi · Mermeladas, dulces y pastelería artesanal',
    template: '%s · Dulces Maxi',
  },
  description:
    'Dulces Maxi: mermeladas, dulces y pastelería artesanal por encargo en Salta. Catálogo, carrito y pedidos por WhatsApp.',
  openGraph: {
    title: 'Dulces Maxi · Mermeladas, dulces y pastelería artesanal',
    description: 'Sabores caseros, lotes pequeños y pedidos directos por WhatsApp.',
  },
  icons: {
    icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E🍓%3C/text%3E%3C/svg%3E',
  },
};

export const viewport: Viewport = {
  themeColor: '#C51D5D',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function DulcesMaxiLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`dm ${fredoka.variable} ${nunitoSans.variable}`} lang="es-AR">
      <StoreShell>{children}</StoreShell>
    </div>
  );
}
