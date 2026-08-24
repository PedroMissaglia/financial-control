'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fetchCategorias } from '@/app/services/categorias';
import { type Categoria, categoriasToLabels } from '@/data/categorias';

export function useCategorias(usuarioId?: string) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(Boolean(usuarioId));
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    if (!usuarioId) {
      setCategorias([]);
      setLoading(false);
      return;
    }
    const result = await fetchCategorias(usuarioId);
    if (id !== requestId.current) return;
    setCategorias(result.data ?? []);
    setLoading(false);
  }, [usuarioId]);

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
