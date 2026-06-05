'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

interface TransacoesErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TransacoesError({ error, reset }: TransacoesErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border bg-white p-8 text-center" role="alert">
      <h2 className="text-lg font-semibold">Erro ao carregar transações</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Verifique se o json-server está rodando em http://localhost:3001
      </p>
      <Button className="mt-4" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
