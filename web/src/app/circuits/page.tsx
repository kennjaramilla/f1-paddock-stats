import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/ui';
import { CircuitsView } from '@/components/views/CircuitsView';

export const metadata: Metadata = { title: 'Circuits' };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CircuitsView />
    </Suspense>
  );
}
