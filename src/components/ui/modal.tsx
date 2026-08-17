'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface ModalProps {
  children: React.ReactNode;
  title?: string;
}

export function Modal({ children, title = 'Dialog' }: ModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, []);

  function onDismiss() {
    router.back();
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      onClose={onDismiss}
      aria-labelledby="modal-title"
    >
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onDismiss} aria-hidden="true" />
      <div
        role="document"
        className="fixed top-[50%] left-[50%] z-50 flex w-[calc(100%-1rem)] max-h-[min(92dvh,calc(100dvh-1rem))] max-w-lg translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-xl border bg-card p-4 shadow-2xl sm:w-[calc(100%-2rem)] sm:p-6"
      >
        <h2 id="modal-title" className="sr-only">
          {title}
        </h2>
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 right-4 z-10 rounded-full bg-black/10 p-2 transition-colors hover:bg-black/20"
          aria-label="Fechar modal"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="min-h-0 overflow-y-auto overscroll-contain pr-1">{children}</div>
      </div>
    </dialog>
  );
}
