'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';

import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';

/** Mobile-only FAB for quick access to /transacoes/nova. Mount only on allowed pages. */
export function NovaTransacaoFab() {
  const isMobile = !useMediaQuery('(min-width: 640px)');

  if (!isMobile) return null;

  return (
    <Link
      href="/transacoes/nova"
      className={cn(
        'bg-primary text-primary-foreground fixed z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg',
        'hover:bg-primary/90 focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'right-4 bottom-[max(1rem,env(safe-area-inset-bottom))]',
      )}
      aria-label="Nova transação"
    >
      <Plus className="h-6 w-6" aria-hidden="true" />
    </Link>
  );
}
