'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchGastosMensais } from '@/app/services/gastos-mensais';
import type { GastoMensal } from '@/data/gastos-mensais';
import { normalizeUsuarioIds } from '@/lib/usuario-ids';

export function useGastosMensais(usuarioId: string | string[] | undefined, competencia: string) {
  const idsKey = normalizeUsuarioIds(usuarioId).join(',');
  const [gastos, setGastos] = useState<GastoMensal[]>([]);
  const [loading, setLoading] = useState(Boolean(idsKey));
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) {
      setGastos([]);
      setLoading(false);
      return;
    }
    const result = await fetchGastosMensais(ids, competencia);
    if (id !== requestId.current) return;
    setGastos(result.data ?? []);
    setLoading(false);
  }, [idsKey, competencia]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      await reload();
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  return { gastos, loading, reload };
}
