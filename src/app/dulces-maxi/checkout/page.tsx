import type { Metadata } from 'next';
import CheckoutPage from '@/components/dulces-maxi/CheckoutPage';

export const metadata: Metadata = { title: 'Datos y forma de pago' };

export default function DulcesMaxiCheckout() {
  return <CheckoutPage />;
}
