'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchGastosMensais } from '@/app/services/gastos-mensais';
import type { GastoMensal } from '@/data/gastos-mensais';

export function useGastosMensais(usuarioId: string | undefined, competencia: string) {
  const [gastos, setGastos] = useState<GastoMensal[]>([]);
  const [loading, setLoading] = useState(Boolean(usuarioId));
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    if (!usuarioId) {
      setGastos([]);
      setLoading(false);
      return;
    }
    const result = await fetchGastosMensais(usuarioId, competencia);
    if (id !== requestId.current) return;
    setGastos(result.data ?? []);
    setLoading(false);
  }, [usuarioId, competencia]);

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
