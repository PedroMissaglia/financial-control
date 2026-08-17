'use client';

import { Button } from '@/components/ui/button';

interface ApiUnavailableBannerProps {
  onRetry: () => void;
}

export function ApiUnavailableBanner({ onRetry }: Readonly<ApiUnavailableBannerProps>) {
  return (
    <div
      className="border-destructive/30 bg-destructive/5 mb-4 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <p className="text-sm">Não foi possível conectar à API. Os dados podem estar desatualizados.</p>
      <Button type="button" variant="outline" size="sm" className="shrink-0 self-start sm:self-auto" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
