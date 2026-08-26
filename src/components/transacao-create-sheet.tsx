'use client';

import { useId, useState } from 'react';

import { TransacaoForm } from '@/components/transacao-form';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';

interface TransacaoCreateSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TransacaoCreateSheet({ open, onClose, onSuccess }: Readonly<TransacaoCreateSheetProps>) {
  const formId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSuccess() {
    onSuccess?.();
    onClose();
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      initialSnap="tall"
      title="Nova transação"
      description="Preencha os dados para registrar uma nova movimentação"
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" disabled={isSubmitting} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Adicionar transação'}
          </Button>
        </div>
      }
    >
      <TransacaoForm
        formId={formId}
        hideActions
        mode="create"
        onSuccess={handleSuccess}
        onSubmittingChange={setIsSubmitting}
      />
    </BottomSheet>
  );
}
