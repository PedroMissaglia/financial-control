'use client';

import { LogOut, Moon, Sun, User } from 'lucide-react';
import Link from 'next/link';

import { SideDrawer } from '@/components/ui/side-drawer';
import { VisaoSwitcher } from '@/components/visao-switcher';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setThemeMode } from '@/store/slices/dashboard-slice';

export const APP_NAV_DRAWER_ID = 'app-nav-drawer';

export const APP_NAV_ITEMS = [
  { href: '/', label: 'Início' },
  { href: '/transacoes', label: 'Transações' },
  { href: '/categorias', label: 'Categorias' },
  { href: '/gastos-mensais', label: 'Gastos Mensais' },
] as const;

interface AppNavDrawerProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
  usuarioNome?: string | null;
  showVisaoSwitcher: boolean;
  onLogout: () => void;
}

function drawerItemClass(active: boolean) {
  return cn(
    'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    active ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/60',
  );
}

export function AppNavDrawer({
  open,
  onClose,
  pathname,
  usuarioNome,
  showVisaoSwitcher,
  onLogout,
}: Readonly<AppNavDrawerProps>) {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(state => state.dashboard.themeMode);
  const conviteRecebido = useAppSelector(state => state.contaConjunta.status === 'convite_recebido');
  const isDark = themeMode === 'dark';

  return (
    <SideDrawer
      id={APP_NAV_DRAWER_ID}
      open={open}
      onClose={onClose}
      title={usuarioNome ?? 'Menu'}
      description="Pennywise"
      footer={
        <>
          <Link href="/profile" className={drawerItemClass(pathname === '/profile')} onClick={onClose}>
            <span className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">
                Meu perfil
                {conviteRecebido ? ' · convite' : ''}
              </span>
              {conviteRecebido && (
                <span className="bg-destructive h-2 w-2 shrink-0 rounded-full" aria-hidden="true" />
              )}
            </span>
          </Link>

          <button
            type="button"
            className={cn(drawerItemClass(false), 'flex w-full items-center gap-2 text-left')}
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            onClick={() => dispatch(setThemeMode(isDark ? 'light' : 'dark'))}
          >
            {isDark ? <Sun className="h-4 w-4 shrink-0" aria-hidden="true" /> : <Moon className="h-4 w-4 shrink-0" aria-hidden="true" />}
            {isDark ? 'Modo claro' : 'Modo escuro'}
          </button>

          <button
            type="button"
            className={cn(drawerItemClass(false), 'flex w-full items-center gap-2 text-left')}
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            Sair
          </button>
        </>
      }
    >
      {showVisaoSwitcher && (
        <div className="mb-3 px-2">
          <VisaoSwitcher fullWidth />
        </div>
      )}

      <ul className="space-y-1">
        {APP_NAV_ITEMS.map(item => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={drawerItemClass(pathname === item.href)}
              aria-current={pathname === item.href ? 'page' : undefined}
              onClick={onClose}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </SideDrawer>
  );
}
