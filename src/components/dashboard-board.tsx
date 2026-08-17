'use client';

import { DashboardViewMicrofrontend } from '@/components/dashboard-view-microfrontend';
import type { Transacao } from '@/data/transacoes';

interface DashboardBoardProps {
  transacoes: Transacao[];
}

export function DashboardBoard({ transacoes }: Readonly<DashboardBoardProps>) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-full space-y-4 sm:space-y-6">
      <div className="mx-auto w-full min-w-0 space-y-3 text-center sm:text-left">
        <h1 className="fc-page-title min-w-0 text-balance">Bem-vindo ao Fin Control</h1>
        <p className="fc-card-subtitle mx-auto max-w-2xl sm:mx-0 sm:text-base">
          Gerencie suas finanças pessoais com clareza. Acompanhe gráficos, saldo e registre novas transações.
        </p>
      </div>

      <DashboardViewMicrofrontend transacoes={transacoes} />
    </div>
  );
}
