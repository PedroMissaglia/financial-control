import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getTransacaoOrThrow } from '@/app/services/transacoes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isEntrada, TIPO_LABELS } from '@/data/transacoes';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

interface TransacaoDetalhePageProps {
  params: Promise<{ id: string }>;
}

export default async function TransacaoDetalhePage({ params }: TransacaoDetalhePageProps) {
  const { id } = await params;

  let transacao;
  try {
    transacao = await getTransacaoOrThrow(id);
  } catch {
    notFound();
  }

  const entrada = isEntrada(transacao.tipo);

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{transacao.descricao}</CardTitle>
              <CardDescription>Detalhes da transação</CardDescription>
            </div>
            <Badge variant={entrada ? 'success' : 'secondary'}>{TIPO_LABELS[transacao.tipo]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Valor</dt>
              <dd className={cn('font-semibold', entrada ? 'text-success' : 'text-destructive')}>
                {entrada ? '+' : '-'}
                {formatCurrency(transacao.valor)}
              </dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Data</dt>
              <dd>{formatDate(transacao.data)}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Tipo</dt>
              <dd>{TIPO_LABELS[transacao.tipo]}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">ID</dt>
              <dd className="font-mono text-xs">{transacao.id}</dd>
            </div>
          </dl>

          <div className="flex gap-3 pt-2">
            <Link href={`/transacoes/${transacao.id}/editar`}>
              <Button>Editar</Button>
            </Link>
            <Link href="/transacoes">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
