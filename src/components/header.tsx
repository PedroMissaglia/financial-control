'use client';

import { Menu, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ThemeModeToggle } from '@/components/theme-mode-toggle';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/user-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/hooks';

const navItems = [
  { href: '/', label: 'Início' },
  { href: '/transacoes', label: 'Transações' },
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
    <div ref={rootRef} className="relative md:hidden">
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
  const router = useRouter();
  const { usuario, isAuthenticated, logout } = useAuth();

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <header
      role="banner"
      className="bg-card border-border fixed inset-x-0 top-0 z-50 border-b shadow-sm pt-[env(safe-area-inset-top)]"
    >
      <div className="mx-auto max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between sm:h-16">
          <Link
            href="/"
            className="focus:ring-primary flex min-w-0 items-center gap-2 rounded-md focus:ring-2 focus:ring-offset-2 focus:outline-none"
            aria-label="Fin Control - Página inicial"
          >
            <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9" aria-hidden="true">
              <Wallet className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            </div>
            <span className="text-foreground truncate text-base font-bold sm:text-xl">Fin Control</span>
          </Link>

          {isAuthenticated && (
            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
              <nav className="hidden items-center gap-6 md:flex" aria-label="Navegação principal">
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

              <NavMenu pathname={pathname} />
              <UserMenu nome={usuario?.nome} onLogout={handleLogout} />
              <ThemeModeToggle />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
