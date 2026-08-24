'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';

interface ModalProps {
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
}

const ANIMATION_MS = 300;

export function Modal({ children, title = 'Dialog', footer }: ModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const finishClose = useCallback(() => {
    router.back();
  }, [router]);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setVisible(false);
    window.setTimeout(finishClose, ANIMATION_MS);
  }, [closing, finishClose]);

  return (
    <dialog
      ref={dialogRef}
      className="modal backdrop:bg-transparent"
      onClose={event => {
        event.preventDefault();
        requestClose();
      }}
      aria-labelledby="modal-title"
    >
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out',
          visible && !closing ? 'opacity-100' : 'opacity-0',
        )}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        role="document"
        className={cn(
          'bg-card fixed z-50 flex flex-col overflow-hidden border shadow-2xl transition duration-300 ease-out',
          // Mobile: bottom sheet
          'inset-x-0 bottom-0 max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top,0px)))] rounded-t-2xl',
          !footer && 'pb-[env(safe-area-inset-bottom,0px)]',
          // Desktop: centered dialog
          'sm:inset-auto sm:top-[50%] sm:left-[50%] sm:w-[calc(100%-2rem)] sm:max-h-[min(92dvh,calc(100dvh-1rem))] sm:max-w-lg',
          'sm:translate-x-[-50%] sm:rounded-xl sm:pb-0',
          isDesktop
            ? visible && !closing
              ? 'sm:translate-y-[-50%] sm:scale-100 sm:opacity-100'
              : 'sm:translate-y-[calc(-50%+12px)] sm:scale-95 sm:opacity-0'
            : visible && !closing
              ? 'translate-y-0'
              : 'translate-y-full',
        )}
      >
        <div className="border-border shrink-0 border-b">
          <div className="flex justify-center pt-2 sm:hidden" aria-hidden="true">
            <div className="bg-muted h-1 w-10 rounded-full" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:pt-5 sm:pb-3">
            <h2 id="modal-title" className="text-foreground min-w-0 flex-1 truncate text-lg font-semibold sm:text-xl">
              {title}
            </h2>
            <button
              type="button"
              onClick={requestClose}
              className="bg-muted text-foreground hover:bg-muted/80 focus-visible:ring-ring shrink-0 rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Fechar modal"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6 sm:pb-6">{children}</div>
        {footer ? (
          <div className="border-border bg-card shrink-0 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-4">
            {footer}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
