'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { TransacaoModalForm } from '@/components/transacao-modal-form';
import { useMediaQuery } from '@/lib/use-media-query';

/** Desktop: modal overlay. Mobile: dedicated /transacoes/nova page. */
export function NovaTransacaoIntercept() {
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const router = useRouter();

  useEffect(() => {
    if (!isDesktop) router.replace('/transacoes/nova');
  }, [isDesktop, router]);

  if (!isDesktop) return null;

  return (
    <TransacaoModalForm
      title="Nova transação"
      description="Preencha os dados para registrar uma nova movimentação"
      mode="create"
    />
  );
}
