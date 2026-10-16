import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/ui';
import { CompareView } from '@/components/views/CompareView';

export const metadata: Metadata = { title: 'Head-to-head' };

export default function ComparePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CompareView />
    </Suspense>
  );
}
