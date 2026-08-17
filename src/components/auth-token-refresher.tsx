'use client';

import { useEffect } from 'react';

import { refreshSession } from '@/lib/api-client';
import { getExpiresAt, getRefreshToken } from '@/lib/auth-session';
import { useAuth } from '@/store/hooks';

const REFRESH_MARGIN_MS = 30_000;

function delayUntilRefresh() {
  const expiresAt = getExpiresAt();
  if (!expiresAt || !getRefreshToken()) return null;
  return Math.max(5_000, expiresAt - Date.now() - REFRESH_MARGIN_MS);
}

export function AuthTokenRefresher() {
  const { usuario } = useAuth();

  useEffect(() => {
    if (!usuario) return;

    let timer = 0;

    function schedule() {
      window.clearTimeout(timer);
      const delay = delayUntilRefresh();
      if (delay == null) return;
      timer = window.setTimeout(() => {
        void refreshSession().then(() => schedule());
      }, delay);
    }

    function onVisibility() {
      if (document.visibilityState !== 'visible') return;
      const expiresAt = getExpiresAt();
      if (expiresAt && expiresAt - Date.now() <= 60_000) {
        void refreshSession().then(() => schedule());
        return;
      }
      schedule();
    }

    schedule();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [usuario]);

  return null;
}
