'use client';

import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';

interface UserMenuProps {
  nome?: string | null;
  onLogout: () => void;
}

export function UserMenu({ nome, onLogout }: Readonly<UserMenuProps>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inicial = nome?.trim().charAt(0).toUpperCase();
  const conviteRecebido = useAppSelector(state => state.contaConjunta.status === 'convite_recebido');

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

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={nome ? `Menu de ${nome}` : 'Menu do usuário'}
        className="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        onClick={() => setOpen(current => !current)}
      >
        {inicial ? (
          <div
            className="bg-primary text-primary-foreground relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
            title={nome ?? undefined}
          >
            {inicial}
            {conviteRecebido && (
              <span className="bg-destructive absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card" aria-hidden="true" />
            )}
          </div>
        ) : (
          <div
            className="border-border bg-muted text-muted-foreground flex h-9 w-9 items-center justify-center rounded-full border"
            title="Visitante"
          >
            <User className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menu do usuário"
          className="border-border bg-popover text-popover-foreground absolute right-0 z-[60] mt-2 w-52 overflow-hidden rounded-md border py-1 shadow-md"
        >
          {nome && (
            <p className="text-muted-foreground border-border truncate border-b px-3 py-2 text-xs" role="presentation">
              {nome}
            </p>
          )}
          <Link
            href="/profile"
            role="menuitem"
            className={cn(
              'hover:bg-accent hover:text-accent-foreground block px-3 py-2 text-sm transition-colors',
              pathname === '/profile' && 'bg-accent text-accent-foreground font-medium',
            )}
            onClick={closeMenu}
          >
            Meu perfil
            {conviteRecebido ? ' · convite' : ''}
          </Link>
          <button
            type="button"
            role="menuitem"
            className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
            onClick={() => {
              closeMenu();
              onLogout();
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
