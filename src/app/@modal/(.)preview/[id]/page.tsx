import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getTransacaoOrThrow } from '@/app/services/transacoes';
import { RedirectLink } from '@/components/redirect-link';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { isEntrada, TIPO_LABELS } from '@/data/transacoes';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

interface ModalPreviewTransacaoPageProps {
  params: Promise<{ id: string }>;
}

export default async function ModalPreviewTransacaoPage({ params }: Readonly<ModalPreviewTransacaoPageProps>) {
  const { id } = await params;

  let transacao;
  try {
    transacao = await getTransacaoOrThrow(id);
  } catch {
    notFound();
  }

  const entrada = isEntrada(transacao.tipo);

  return (
    <Modal title="Preview da transação">
      <Card className="border-0 shadow-none">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{transacao.descricao}</CardTitle>
              <CardDescription>Preview da transação</CardDescription>
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

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href={`/transacoes/${transacao.id}/editar`}>
              <Button variant="outline">Editar</Button>
            </Link>
            <RedirectLink href={`/transacoes/${transacao.id}`} className={cn(buttonVariants(), 'gap-2')}>
              Ver transação completa
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </RedirectLink>
          </div>
        </CardContent>
      </Card>
    </Modal>
  );
}
