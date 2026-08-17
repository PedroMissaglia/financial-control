import { notFound } from 'next/navigation';

import { fetchTransacaoById } from '@/app/services/transacoes';
import { ApiUnavailableCard } from '@/components/api-unavailable-card';
import { TransacaoForm } from '@/components/transacao-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EditarTransacaoPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarTransacaoPage({ params }: Readonly<EditarTransacaoPageProps>) {
  const { id } = await params;

  const result = await fetchTransacaoById(id);
  if (result.status === 404) notFound();
  if (!result.success || !result.data) {
    return <ApiUnavailableCard />;
  }
  const transacao = result.data;

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
