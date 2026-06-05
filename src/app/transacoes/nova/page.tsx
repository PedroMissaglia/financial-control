import { TransacaoForm } from '@/components/transacao-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NovaTransacaoPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Nova transação</CardTitle>
          <CardDescription>Preencha os dados para registrar uma nova movimentação</CardDescription>
        </CardHeader>
        <CardContent>
          <TransacaoForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
