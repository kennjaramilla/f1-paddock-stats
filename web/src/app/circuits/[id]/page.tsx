import { Suspense } from 'react';
import { PageSkeleton } from '@/components/ui';
import { CircuitDetailView } from '@/components/views/CircuitDetailView';

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CircuitDetailView />
    </Suspense>
  );
}
