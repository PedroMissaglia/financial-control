import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function TransacaoNotFound() {
  return (
    <div className="rounded-xl border bg-white p-8 text-center">
      <h2 className="text-lg font-semibold">Transação não encontrada</h2>
      <p className="text-muted-foreground mt-2 text-sm">A transação solicitada não existe ou foi removida.</p>
      <Link href="/transacoes" className="mt-4 inline-block">
        <Button variant="outline">Voltar para listagem</Button>
      </Link>
    </div>
  );
}
