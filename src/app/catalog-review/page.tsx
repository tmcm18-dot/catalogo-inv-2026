import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isCatalogReviewEnabled } from '@/lib/catalog-review/security';
import { CatalogReviewApp } from '@/components/catalog-review/CatalogReviewApp';

export const metadata: Metadata = {
  title: 'Revisión de catálogo (local)',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function CatalogReviewPage() {
  if (!isCatalogReviewEnabled()) notFound();
  return <CatalogReviewApp />;
}
