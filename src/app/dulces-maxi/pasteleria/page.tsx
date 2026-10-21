import type { Metadata } from 'next';
import { Suspense } from 'react';
import PastryPage from '@/components/dulces-maxi/PastryPage';

export const metadata: Metadata = {
  title: 'Pastelería por encargo',
  description:
    'Tortas, tartas de molde Nº 22 y mesas dulces elaboradas únicamente por encargo en Salta. Solicitá tu presupuesto.',
};

export default function DulcesMaxiPastry() {
  return (
    <Suspense fallback={null}>
      <PastryPage />
    </Suspense>
  );
}
