'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { TransacaoCreateSheet } from '@/components/transacao-create-sheet';
import { TransacoesMicrofrontend } from '@/components/transacoes-microfrontend';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/lib/use-media-query';

function TransacoesBoardContent() {
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (isDesktop || searchParams.get('nova') !== '1') return;
    setSheetOpen(true);
    router.replace('/transacoes', { scroll: false });
  }, [isDesktop, router, searchParams]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="fc-page-title">Transações</h1>
        <p className="fc-card-subtitle mt-1">Visualize, edite ou exclua suas movimentações.</p>
      </div>

      {isDesktop ? (
        <div className="mb-4 flex justify-end">
          <Link href="/transacoes/nova">
            <Button type="button" className="gap-1.5">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova transação
            </Button>
          </Link>
        </div>
      ) : (
        <Button type="button" className="mb-4 w-full gap-1.5" onClick={() => setSheetOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nova transação
        </Button>
      )}

      <TransacoesMicrofrontend />

      {!isDesktop && (
        <TransacaoCreateSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      )}
    </div>
  );
}

export function TransacoesBoard() {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Carregando transações...</p>}>
      <TransacoesBoardContent />
    </Suspense>
  );
}
