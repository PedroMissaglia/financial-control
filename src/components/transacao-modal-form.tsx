'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';

import { TransacaoForm } from '@/components/transacao-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import type { Transacao } from '@/data/transacoes';

interface TransacaoModalFormProps {
  title: string;
  description?: string;
  transacao?: Transacao;
  mode?: 'create' | 'edit';
}

export function TransacaoModalForm({
  title,
  description,
  transacao,
  mode = 'create',
}: Readonly<TransacaoModalFormProps>) {
  const router = useRouter();
  const formId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSuccess() {
    router.back();
    router.refresh();
  }

  return (
    <Modal
      title={title}
      initialSnap="tall"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" form={formId} className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : mode === 'edit' ? 'Salvar alterações' : 'Adicionar transação'}
          </Button>
        </div>
      }
    >
      {description ? <p className="text-muted-foreground mb-4 text-sm">{description}</p> : null}
      <TransacaoForm
        formId={formId}
        hideActions
        transacao={transacao}
        mode={mode}
        onSuccess={handleSuccess}
        onSubmittingChange={setIsSubmitting}
      />
    </Modal>
  );
}
