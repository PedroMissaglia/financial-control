'use client';

import { LogOut, Menu, User, Wallet, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Início' },
  { href: '/transacoes', label: 'Transações' },
];

function UserAvatar({ nome }: { readonly nome?: string | null }) {
  const inicial = nome?.trim().charAt(0).toUpperCase();

  if (inicial) {
    return (
      <div
        className="bg-primary flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
        title={nome ?? undefined}
        aria-label={`Conectado como ${nome}`}
      >
        {inicial}
      </div>
    );
  }

  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-full border bg-gray-100 text-gray-500"
      title="Visitante"
      aria-label="Visitante não autenticado"
    >
      <User className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, isAuthenticated, logout } = useAuth();

  function handleLogout() {
    setIsMenuOpen(false);
    logout();
    router.replace('/login');
  }

  return (
    <header role="banner" className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="focus:ring-primary flex items-center gap-2 rounded-md focus:ring-2 focus:ring-offset-2 focus:outline-none"
            aria-label="Fin Control - Página inicial"
          >
            <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-lg" aria-hidden="true">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Fin Control</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated && (
              <nav className="hidden items-center gap-6 md:flex" aria-label="Navegação principal">
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'focus:ring-primary rounded-md px-2 py-1 font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none',
                      pathname === item.href ? 'text-primary' : 'hover:text-primary text-gray-700'
                    )}
                    aria-current={pathname === item.href ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link href="/transacoes/nova">
                  <Button size="sm">Nova transação</Button>
                </Link>
              </nav>
            )}

            <UserAvatar nome={usuario?.nome} />

            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden md:inline-flex"
                aria-label="Sair da conta"
              >
                <LogOut className="mr-1 h-4 w-4" />
                Sair
              </Button>
            )}

            {isAuthenticated && (
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-menu"
                  aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            )}
          </div>
        </div>

        {isAuthenticated && isMenuOpen && (
          <nav id="mobile-menu" className="border-t py-4 md:hidden" aria-label="Navegação mobile">
            <div className="flex flex-col gap-3">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2 py-1 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/transacoes/nova" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full">Nova transação</Button>
              </Link>
              <div className="mt-1 flex items-center justify-between border-t pt-3">
                <span className="text-sm font-medium text-gray-700">{usuario?.nome}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sair da conta">
                  <LogOut className="mr-1 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
