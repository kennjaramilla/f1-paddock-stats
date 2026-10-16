import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <p className="font-display text-7xl font-bold text-accent">404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold uppercase">Off the racing line</h1>
      <p className="mt-2 text-ink-2">That page doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-ink px-4 py-2 text-sm font-medium text-bg">Back to seasons</Link>
    </div>
  );
}
