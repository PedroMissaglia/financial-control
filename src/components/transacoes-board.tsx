'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';

import { TransacoesMicrofrontend } from '@/components/transacoes-microfrontend';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/lib/use-media-query';

export function TransacoesBoard() {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  return (
    <div>
      <div className="mb-6">
        <h1 className="fc-page-title">Transações</h1>
        <p className="fc-card-subtitle mt-1">Visualize, edite ou exclua suas movimentações.</p>
      </div>

      {isDesktop && (
        <div className="mb-4 flex justify-end">
          <Link href="/transacoes/nova">
            <Button type="button" className="gap-1.5">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova transação
            </Button>
          </Link>
        </div>
      )}

      <TransacoesMicrofrontend />
    </div>
  );
}
