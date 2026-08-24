import { useDispatch, useSelector } from 'react-redux';

import { loginThunk, logoutThunk } from '@/store/slices/auth-slice';
import { loadContaConjunta, resetContaConjunta } from '@/store/slices/conta-conjunta-slice';

import type { AppDispatch, RootState } from './index';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export function useAuth() {
  const dispatch = useAppDispatch();
  const usuario = useAppSelector(state => state.auth.usuario);
  const loading = useAppSelector(state => state.auth.loading);

  return {
    usuario,
    isAuthenticated: usuario !== null,
    loading,
    login: async (email: string, senha: string) => {
      try {
        await dispatch(loginThunk({ email, senha })).unwrap();
        void dispatch(loadContaConjunta());
        return { success: true as const };
      } catch (error) {
        return {
          success: false as const,
          message: error instanceof Error ? error.message : 'Não foi possível autenticar',
        };
      }
    },
    logout: () => {
      dispatch(resetContaConjunta());
      void dispatch(logoutThunk());
    },
  };
}
