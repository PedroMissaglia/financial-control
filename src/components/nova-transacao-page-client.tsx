'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { TransacaoForm } from '@/components/transacao-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMediaQuery } from '@/lib/use-media-query';

export function NovaTransacaoPageClient() {
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const router = useRouter();

  useEffect(() => {
    if (!isDesktop) router.replace('/transacoes?nova=1');
  }, [isDesktop, router]);

  if (!isDesktop) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Abrindo formulário...
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Nova transação</CardTitle>
          <CardDescription>Preencha os dados para registrar uma nova movimentação</CardDescription>
        </CardHeader>
        <CardContent>
          <TransacaoForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
