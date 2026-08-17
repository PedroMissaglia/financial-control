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
}

function layoutSignature(props: DashboardLayoutSlice) {
  return JSON.stringify({
    widgets: props.widgets,
    layoutRows: props.layoutRows,
    layoutGroups: props.layoutGroups,
    metaEconomia: props.metaEconomia,
    alertaGastos: props.alertaGastos,
    extratoLimite: props.extratoLimite,
  });
}

export function useMfDashboardMount<TProps extends DashboardLayoutSlice>(exposeKey: string, mfProps: TProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mountFnRef = useRef<MfMountFn<TProps> | undefined>(undefined);
  const unmountRef = useRef<(() => void) | undefined>(undefined);
  const propsRef = useRef(mfProps);
  const [mode, setMode] = useState<'loading' | 'remote' | 'error'>('loading');
  const layoutKey = layoutSignature(mfProps);

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
            maybeUnmount?.();
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
      unmountRef.current?.();
      unmountRef.current = undefined;
    };
  }, [exposeKey]);

  useEffect(() => {
    if (mode !== 'remote') return;
    const host = hostRef.current;
    const mount = mountFnRef.current;
    if (!host || !mount) return;
    void Promise.resolve(mount(host, propsRef.current)).then(unmount => {
      unmountRef.current = unmount;
    });
  }, [layoutKey, mode]);

  return { hostRef, mode };
}
