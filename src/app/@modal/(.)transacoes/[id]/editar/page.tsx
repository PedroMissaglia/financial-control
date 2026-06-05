import { notFound } from 'next/navigation';

import { getTransacaoOrThrow } from '@/app/services/transacoes';
import { TransacaoModalForm } from '@/components/transacao-modal-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';

interface ModalEditarTransacaoPageProps {
  params: Promise<{ id: string }>;
}

export default async function ModalEditarTransacaoPage({ params }: Readonly<ModalEditarTransacaoPageProps>) {
  const { id } = await params;

  let transacao;
  try {
    transacao = await getTransacaoOrThrow(id);
  } catch {
    notFound();
  }

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
