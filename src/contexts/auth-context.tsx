'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { autenticar } from '@/app/services/usuarios';
import type { UsuarioPublico } from '@/data/usuarios';

const STORAGE_KEY = 'fincontrol:auth';

interface LoginResult {
  success: boolean;
  message?: string;
}

interface AuthContextValue {
  usuario: UsuarioPublico | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, senha: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const armazenado = localStorage.getItem(STORAGE_KEY);
      if (armazenado) {
        setUsuario(JSON.parse(armazenado) as UsuarioPublico);
      }
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, senha: string): Promise<LoginResult> => {
    const result = await autenticar(email, senha);

    if (!result.success || !result.data) {
      return { success: false, message: result.message ?? 'Não foi possível autenticar' };
    }

    setUsuario(result.data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      isAuthenticated: usuario !== null,
      loading,
      login,
      logout,
    }),
    [usuario, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
