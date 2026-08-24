'use client';

import { useEffect, useState } from 'react';

import { fetchTransacoes } from '@/app/services/transacoes';
import type { Transacao } from '@/data/transacoes';
import { MF_DASHBOARD_URL } from '@/lib/load-mf-remote';
import { MF_TRANSACOES_CHANGED, MF_VISAO_CHANGED } from '@/lib/mf-events';
import { useEscopoFinanceiro } from '@/lib/use-escopo-financeiro';
import { useMfDashboardBaseProps } from '@/lib/use-mf-dashboard-base-props';
import { useMfDashboardMount } from '@/lib/use-mf-dashboard-mount';

interface DashboardViewMicrofrontendProps {
  transacoes?: Transacao[];
}

export function DashboardViewMicrofrontend({
  transacoes: transacoesProp = [],
}: Readonly<DashboardViewMicrofrontendProps>) {
  const { usuarioIds } = useEscopoFinanceiro();
  const idsKey = usuarioIds.join(',');
  const [transacoes, setTransacoes] = useState<Transacao[]>(transacoesProp);

  useEffect(() => {
    if (transacoesProp.length > 0) {
      setTransacoes(transacoesProp);
    }
  }, [transacoesProp]);

  useEffect(() => {
    if (!idsKey) return;
    const ids = idsKey.split(',');
    let cancelled = false;

    async function reload() {
      const result = await fetchTransacoes(ids);
      if (cancelled || !result.success || !result.data) return;
      setTransacoes(result.data);
    }

    void reload();
    window.addEventListener(MF_TRANSACOES_CHANGED, reload);
    window.addEventListener(MF_VISAO_CHANGED, reload);
    return () => {
      cancelled = true;
      window.removeEventListener(MF_TRANSACOES_CHANGED, reload);
      window.removeEventListener(MF_VISAO_CHANGED, reload);
    };
  }, [idsKey]);

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
