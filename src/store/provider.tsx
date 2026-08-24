'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';

import { clearPersistedUsuario, persistUsuario, readStoredUsuario } from '@/lib/auth-session';
import { store } from '@/store';
import { useAppDispatch } from '@/store/hooks';
import { hydrateFromStorage } from '@/store/slices/auth-slice';
import { hydrateVisao, loadContaConjunta } from '@/store/slices/conta-conjunta-slice';
import { loadDashboardProfile } from '@/store/slices/dashboard-slice';

function StoreHydration({ children }: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const usuario = readStoredUsuario();
    if (usuario) {
      persistUsuario(usuario);
    } else {
      clearPersistedUsuario();
    }
    dispatch(hydrateFromStorage());
    dispatch(hydrateVisao());
    if (usuario?.id) {
      void dispatch(loadDashboardProfile(usuario.id));
      void dispatch(loadContaConjunta());
    }
  }, [dispatch]);

  return <>{children}</>;
}

export function StoreProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Provider store={store}>
      <StoreHydration>{children}</StoreHydration>
    </Provider>
  );
}
