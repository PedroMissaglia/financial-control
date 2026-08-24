'use client';

import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';

interface ConfirmarAcaoModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  error?: string | null;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmarAcaoModal({
  open,
  title,
  description,
  confirmLabel,
  busy = false,
  error,
  destructive = true,
  onConfirm,
  onClose,
}: Readonly<ConfirmarAcaoModalProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      onClose={onClose}
      aria-labelledby="confirmar-acao-title"
    >
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="bg-card fixed top-[50%] left-[50%] z-50 w-[calc(100%-1rem)] max-h-[min(92dvh,calc(100dvh-1rem))] max-w-sm translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-xl border p-4 shadow-2xl sm:w-[calc(100%-2rem)] sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-black/10 p-2 transition-colors hover:bg-black/20"
          aria-label="Fechar modal"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 id="confirmar-acao-title" className="fc-panel-title text-xl">
          {title}
        </h2>
        <p className="text-muted-foreground mt-3 text-sm">{description}</p>

        {error && (
          <p className="text-destructive mt-4 text-sm" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="button" variant={destructive ? 'destructive' : 'default'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Aguarde...' : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
