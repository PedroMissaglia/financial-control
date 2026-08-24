'use client';

import { useEffect, useRef, useState } from 'react';

import { fetchTransacoes } from '@/app/services/transacoes';
import type { Transacao } from '@/data/transacoes';
import { MF_DASHBOARD_URL } from '@/lib/load-mf-remote';
import { MF_TRANSACOES_CHANGED } from '@/lib/mf-events';
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
  const [scopeLoading, setScopeLoading] = useState(Boolean(idsKey));
  const fetchGen = useRef(0);

  useEffect(() => {
    if (transacoesProp.length > 0 && !scopeLoading) {
      setTransacoes(transacoesProp);
    }
  }, [transacoesProp, scopeLoading]);

  useEffect(() => {
    if (!idsKey) {
      setTransacoes([]);
      setScopeLoading(false);
      return;
    }

    const ids = idsKey.split(',');
    const gen = ++fetchGen.current;
    let cancelled = false;
    setScopeLoading(true);
    setTransacoes([]);

    async function reload(options?: { silent?: boolean }) {
      if (!options?.silent) {
        setScopeLoading(true);
      }
      const result = await fetchTransacoes(ids);
      if (cancelled || gen !== fetchGen.current) return;
      if (result.success && result.data) {
        setTransacoes(result.data);
      }
      setScopeLoading(false);
    }

    void reload();

    function onTransacoesChanged() {
      void reload({ silent: true });
    }

    window.addEventListener(MF_TRANSACOES_CHANGED, onTransacoesChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(MF_TRANSACOES_CHANGED, onTransacoesChanged);
    };
  }, [idsKey]);

  const mfProps = useMfDashboardBaseProps(transacoes, { loading: scopeLoading });
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
