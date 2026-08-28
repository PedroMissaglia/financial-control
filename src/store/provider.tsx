'use client';

import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import { ensureValidAccessToken } from '@/lib/api-client';
import { clearPersistedUsuario, getRefreshToken, persistUsuario, readStoredUsuario } from '@/lib/auth-session';
import { store } from '@/store';
import { useAppDispatch } from '@/store/hooks';
import { hydrateFromStorage } from '@/store/slices/auth-slice';
import { hydrateVisao, loadContaConjunta } from '@/store/slices/conta-conjunta-slice';
import { loadDashboardProfile } from '@/store/slices/dashboard-slice';

function StoreHydration({ children }: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const usuario = readStoredUsuario();
      if (usuario) {
        persistUsuario(usuario);
      } else {
        clearPersistedUsuario();
      }

      if (usuario && getRefreshToken()) {
        await ensureValidAccessToken();
      }

      if (cancelled) return;

      dispatch(hydrateFromStorage());
      dispatch(hydrateVisao());
      if (usuario?.id) {
        await Promise.all([
          dispatch(loadDashboardProfile(usuario.id)),
          dispatch(loadContaConjunta()),
        ]);
      }

      if (cancelled) return;

      setReady(true);
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  if (!ready) return null;

  return <>{children}</>;
}

export function StoreProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Provider store={store}>
      <StoreHydration>{children}</StoreHydration>
    </Provider>
  );
}
