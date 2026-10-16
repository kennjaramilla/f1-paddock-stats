import { Suspense } from 'react';
import { PageSkeleton } from '@/components/ui';
import { DriverDetailView } from '@/components/views/DriverDetailView';

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DriverDetailView />
    </Suspense>
  );
}
