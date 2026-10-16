import { Suspense } from 'react';
import { PageSkeleton } from '@/components/ui';
import { SeasonView } from '@/components/views/SeasonView';

export default function SeasonPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SeasonView />
    </Suspense>
  );
}
