import type { Metadata } from 'next';
import LegalPage from '@/components/dulces-maxi/LegalPage';

export const metadata: Metadata = { title: 'Política de privacidad' };

export default function Page() {
  return <LegalPage type="privacidad" />;
}
