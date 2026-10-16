import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/ui';
import { DriversView } from '@/components/views/DriversView';

export const metadata: Metadata = { title: 'Drivers' };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DriversView />
    </Suspense>
  );
}
