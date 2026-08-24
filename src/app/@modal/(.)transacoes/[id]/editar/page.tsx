import { notFound } from 'next/navigation';

import { fetchTransacaoById, hydrateTransacaoAnexo } from '@/app/services/transacoes';
import { ApiUnavailableCard } from '@/components/api-unavailable-card';
import { TransacaoModalForm } from '@/components/transacao-modal-form';
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
  const transacao = await hydrateTransacaoAnexo(result.data);

  return (
    <TransacaoModalForm
      title="Editar transação"
      description={`Atualize as informações de "${transacao.descricao}"`}
      transacao={transacao}
      mode="edit"
    />
  );
}
