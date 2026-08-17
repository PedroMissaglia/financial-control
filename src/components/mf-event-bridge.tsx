'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { deleteTransacao } from '@/app/services/transacoes';
import { ConfirmarExclusaoModal } from '@/components/confirmar-exclusao-modal';
import {
  MF_DELETE_TRANSACAO,
  MF_NAVIGATE,
  type MfDeleteTransacaoDetail,
  type MfNavigateDetail,
} from '@/lib/mf-events';

export function MfEventBridge() {
  const router = useRouter();
  const [alvo, setAlvo] = useState<MfDeleteTransacaoDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onNavigate(event: Event) {
      const href = (event as CustomEvent<MfNavigateDetail>).detail?.href;
      if (href) router.push(href);
    }

    function onDelete(event: Event) {
      const detail = (event as CustomEvent<MfDeleteTransacaoDetail>).detail;
      if (!detail?.id) return;
      setError(null);
      setAlvo(detail);
    }

    window.addEventListener(MF_NAVIGATE, onNavigate);
    window.addEventListener(MF_DELETE_TRANSACAO, onDelete);
    return () => {
      window.removeEventListener(MF_NAVIGATE, onNavigate);
      window.removeEventListener(MF_DELETE_TRANSACAO, onDelete);
    };
  }, [router]);

  function handleClose() {
    if (isDeleting) return;
    setAlvo(null);
    setError(null);
  }

  async function handleConfirm() {
    if (!alvo) return;

    setIsDeleting(true);
    setError(null);

    const result = await deleteTransacao(alvo.id);
    setIsDeleting(false);

    if (!result.success) {
      setError(result.message ?? 'Erro ao excluir transação');
      return;
    }

    setAlvo(null);
    router.refresh();
  }

  return (
    <ConfirmarExclusaoModal
      open={alvo != null}
      descricao={alvo?.descricao}
      isDeleting={isDeleting}
      error={error}
      onConfirm={handleConfirm}
      onClose={handleClose}
    />
  );
}
