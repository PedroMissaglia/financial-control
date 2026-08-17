import Link from 'next/link';
import { notFound } from 'next/navigation';

import { fetchTransacaoById } from '@/app/services/transacoes';
import { AnexoPreview } from '@/components/anexo-preview';
import { ApiUnavailableCard } from '@/components/api-unavailable-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORIA_LABELS, isEntrada, TIPO_LABELS } from '@/data/transacoes';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

interface TransacaoDetalhePageProps {
  params: Promise<{ id: string }>;
}

export default async function TransacaoDetalhePage({ params }: TransacaoDetalhePageProps) {
  const { id } = await params;

  const result = await fetchTransacaoById(id);
  if (result.status === 404) notFound();
  if (!result.success || !result.data) {
    return <ApiUnavailableCard />;
  }
  const transacao = result.data;

  const entrada = isEntrada(transacao.tipo);

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="break-words">{transacao.descricao}</CardTitle>
              <CardDescription>Detalhes da transação</CardDescription>
            </div>
            <Badge variant={entrada ? 'success' : 'secondary'}>{TIPO_LABELS[transacao.tipo]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4 border-b pb-2">
              <dt className="text-muted-foreground shrink-0">Valor</dt>
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
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Categoria</dt>
              <dd>{CATEGORIA_LABELS[transacao.categoria]}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b pb-2">
              <dt className="text-muted-foreground shrink-0">ID</dt>
              <dd className="min-w-0 break-all font-mono text-xs">{transacao.id}</dd>
            </div>
          </dl>

          {transacao.anexo && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Anexo</h2>
              <AnexoPreview anexo={transacao.anexo} alt={`Comprovante de ${transacao.descricao}`} />
              <a
                href={transacao.anexo.dataUrl}
                download={transacao.anexo.nome}
                className="text-primary text-sm underline"
              >
                Baixar {transacao.anexo.nome}
              </a>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Link href="/transacoes" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                Voltar
              </Button>
            </Link>
            <Link href={`/transacoes/${transacao.id}/editar`} className="w-full sm:w-auto">
              <Button className="w-full">Editar</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
