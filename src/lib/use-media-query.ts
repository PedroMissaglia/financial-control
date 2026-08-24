'use client';

import { useSyncExternalStore } from 'react';

function subscribe(query: string, onStoreChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function getSnapshot(query: string) {
  return window.matchMedia(query).matches;
}

function getServerSnapshot() {
  return false;
}

/** SSR-safe matchMedia hook. Server snapshot is always false (mobile-first). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    onChange => subscribe(query, onChange),
    () => getSnapshot(query),
    getServerSnapshot,
  );
}
