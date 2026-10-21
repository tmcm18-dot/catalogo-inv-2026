import type { Metadata } from 'next';
import CartPage from '@/components/dulces-maxi/CartPage';

export const metadata: Metadata = { title: 'Tu carrito' };

export default function DulcesMaxiCart() {
  return <CartPage />;
}
