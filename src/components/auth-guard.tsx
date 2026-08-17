'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { irParaDestinoPosLogin } from '@/lib/auth-redirect';
import { useAuth } from '@/store/hooks';

const ROTAS_PUBLICAS = new Set(['/login']);

function StatusCarregando() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <p className="text-muted-foreground text-sm">Carregando...</p>
    </div>
  );
}

export function AuthGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isRotaPublica = ROTAS_PUBLICAS.has(pathname);
  const autenticadoEmLogin = isAuthenticated && pathname === '/login';

  useEffect(() => {
    if (!loading && !isAuthenticated && !isRotaPublica) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, isRotaPublica, router]);

  useEffect(() => {
    if (!loading && autenticadoEmLogin) {
      irParaDestinoPosLogin();
    }
  }, [loading, autenticadoEmLogin]);

  if (loading || autenticadoEmLogin) {
    return <StatusCarregando />;
  }

  if (isRotaPublica) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
