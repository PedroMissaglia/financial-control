import { TransacaoModalForm } from '@/components/transacao-modal-form';

export default function ModalNovaTransacaoPage() {
  return (
    <TransacaoModalForm
      title="Nova transação"
      description="Preencha os dados para registrar uma nova movimentação"
      mode="create"
    />
  );
}
