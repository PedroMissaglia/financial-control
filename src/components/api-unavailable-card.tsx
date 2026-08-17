'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

interface ApiUnavailableCardProps {
  onRetry?: () => void;
}

export function ApiUnavailableCard({ onRetry }: Readonly<ApiUnavailableCardProps>) {
  const router = useRouter();

  return (
    <div className="rounded-xl border bg-white p-8 text-center" role="alert">
      <h2 className="text-lg font-semibold">Não foi possível carregar</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Não foi possível conectar à API. Verifique se o serviço está disponível e tente novamente.
      </p>
      <Button className="mt-4" onClick={onRetry ?? (() => router.refresh())}>
        Tentar novamente
      </Button>
    </div>
  );
}
