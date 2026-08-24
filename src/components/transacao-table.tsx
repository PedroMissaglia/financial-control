'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { deleteTransacao } from '@/app/services/transacoes';
import { ConfirmarExclusaoModal } from '@/components/confirmar-exclusao-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { isEntrada, labelCategoria, labelFormaPagamento, TIPO_LABELS, type Transacao } from '@/data/transacoes';
import { useCategorias } from '@/lib/use-categorias';
import { cn, formatCurrency, formatDateShort } from '@/lib/utils';
import { useAuth } from '@/store/hooks';

interface TransacaoTableProps {
  transacoes: Transacao[];
  emptyLabel?: string;
}

function TransacaoCardRow({
  transacao,
  categoriaLabel,
  isDeleting,
  onDelete,
}: Readonly<{
  transacao: Transacao;
  categoriaLabel: string;
  isDeleting: boolean;
  onDelete: (transacao: Transacao) => void;
}>) {
  const entrada = isEntrada(transacao.tipo);
  const pagamento = labelFormaPagamento(transacao.formaPagamento);

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{transacao.descricao}</p>
            <p className="text-muted-foreground text-sm">
              {formatDateShort(transacao.data)} · {categoriaLabel}
              {transacao.formaPagamento ? ` · ${pagamento}` : ''}
            </p>
          </div>
          <p className={cn('shrink-0 font-semibold', entrada ? 'text-success' : 'text-destructive')}>
            {entrada ? '+' : '-'}
            {formatCurrency(transacao.valor)}
          </p>
        </div>

        <Badge variant={entrada ? 'success' : 'secondary'}>{TIPO_LABELS[transacao.tipo]}</Badge>

        <div className="flex flex-wrap gap-1 border-t pt-2">
          <Link href={`/transacoes/${transacao.id}`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Eye className="h-4 w-4" aria-hidden="true" />
              Ver
            </Button>
          </Link>
          <Link href={`/transacoes/${transacao.id}/editar`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Editar
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive gap-1.5"
            disabled={isDeleting}
            onClick={() => onDelete(transacao)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TransacaoTable({
  transacoes,
  emptyLabel = 'Nenhuma transação encontrada.',
}: Readonly<TransacaoTableProps>) {
  const router = useRouter();
  const { usuario } = useAuth();
  const { labels } = useCategorias(usuario?.id);
  const [alvo, setAlvo] = useState<Transacao | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (isDeleting) return;
    setAlvo(null);
    setError(null);
  }

  async function handleConfirm() {
    if (!alvo) return;

    setIsDeleting(true);
    setError(null);

    const result = await deleteTransacao(alvo.id);
    setIsDeleting(false);

    if (!result.success) {
      setError(result.message ?? 'Erro ao excluir transação');
      return;
    }

    setAlvo(null);
    router.refresh();
  }

  if (transacoes.length === 0) {
    return (
      <div className="bg-card rounded-xl border p-8 text-center">
        <p className="text-muted-foreground">{emptyLabel}</p>
        <Link href="/transacoes/nova" className="mt-4 inline-block">
          <Button>Adicionar primeira transação</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Lista de transações financeiras</caption>
          <thead className="bg-muted/50 border-b">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Descrição
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Tipo
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Categoria
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Pagamento
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Data
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Valor
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {transacoes.map(transacao => {
              const entrada = isEntrada(transacao.tipo);
              return (
                <tr key={transacao.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{transacao.descricao}</td>
                  <td className="px-4 py-3">
                    <Badge variant={entrada ? 'success' : 'secondary'}>{TIPO_LABELS[transacao.tipo]}</Badge>
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {labelCategoria(transacao.categoria, labels)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {labelFormaPagamento(transacao.formaPagamento)}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">{formatDateShort(transacao.data)}</td>
                  <td className={cn('px-4 py-3 font-semibold', entrada ? 'text-success' : 'text-destructive')}>
                    {entrada ? '+' : '-'}
                    {formatCurrency(transacao.valor)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/transacoes/${transacao.id}`}>
                        <Button variant="ghost" size="icon" aria-label={`Ver detalhes de ${transacao.descricao}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/transacoes/${transacao.id}/editar`}>
                        <Button variant="ghost" size="icon" aria-label={`Editar ${transacao.descricao}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Excluir ${transacao.descricao}`}
                        disabled={isDeleting && alvo?.id === transacao.id}
                        onClick={() => setAlvo(transacao)}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden" aria-label="Lista de transações em cards">
        {transacoes.map(transacao => (
          <TransacaoCardRow
            key={transacao.id}
            transacao={transacao}
            categoriaLabel={labelCategoria(transacao.categoria, labels)}
            isDeleting={isDeleting && alvo?.id === transacao.id}
            onDelete={setAlvo}
          />
        ))}
      </div>

      <ConfirmarExclusaoModal
        open={!!alvo}
        descricao={alvo?.descricao}
        isDeleting={isDeleting}
        error={error}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </div>
  );
}
