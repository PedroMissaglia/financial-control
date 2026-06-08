'use client';

import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';

interface ConfirmarExclusaoModalProps {
  open: boolean;
  descricao?: string;
  isDeleting: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmarExclusaoModal({
  open,
  descricao,
  isDeleting,
  error,
  onConfirm,
  onClose,
}: Readonly<ConfirmarExclusaoModalProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      onClose={onClose}
      aria-labelledby="excluir-transacao-title"
    >
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="fixed top-[50%] left-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-xl border bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-black/10 p-2 transition-colors hover:bg-black/20"
          aria-label="Fechar modal"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 id="excluir-transacao-title" className="text-xl font-bold text-gray-900">
          Excluir transação
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Tem certeza que deseja excluir {descricao ? <span className="font-medium">&quot;{descricao}&quot;</span> : 'esta transação'}? Essa ação não pode ser desfeita.
        </p>

        {error && (
          <p className="text-destructive mt-4 text-sm" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
