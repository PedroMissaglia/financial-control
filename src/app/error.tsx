'use client';

import { useEffect } from 'react';

import { ApiUnavailableCard } from '@/components/api-unavailable-card';

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: Readonly<AppErrorProps>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <ApiUnavailableCard onRetry={reset} />
    </div>
  );
}
