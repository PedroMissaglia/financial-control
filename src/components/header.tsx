'use client';

import { Menu, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { BrandMark } from '@/components/brand-mark';
import { MobileNavDrawer } from '@/components/mobile-nav-drawer';
import { ThemeModeToggle } from '@/components/theme-mode-toggle';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/user-menu';
import { VisaoSwitcher } from '@/components/visao-switcher';
import { useEscopoFinanceiro } from '@/lib/use-escopo-financeiro';
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/hooks';

const navItems = [
  { href: '/', label: 'Início' },
  { href: '/transacoes', label: 'Transações' },
  { href: '/categorias', label: 'Categorias' },
  { href: '/gastos-mensais', label: 'Gastos Mensais' },
];

function NavLinks({
  pathname,
  className,
}: Readonly<{ pathname: string; className?: string }>) {
  return (
    <nav className={cn('flex min-w-0 items-center', className)} aria-label="Navegação principal">
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'focus:ring-primary shrink-0 rounded-md px-2 py-1 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none',
            pathname === item.href ? 'text-primary' : 'text-foreground hover:text-primary',
          )}
          aria-current={pathname === item.href ? 'page' : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function NovaTransacaoButton() {
  return (
    <Link href="/transacoes/nova" className="shrink-0">
      <Button size="sm">Nova transação</Button>
    </Link>
  );
}

function MobileHeaderActions({
  pathname,
  onLogout,
  usuarioNome,
  showVisaoSwitcher,
}: Readonly<{
  pathname: string;
  onLogout: () => void;
  usuarioNome?: string | null;
  showVisaoSwitcher: boolean;
}>) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hideNova = pathname.startsWith('/transacoes/nova');

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="grid w-full grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-expanded={drawerOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={drawerOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setDrawerOpen(current => !current)}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>

        <Link
          href="/"
          className="focus:ring-primary flex min-w-0 items-center justify-center gap-2 rounded-md focus:ring-2 focus:ring-offset-2 focus:outline-none"
          aria-label="Pennywise - Página inicial"
        >
          <BrandMark />
          <span className="text-foreground truncate text-base font-bold">Pennywise</span>
        </Link>

        {hideNova ? (
          <span className="h-10 w-10 shrink-0" aria-hidden="true" />
        ) : (
          <Link href="/transacoes/nova" className="shrink-0 justify-self-end">
            <Button type="button" variant="ghost" size="icon" aria-label="Nova transação">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
        )}
      </div>

      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pathname={pathname}
        usuarioNome={usuarioNome}
        showVisaoSwitcher={showVisaoSwitcher}
        onLogout={onLogout}
      />
    </>
  );
}

export function Header() {
  const pathname = usePathname();
  const { usuario, isAuthenticated, logout } = useAuth();
  const { ativa } = useEscopoFinanceiro();
  const isTabletUp = useMediaQuery('(min-width: 768px)');
  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const isMobile = !isTabletUp;
  const headerRef = useRef<HTMLElement>(null);
  const showTabletNav = isAuthenticated && isTabletUp && !isDesktop;
  const showVisaoRow = isAuthenticated && ativa && isTabletUp && !isDesktop;

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    function syncOffset() {
      if (!headerRef.current) return;
      const height = headerRef.current.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--header-bar-height', `${height}px`);
      document.documentElement.style.setProperty('--header-visao-row', '0px');
    }

    syncOffset();
    const observer = new ResizeObserver(syncOffset);
    observer.observe(header);
    window.addEventListener('resize', syncOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncOffset);
      document.documentElement.style.removeProperty('--header-bar-height');
      document.documentElement.style.removeProperty('--header-visao-row');
    };
  }, [showTabletNav, showVisaoRow, isAuthenticated, ativa]);

  function handleLogout() {
    logout();
    window.location.replace('/login');
  }

  return (
    <header
      ref={headerRef}
      role="banner"
      className="bg-card border-border fixed inset-x-0 top-[env(safe-area-inset-top,0px)] z-50 border-b shadow-sm"
    >
      <div className="mx-auto max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-2 sm:h-16">
          {isAuthenticated && isMobile ? (
            <MobileHeaderActions
              pathname={pathname}
              onLogout={handleLogout}
              usuarioNome={usuario?.nome}
              showVisaoSwitcher={ativa}
            />
          ) : (
            <>
              <Link
                href="/"
                className="focus:ring-primary flex min-w-0 items-center gap-2 rounded-md focus:ring-2 focus:ring-offset-2 focus:outline-none"
                aria-label="Pennywise - Página inicial"
              >
                <BrandMark />
                <span className="text-foreground truncate text-base font-bold sm:text-xl">Pennywise</span>
              </Link>

              {isAuthenticated && (
                <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 xl:gap-4">
                  {isDesktop ? (
                    <>
                      <NavLinks pathname={pathname} className="gap-4 xl:gap-6" />
                      <NovaTransacaoButton />
                      <VisaoSwitcher />
                    </>
                  ) : (
                    <NovaTransacaoButton />
                  )}

                  <UserMenu nome={usuario?.nome} onLogout={handleLogout} />
                  <ThemeModeToggle />
                </div>
              )}
            </>
          )}
        </div>

        {showVisaoRow && (
          <div className="border-border flex items-center gap-3 border-t pt-2 pb-2.5">
            <NavLinks pathname={pathname} className="min-w-0 flex-1 gap-3 overflow-x-auto" />
            <VisaoSwitcher className="shrink-0" />
          </div>
        )}
      </div>
    </header>
  );
}
