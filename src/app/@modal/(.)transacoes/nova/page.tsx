import { TransacaoModalForm } from '@/components/transacao-modal-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';

export default function ModalNovaTransacaoPage() {
  return (
    <Modal title="Nova transação">
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Nova transação</CardTitle>
          <CardDescription>Preencha os dados para registrar uma nova movimentação</CardDescription>
        </CardHeader>
        <CardContent>
          <TransacaoModalForm mode="create" />
        </CardContent>
      </Card>
    </Modal>
  );
}
