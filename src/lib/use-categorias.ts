'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fetchCategorias } from '@/app/services/categorias';
import { type Categoria, categoriasToLabels } from '@/data/categorias';
import { normalizeUsuarioIds } from '@/lib/usuario-ids';

export function useCategorias(usuarioId?: string | string[]) {
  const idsKey = normalizeUsuarioIds(usuarioId).join(',');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(Boolean(idsKey));
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) {
      setCategorias([]);
      setLoading(false);
      return;
    }
    const result = await fetchCategorias(ids);
    if (id !== requestId.current) return;
    setCategorias(result.data ?? []);
    setLoading(false);
  }, [idsKey]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      await reload();
    }

    void load();

    function onCategoriasChanged() {
      void reload();
    }
    window.addEventListener('fincontrol:categorias-changed', onCategoriasChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('fincontrol:categorias-changed', onCategoriasChanged);
    };
  }, [reload]);

  const labels = useMemo(() => categoriasToLabels(categorias), [categorias]);

  return { categorias, labels, loading, reload };
}
