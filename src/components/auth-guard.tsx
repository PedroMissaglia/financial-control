'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/store/hooks';

const ROTAS_PUBLICAS = new Set(['/login']);

export function AuthGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isRotaPublica = ROTAS_PUBLICAS.has(pathname);

  useEffect(() => {
    if (!loading && !isAuthenticated && !isRotaPublica) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, isRotaPublica, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  if (isRotaPublica) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
