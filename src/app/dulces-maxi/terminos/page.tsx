import type { Metadata } from 'next';
import LegalPage from '@/components/dulces-maxi/LegalPage';

export const metadata: Metadata = { title: 'Términos y condiciones' };

export default function Page() {
  return <LegalPage type="terminos" />;
}
