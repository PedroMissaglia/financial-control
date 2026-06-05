'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { deleteTransacao } from '@/app/services/transacoes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isEntrada,TIPO_LABELS, type Transacao } from '@/data/transacoes';
import { cn, formatCurrency, formatDateShort } from '@/lib/utils';

interface TransacaoTableProps {
  transacoes: Transacao[];
}

export function TransacaoTable({ transacoes }: TransacaoTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string, descricao: string) {
    const confirmed = window.confirm(`Deseja excluir a transação "${descricao}"?`);
    if (!confirmed) return;

    setDeletingId(id);
    setError(null);

    const result = await deleteTransacao(id);
    setDeletingId(null);

    if (!result.success) {
      setError(result.message ?? 'Erro ao excluir transação');
      return;
    }

    router.refresh();
  }

  if (transacoes.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center">
        <p className="text-muted-foreground">Nenhuma transação encontrada.</p>
        <Link href="/transacoes/nova" className="mt-4 inline-block">
          <Button>Adicionar primeira transação</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
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
                  <td className="text-muted-foreground px-4 py-3">{formatDateShort(transacao.data)}</td>
                  <td
                    className={cn(
                      'px-4 py-3 font-semibold',
                      entrada ? 'text-success' : 'text-destructive'
                    )}
                  >
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
                        disabled={deletingId === transacao.id}
                        onClick={() => handleDelete(transacao.id, transacao.descricao)}
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
    </div>
  );
}
