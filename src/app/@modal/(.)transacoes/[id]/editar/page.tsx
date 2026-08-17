import { notFound } from 'next/navigation';

import { fetchTransacaoById } from '@/app/services/transacoes';
import { ApiUnavailableCard } from '@/components/api-unavailable-card';
import { TransacaoModalForm } from '@/components/transacao-modal-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';

interface ModalEditarTransacaoPageProps {
  params: Promise<{ id: string }>;
}

export default async function ModalEditarTransacaoPage({ params }: Readonly<ModalEditarTransacaoPageProps>) {
  const { id } = await params;

  const result = await fetchTransacaoById(id);
  if (result.status === 404) notFound();
  if (!result.success || !result.data) {
    return (
      <Modal title="Editar transação">
        <ApiUnavailableCard />
      </Modal>
    );
  }
  const transacao = result.data;

  return (
    <Modal title="Editar transação">
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Editar transação</CardTitle>
          <CardDescription>Atualize as informações de &quot;{transacao.descricao}&quot;</CardDescription>
        </CardHeader>
        <CardContent>
          <TransacaoModalForm transacao={transacao} mode="edit" />
        </CardContent>
      </Card>
    </Modal>
  );
}
