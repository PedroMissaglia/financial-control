import Link from 'next/link';

import { TransacoesMicrofrontend } from '@/components/transacoes-microfrontend';
import { Button } from '@/components/ui/button';

export default function TransacoesPage() {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="fc-page-title">Transações</h1>
          <p className="fc-card-subtitle mt-1">
            Visualize, edite ou exclua suas movimentações.
          </p>
        </div>
        <Link href="/transacoes/nova" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Nova transação</Button>
        </Link>
      </div>

      <TransacoesMicrofrontend />
    </div>
  );
}
