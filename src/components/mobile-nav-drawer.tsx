'use client';

import { LogOut, Moon, Sun, User, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { VisaoSwitcher } from '@/components/visao-switcher';
import { lockBodyScroll } from '@/lib/lock-body-scroll';
import { OVERLAY_ENTER_MS, OVERLAY_EXIT_MS } from '@/lib/overlay-animation';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setThemeMode } from '@/store/slices/dashboard-slice';

const NAV_ITEMS = [
  { href: '/', label: 'Início' },
  { href: '/transacoes', label: 'Transações' },
  { href: '/categorias', label: 'Categorias' },
  { href: '/gastos-mensais', label: 'Gastos Mensais' },
] as const;

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
  usuarioNome?: string | null;
  showVisaoSwitcher: boolean;
  onLogout: () => void;
}

export function MobileNavDrawer({
  open,
  onClose,
  pathname,
  usuarioNome,
  showVisaoSwitcher,
  onLogout,
}: Readonly<MobileNavDrawerProps>) {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(state => state.dashboard.themeMode);
  const conviteRecebido = useAppSelector(state => state.contaConjunta.status === 'convite_recebido');
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const isDark = themeMode === 'dark';

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timeout = window.setTimeout(() => setMounted(false), OVERLAY_EXIT_MS || OVERLAY_ENTER_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const lock = lockBodyScroll();
    return () => lock.unlock();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mounted, onClose]);

  if (!mounted) return null;

  const motionMs = visible ? OVERLAY_ENTER_MS : OVERLAY_EXIT_MS || OVERLAY_ENTER_MS;

  return (
    <div role="presentation" className="relative z-[70]">
      <button
        type="button"
        className={cn(
          'fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm ease-out',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        style={{ transitionProperty: 'opacity', transitionDuration: `${motionMs}ms` }}
        aria-label="Fechar menu"
        onClick={onClose}
      />

      <nav
        id="mobile-nav-drawer"
        aria-label="Navegação principal"
        style={{
          transitionProperty: 'transform',
          transitionDuration: `${motionMs}ms`,
          transitionTimingFunction: 'ease-out',
        }}
        className={cn(
          'bg-card border-border fixed inset-y-0 left-0 z-[80] flex w-[min(85vw,18rem)] flex-col border-r shadow-2xl',
          'pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-[env(safe-area-inset-bottom,0px)]',
          visible ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-border flex items-center justify-between gap-3 border-b px-4 pb-3">
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-semibold">{usuarioNome ?? 'Menu'}</p>
            <p className="text-muted-foreground text-xs">Pennywise</p>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-2 transition-colors"
            aria-label="Fechar menu"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3">
          {showVisaoSwitcher && (
            <div className="mb-3 px-2">
              <VisaoSwitcher fullWidth />
            </div>
          )}

          <ul className="space-y-1">
            {NAV_ITEMS.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-accent/60',
                  )}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-border space-y-1 border-t px-2 pt-3 pb-3">
          <Link
            href="/profile"
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              pathname === '/profile'
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground hover:bg-accent/60',
            )}
            onClick={onClose}
          >
            <User className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">
              Meu perfil
              {conviteRecebido ? ' · convite' : ''}
            </span>
            {conviteRecebido && (
              <span className="bg-destructive h-2 w-2 shrink-0 rounded-full" aria-hidden="true" />
            )}
          </Link>

          <button
            type="button"
            className="text-foreground hover:bg-accent/60 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors"
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            onClick={() => dispatch(setThemeMode(isDark ? 'light' : 'dark'))}
          >
            {isDark ? <Sun className="h-4 w-4 shrink-0" aria-hidden="true" /> : <Moon className="h-4 w-4 shrink-0" aria-hidden="true" />}
            {isDark ? 'Modo claro' : 'Modo escuro'}
          </button>

          <button
            type="button"
            className="text-foreground hover:bg-accent/60 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors"
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            Sair
          </button>
        </div>
      </nav>
    </div>
  );
}
