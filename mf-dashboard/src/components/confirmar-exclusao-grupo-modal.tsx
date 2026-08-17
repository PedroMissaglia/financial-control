'use client';

import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';

interface ConfirmarExclusaoGrupoModalProps {
  open: boolean;
  groupName: string;
  deleteTarget: 'above' | 'below' | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmarExclusaoGrupoModal({
  open,
  groupName,
  deleteTarget,
  onConfirm,
  onClose,
}: Readonly<ConfirmarExclusaoGrupoModalProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const direction = deleteTarget === 'below' ? 'abaixo' : 'acima';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

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
      aria-labelledby="excluir-grupo-title"
    >
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="fixed top-[50%] left-[50%] z-50 w-[calc(100%-1rem)] max-h-[min(92dvh,calc(100dvh-1rem))] max-w-sm translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-xl border bg-card p-4 shadow-2xl sm:w-[calc(100%-2rem)] sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Fechar modal"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 id="excluir-grupo-title" className="fc-panel-title text-xl">
          Excluir grupo
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Tem certeza que deseja excluir{' '}
          <span className="text-foreground font-medium">&quot;{groupName}&quot;</span>? Os painéis serão movidos para o
          grupo {direction}.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Excluir
          </Button>
        </div>
      </div>
    </dialog>
  );
}
