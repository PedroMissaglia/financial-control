'use client';

import { useEffect, useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setBlocoNotas } from '@/store/slices/dashboard-slice';

import {
  MF_BLOCO_NOTAS_CHANGED,
  type BlocoNotasChangedDetail,
} from '../../shared/dashboard-contract';

const DEBOUNCE_MS = 500;

/** Persiste só o bloco de notas do usuário logado (debounce). */
export function useBlocoNotasPersistence() {
  const dispatch = useAppDispatch();
  const selfId = useAppSelector(state => state.auth.usuario?.id);
  const selfIdRef = useRef(selfId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHtmlRef = useRef<string | null>(null);

  selfIdRef.current = selfId;

  useEffect(() => {
    const flush = () => {
      if (pendingHtmlRef.current === null) return;
      dispatch(setBlocoNotas(pendingHtmlRef.current));
      pendingHtmlRef.current = null;
    };

    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<BlocoNotasChangedDetail>).detail;
      if (typeof detail?.html !== 'string' || typeof detail?.usuarioId !== 'string') return;
      if (detail.usuarioId !== selfIdRef.current) return;
      pendingHtmlRef.current = detail.html;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        flush();
        timerRef.current = null;
      }, DEBOUNCE_MS);
    };

    window.addEventListener(MF_BLOCO_NOTAS_CHANGED, onChanged);
    return () => {
      window.removeEventListener(MF_BLOCO_NOTAS_CHANGED, onChanged);
      if (timerRef.current) clearTimeout(timerRef.current);
      flush();
    };
  }, [dispatch]);
}
