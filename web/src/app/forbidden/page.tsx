import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ForbiddenView } from '@/components/views/ForbiddenView';

export const metadata: Metadata = { title: 'Access denied' };

export default function ForbiddenPage() {
  return (
    <Suspense>
      <ForbiddenView />
    </Suspense>
  );
}
