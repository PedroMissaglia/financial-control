'use client';

import { useEffect, useState } from 'react';

import { fetchTransacoes } from '@/app/services/transacoes';
import type { Transacao } from '@/data/transacoes';
import { MF_DASHBOARD_URL } from '@/lib/load-mf-remote';
import { MF_TRANSACOES_CHANGED } from '@/lib/mf-events';
import { useMfDashboardBaseProps } from '@/lib/use-mf-dashboard-base-props';
import { useMfDashboardMount } from '@/lib/use-mf-dashboard-mount';
import { useAppSelector } from '@/store/hooks';

interface DashboardViewMicrofrontendProps {
  transacoes?: Transacao[];
}

export function DashboardViewMicrofrontend({
  transacoes: transacoesProp = [],
}: Readonly<DashboardViewMicrofrontendProps>) {
  const usuarioId = useAppSelector(state => state.auth.usuario?.id);
  const [transacoes, setTransacoes] = useState<Transacao[]>(transacoesProp);

  useEffect(() => {
    if (transacoesProp.length > 0) {
      setTransacoes(transacoesProp);
    }
  }, [transacoesProp]);

  useEffect(() => {
    if (!usuarioId) return;
    const uid = usuarioId;
    let cancelled = false;

    async function reload() {
      const result = await fetchTransacoes(uid);
      if (cancelled || !result.success || !result.data) return;
      setTransacoes(result.data);
    }

    void reload();
    window.addEventListener(MF_TRANSACOES_CHANGED, reload);
    return () => {
      cancelled = true;
      window.removeEventListener(MF_TRANSACOES_CHANGED, reload);
    };
  }, [usuarioId]);

  const mfProps = useMfDashboardBaseProps(transacoes);
  const { hostRef, mode } = useMfDashboardMount('./DashboardView', mfProps);

  return (
    <>
      {mode === 'loading' && (
        <p className="text-muted-foreground mb-4 text-sm" role="status">
          Carregando dashboard...
        </p>
      )}
      {mode === 'error' && (
        <p className="text-muted-foreground mb-4 text-sm" role="alert">
          O microfrontend do dashboard não respondeu em {MF_DASHBOARD_URL}. Verifique se o serviço mf-dashboard está
          em execução.
        </p>
      )}
      <div ref={hostRef} />
    </>
  );
}
