import type { Metadata } from 'next';
import LegalPage from '@/components/dulces-maxi/LegalPage';

export const metadata: Metadata = { title: 'Consumo responsable' };

export default function Page() {
  return <LegalPage type="alcohol" />;
}
