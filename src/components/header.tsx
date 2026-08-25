'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { BrandMark } from '@/components/brand-mark';
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

const mobileNavItems = [...navItems, { href: '/transacoes/nova', label: 'Nova transação' }];

function NavMenu({ pathname }: Readonly<{ pathname: string }>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="nav-menu"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setOpen(current => !current)}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      {open && (
        <div
          id="nav-menu"
          role="menu"
          aria-label="Navegação principal"
          className="border-border bg-popover text-popover-foreground absolute right-0 z-[60] mt-2 w-52 overflow-hidden rounded-md border py-1 shadow-md"
        >
          {mobileNavItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className={cn(
                'hover:bg-accent hover:text-accent-foreground block px-3 py-2 text-sm transition-colors',
                pathname === item.href && 'bg-accent text-accent-foreground font-medium',
              )}
              aria-current={pathname === item.href ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { usuario, isAuthenticated, logout } = useAuth();
  const { ativa } = useEscopoFinanceiro();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const headerRef = useRef<HTMLElement>(null);
  const showMobileVisao = isAuthenticated && ativa && !isDesktop;

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
  }, [showMobileVisao, isAuthenticated, ativa]);

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
          <Link
            href="/"
            className="focus:ring-primary flex min-w-0 items-center gap-2 rounded-md focus:ring-2 focus:ring-offset-2 focus:outline-none"
            aria-label="Pennywise - Página inicial"
          >
            <BrandMark />
            <span className="text-foreground truncate text-base font-bold sm:text-xl">Pennywise</span>
          </Link>

          {isAuthenticated && (
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 md:gap-4">
              {isDesktop ? (
                <nav className="flex items-center gap-6" aria-label="Navegação principal">
                  {navItems.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'focus:ring-primary shrink-0 rounded-md px-2 py-1 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none sm:text-base',
                        pathname === item.href ? 'text-primary' : 'text-foreground hover:text-primary',
                      )}
                      aria-current={pathname === item.href ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link href="/transacoes/nova" className="shrink-0">
                    <Button size="sm">Nova transação</Button>
                  </Link>
                </nav>
              ) : (
                <NavMenu pathname={pathname} />
              )}

              {isDesktop && <VisaoSwitcher />}
              <UserMenu nome={usuario?.nome} onLogout={handleLogout} />
              <ThemeModeToggle />
            </div>
          )}
        </div>

        {showMobileVisao && (
          <div className="border-border flex items-center border-t pt-2 pb-2.5">
            <VisaoSwitcher fullWidth />
          </div>
        )}
      </div>
    </header>
  );
}
