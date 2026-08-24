'use client';

import { useEffect, useRef, useState } from 'react';

import { fetchProfile, saveProfile } from '@/app/services/profiles';
import { TransacoesFilters } from '@/components/transacoes-filters';
import { normalizeTransacoesPageSize } from '@/data/dashboard-profile';
import { readStoredSession } from '@/lib/auth-session';
import { loadMfExpose, MF_TRANSACOES_URL, type TransacoesMfMountProps } from '@/lib/load-mf-remote';
import {
  getUsuarioIdFromCookie,
  MF_TRANSACOES_PAGE_META,
  MF_TRANSACOES_PAGE_SIZE,
  type MfTransacoesPageMetaDetail,
  type MfTransacoesPageSizeDetail,
} from '@/lib/mf-events';
import { type TransacoesFiltros } from '@/lib/transacao-filters';
import { useCategorias } from '@/lib/use-categorias';
import { useEscopoFinanceiro } from '@/lib/use-escopo-financeiro';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { syncTransacoesFiltros, syncTransacoesPageSize } from '@/store/slices/dashboard-slice';

type MfListElement = HTMLElement & TransacoesMfMountProps;

const FILTROS_SAVE_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function TransacoesMicrofrontend() {
  const dispatch = useAppDispatch();
  const hostRef = useRef<HTMLDivElement>(null);
  const mfNodeRef = useRef<MfListElement | null>(null);
  const unmountRef = useRef<(() => void) | undefined>(undefined);
  const filtrosSaveTimerRef = useRef<number | null>(null);
  const [mode, setMode] = useState<'loading' | 'remote' | 'error'>('loading');
  const filtros = useAppSelector(state => state.dashboard.transacoesFiltros);
  const pageSize = useAppSelector(state => state.dashboard.transacoesPageSize);
  const { usuarioIds, donoLabels } = useEscopoFinanceiro();
  const { labels: categoriaLabels } = useCategorias(usuarioIds);
  const [total, setTotal] = useState(0);
  const [totalUnfiltered, setTotalUnfiltered] = useState(0);
  const usuarioIdsKey = usuarioIds.join(',');
  const scopeIds = usuarioIdsKey ? usuarioIdsKey.split(',') : [];
  const primaryUsuarioId = scopeIds[0] || getUsuarioIdFromCookie();

  useEffect(() => {
    const usuarioId = getUsuarioIdFromCookie();
    if (!usuarioId) return;

    void fetchProfile(usuarioId).then(profile => {
      dispatch(syncTransacoesPageSize(profile.transacoesPageSize));
      dispatch(syncTransacoesFiltros(profile.transacoesFiltros));
    });
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (filtrosSaveTimerRef.current != null) {
        window.clearTimeout(filtrosSaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onPageSize = (event: Event) => {
      const next = normalizeTransacoesPageSize(
        (event as CustomEvent<MfTransacoesPageSizeDetail>).detail?.pageSize,
      );
      const usuarioId = getUsuarioIdFromCookie();
      if (!usuarioId) return;

      dispatch(syncTransacoesPageSize(next));
      void fetchProfile(usuarioId).then(profile => {
        void saveProfile({ ...profile, transacoesPageSize: next });
      });
    };

    window.addEventListener(MF_TRANSACOES_PAGE_SIZE, onPageSize);
    return () => {
      window.removeEventListener(MF_TRANSACOES_PAGE_SIZE, onPageSize);
    };
  }, [dispatch]);

  useEffect(() => {
    function onMeta(event: Event) {
      const detail = (event as CustomEvent<MfTransacoesPageMetaDetail>).detail;
      if (!detail) return;
      setTotal(detail.total);
      setTotalUnfiltered(detail.totalUnfiltered);
    }

    window.addEventListener(MF_TRANSACOES_PAGE_META, onMeta);
    return () => window.removeEventListener(MF_TRANSACOES_PAGE_META, onMeta);
  }, []);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;

    let cancelled = false;

    async function mountRemote() {
      const maxRounds = 5;

      for (let round = 0; round < maxRounds; round += 1) {
        if (cancelled) return;

        try {
          const remote = await loadMfExpose('./Transacoes');
          if (cancelled) return;
          if (!remote) throw new Error('O módulo ./Transacoes não exportou mount()');

          const host = hostRef.current;
          if (!host) throw new Error('O container do microfrontend ainda não está no DOM');

          const maybeUnmount = await remote.mount(host, {
            apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001',
            usuarioId: primaryUsuarioId,
            usuarioIds: scopeIds,
            accessToken: readStoredSession()?.accessToken ?? undefined,
            filtros,
            pageSize,
            categoriaLabels,
            donoLabels,
          });
          if (cancelled) {
            maybeUnmount?.();
            return;
          }
          unmountRef.current = maybeUnmount;
          mfNodeRef.current = host.querySelector('mf-transacoes-list') as MfListElement | null;
          setMode('remote');
          return;
        } catch (error) {
          if (cancelled) return;
          if (round === maxRounds - 1) {
            console.warn('Microfrontend Angular indisponível.', error);
            setMode('error');
            return;
          }
          await sleep(2000);
        }
      }
    }

    void mountRemote();

    return () => {
      cancelled = true;
      mfNodeRef.current = null;
      unmountRef.current?.();
      unmountRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'remote' || !mfNodeRef.current) return;
    mfNodeRef.current.filtros = { ...filtros };
  }, [filtros, mode]);

  useEffect(() => {
    if (mode !== 'remote' || !mfNodeRef.current) return;
    mfNodeRef.current.pageSize = pageSize;
  }, [pageSize, mode]);

  useEffect(() => {
    if (mode !== 'remote' || !mfNodeRef.current) return;
    mfNodeRef.current.categoriaLabels = categoriaLabels;
  }, [categoriaLabels, mode]);

  useEffect(() => {
    if (mode !== 'remote' || !mfNodeRef.current) return;
    mfNodeRef.current.usuarioId = primaryUsuarioId ?? '';
    mfNodeRef.current.usuarioIds = scopeIds;
    mfNodeRef.current.donoLabels = donoLabels;
  }, [donoLabels, mode, primaryUsuarioId, scopeIds, usuarioIdsKey]);

  function handleFiltrosChange(next: TransacoesFiltros) {
    dispatch(syncTransacoesFiltros(next));

    const usuarioId = getUsuarioIdFromCookie();
    if (!usuarioId) return;

    if (filtrosSaveTimerRef.current != null) {
      window.clearTimeout(filtrosSaveTimerRef.current);
    }

    filtrosSaveTimerRef.current = window.setTimeout(() => {
      void fetchProfile(usuarioId).then(profile => {
        void saveProfile({ ...profile, transacoesFiltros: next });
      });
    }, FILTROS_SAVE_DELAY_MS);
  }

  return (
    <div>
      <TransacoesFilters
        filtros={filtros}
        total={totalUnfiltered}
        visiveis={total}
        onChange={handleFiltrosChange}
      />

      <p className="fc-caption mb-3 font-semibold">Listagem</p>

      {mode === 'loading' && (
        <p className="text-muted-foreground mb-4 text-sm" role="status">
          Carregando listagem de transações...
        </p>
      )}
      {mode === 'error' && (
        <p className="text-muted-foreground mb-4 text-sm" role="alert">
          O microfrontend de transações não respondeu em {MF_TRANSACOES_URL}. Verifique se o serviço mf-transacoes está
          em execução.
        </p>
      )}
      <div ref={hostRef} hidden={mode !== 'remote'} />
    </div>
  );
}
