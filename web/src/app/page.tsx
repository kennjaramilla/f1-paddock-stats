import { Suspense } from 'react';
import { PageSkeleton } from '@/components/ui';
import { SeasonsIndex } from '@/components/views/SeasonsIndex';

export default function Home() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SeasonsIndex />
    </Suspense>
  );
}
