'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { TransacaoForm } from '@/components/transacao-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackToast } from '@/components/ui/feedback-toast';
import { useMediaQuery } from '@/lib/use-media-query';

const PAGE_DESCRIPTION =
  'Registre uma movimentação. Após salvar, o formulário é limpo para o próximo lançamento.';

export function NovaTransacaoPageClient() {
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const [formKey, setFormKey] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSuccess = useCallback(() => {
    setFeedback('Transação cadastrada com sucesso!');
    setFormKey(current => current + 1);
    router.refresh();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [router]);

  const form = <TransacaoForm key={formKey} mode="create" onSuccess={handleSuccess} />;

  return (
    <>
      <FeedbackToast message={feedback} onClose={() => setFeedback(null)} />

      {isDesktop ? (
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle>Nova transação</CardTitle>
              <CardDescription>{PAGE_DESCRIPTION}</CardDescription>
            </CardHeader>
            <CardContent>{form}</CardContent>
          </Card>
        </div>
      ) : (
        <div className="pb-4">
          <div className="mb-4">
            <h1 className="fc-page-title">Nova transação</h1>
            <p className="fc-card-subtitle mt-1">{PAGE_DESCRIPTION}</p>
          </div>
          {form}
        </div>
      )}
    </>
  );
}
