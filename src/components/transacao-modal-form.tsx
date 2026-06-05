'use client';

import { useRouter } from 'next/navigation';

import { TransacaoForm } from '@/components/transacao-form';
import type { Transacao } from '@/data/transacoes';

interface TransacaoModalFormProps {
  transacao?: Transacao;
  mode?: 'create' | 'edit';
}

export function TransacaoModalForm({ transacao, mode = 'create' }: Readonly<TransacaoModalFormProps>) {
  const router = useRouter();

  function handleSuccess() {
    router.back();
    router.refresh();
  }

  return <TransacaoForm transacao={transacao} mode={mode} onSuccess={handleSuccess} />;
}
