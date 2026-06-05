import { cookies } from 'next/headers';
import Link from 'next/link';

import { getTransacoesOrThrow } from '@/app/services/transacoes';
import { TransacaoTable } from '@/components/transacao-table';
import { Button } from '@/components/ui/button';
import { ordenarPorDataDesc } from '@/data/transacoes';

export default async function TransacoesPage() {
  const usuarioId = (await cookies()).get('fincontrol_uid')?.value;
  const transacoes = await getTransacoesOrThrow(usuarioId);
  const ordenadas = ordenarPorDataDesc(transacoes);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transações</h1>
          <p className="text-muted-foreground mt-1">Visualize, edite ou exclua suas movimentações</p>
        </div>
        <Link href="/transacoes/nova">
          <Button>Nova transação</Button>
        </Link>
      </div>

      <TransacaoTable transacoes={ordenadas} />
    </div>
  );
}
