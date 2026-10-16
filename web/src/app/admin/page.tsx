import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/ui';
import { AdminView } from '@/components/views/AdminView';

export const metadata: Metadata = { title: 'Admin' };

export default function AdminPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminView />
    </Suspense>
  );
}
