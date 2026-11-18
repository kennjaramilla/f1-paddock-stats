import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/ui';
import { TeamsView } from '@/components/views/TeamsView';

export const metadata: Metadata = { title: 'Teams' };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TeamsView />
    </Suspense>
  );
}
