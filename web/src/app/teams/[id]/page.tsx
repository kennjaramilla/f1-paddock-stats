import { Suspense } from 'react';
import { PageSkeleton } from '@/components/ui';
import { TeamDetailView } from '@/components/views/TeamDetailView';

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TeamDetailView />
    </Suspense>
  );
}
