'use client';

import { DashboardViewMicrofrontend } from '@/components/dashboard-view-microfrontend';
import type { Transacao } from '@/data/transacoes';
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';

interface DashboardBoardProps {
  transacoes: Transacao[];
}

export function DashboardBoard({ transacoes }: Readonly<DashboardBoardProps>) {
  const isMobile = !useMediaQuery('(min-width: 640px)');

  return (
    <div className={cn('mx-auto w-full min-w-0 max-w-full space-y-4 sm:space-y-6', isMobile && 'pb-20')}>
      <div className="mx-auto w-full min-w-0 space-y-3 text-center sm:text-left">
        <h1 className="fc-page-title min-w-0 text-balance">Bem-vindo ao Pennywise</h1>
        <p className="fc-card-subtitle mx-auto max-w-2xl sm:mx-0 sm:text-base">
          Gerencie suas finanças pessoais com clareza. Acompanhe gráficos, saldo e registre novas transações.
        </p>
      </div>

      <DashboardViewMicrofrontend transacoes={transacoes} />
    </div>
  );
}
