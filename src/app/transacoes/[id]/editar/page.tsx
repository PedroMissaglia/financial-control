import { notFound } from 'next/navigation';

import { getTransacaoOrThrow } from '@/app/services/transacoes';
import { TransacaoForm } from '@/components/transacao-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EditarTransacaoPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarTransacaoPage({ params }: EditarTransacaoPageProps) {
  const { id } = await params;

  let transacao;
  try {
    transacao = await getTransacaoOrThrow(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Editar transação</CardTitle>
          <CardDescription>Atualize as informações de &quot;{transacao.descricao}&quot;</CardDescription>
        </CardHeader>
        <CardContent>
          <TransacaoForm transacao={transacao} mode="edit" />
        </CardContent>
      </Card>
    </div>
  );
}
