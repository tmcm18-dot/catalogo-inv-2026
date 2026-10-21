import { Suspense } from 'react';
import HomePage from '@/components/dulces-maxi/HomePage';

function HomeFallback() {
  return (
    <div className="dm-container" style={{ display: 'flex', justifyContent: 'center', padding: '96px 0' }} role="status">
      <div className="dm-spinner" />
    </div>
  );
}

export default function DulcesMaxiHome() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomePage />
    </Suspense>
  );
}
