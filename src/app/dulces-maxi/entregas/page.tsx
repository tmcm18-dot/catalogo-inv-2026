import type { Metadata } from 'next';
import LegalPage from '@/components/dulces-maxi/LegalPage';

export const metadata: Metadata = { title: 'Entregas, retiros y cambios' };

export default function Page() {
  return <LegalPage type="entregas" />;
}
