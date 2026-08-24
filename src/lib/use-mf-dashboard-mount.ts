'use client';

import { useEffect, useRef, useState } from 'react';

import { loadDashboardExpose, type MfMountFn } from '@/lib/load-mf-remote';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface DashboardLayoutSlice {
  widgets: unknown;
  layoutRows: unknown;
  layoutGroups: unknown;
  metaEconomia: unknown;
  alertaGastos: unknown;
  extratoLimite: unknown;
  blocoNotas?: unknown;
  notasPorUsuario?: unknown;
  apiUrl?: unknown;
  transacoes?: unknown;
  categoriaLabels?: unknown;
  usuarioIds?: unknown;
  donoLabels?: unknown;
  loading?: unknown;
}

function propsSignature(props: DashboardLayoutSlice) {
  const transacoes = Array.isArray(props.transacoes) ? props.transacoes : [];
  const categoriaLabels =
    props.categoriaLabels && typeof props.categoriaLabels === 'object'
      ? props.categoriaLabels
      : {};
  const usuarioIds = Array.isArray(props.usuarioIds) ? props.usuarioIds : [];
  const donoLabels =
    props.donoLabels && typeof props.donoLabels === 'object' ? props.donoLabels : {};
  const blocoNotas = typeof props.blocoNotas === 'string' ? props.blocoNotas : '';
  const notasPorUsuario = Array.isArray(props.notasPorUsuario) ? props.notasPorUsuario : [];
  return JSON.stringify({
    widgets: props.widgets,
    layoutRows: props.layoutRows,
    layoutGroups: props.layoutGroups,
    metaEconomia: props.metaEconomia,
    alertaGastos: props.alertaGastos,
    extratoLimite: props.extratoLimite,
    blocoNotas,
    notas: notasPorUsuario.map(
      (item: { usuarioId?: string; html?: string }) => `${item.usuarioId}:${item.html ?? ''}`,
    ),
    apiUrl: props.apiUrl,
    loading: Boolean(props.loading),
    ids: usuarioIds.join(','),
    donos: Object.entries(donoLabels as Record<string, string>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, nome]) => `${id}:${nome}`)
      .join('|'),
    tx: transacoes.map((item: { id?: string; valor?: number }) => `${item.id}:${item.valor}`).join('|'),
    cats: Object.entries(categoriaLabels as Record<string, string>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, nome]) => `${id}:${nome}`)
      .join('|'),
  });
}

export function useMfDashboardMount<TProps extends DashboardLayoutSlice>(exposeKey: string, mfProps: TProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mountFnRef = useRef<MfMountFn<TProps> | undefined>(undefined);
  const unmountRef = useRef<(() => void) | undefined>(undefined);
  const propsRef = useRef(mfProps);
  const [mode, setMode] = useState<'loading' | 'remote' | 'error'>('loading');
  const propsKey = propsSignature(mfProps);

  propsRef.current = mfProps;

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;

    let cancelled = false;

    async function mountRemote() {
      const maxRounds = 5;

      for (let round = 0; round < maxRounds; round += 1) {
        if (cancelled) return;

        try {
          const remote = await loadDashboardExpose<TProps>(exposeKey);
          if (cancelled) return;
          if (!remote) throw new Error(`O módulo ${exposeKey} não exportou mount()`);

          const host = hostRef.current;
          if (!host) throw new Error('O container do microfrontend ainda não está no DOM');

          mountFnRef.current = remote.mount;
          const maybeUnmount = await remote.mount(host, propsRef.current);
          if (cancelled) {
            // Defer — same React singleton as host; sync unmount during cleanup races.
            queueMicrotask(() => maybeUnmount?.());
            return;
          }
          unmountRef.current = maybeUnmount;
          setMode('remote');
          return;
        } catch (error) {
          if (cancelled) return;
          if (round === maxRounds - 1) {
            console.warn('Microfrontend do dashboard indisponível.', error);
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
      const dispose = unmountRef.current;
      unmountRef.current = undefined;
      mountFnRef.current = undefined;
      // Defer so we don't unmount a shared-React root mid host commit.
      queueMicrotask(() => dispose?.());
    };
  }, [exposeKey]);

  // Prop updates: re-render into the same root. Do not replace/call unmount disposer.
  useEffect(() => {
    if (mode !== 'remote') return;
    const host = hostRef.current;
    const mount = mountFnRef.current;
    if (!host || !mount) return;
    void Promise.resolve(mount(host, propsRef.current));
  }, [propsKey, mode]);

  return { hostRef, mode };
}
