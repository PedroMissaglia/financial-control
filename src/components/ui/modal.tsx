'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { lockBodyScroll } from '@/lib/lock-body-scroll';
import { OVERLAY_ENTER_MS, OVERLAY_EXIT_MS } from '@/lib/overlay-animation';
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';

interface ModalProps {
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
}

export function Modal({ children, title = 'Dialog', footer }: ModalProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const [sheetOpen, setSheetOpen] = useState(true);

  const finishClose = useCallback(() => {
    router.back();
  }, [router]);

  if (!isDesktop) {
    return (
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onClosed={finishClose}
        title={title}
        footer={footer}
      >
        {children}
      </BottomSheet>
    );
  }

  return (
    <DesktopModal title={title} footer={footer} onClosed={finishClose}>
      {children}
    </DesktopModal>
  );
}

function DesktopModal({
  children,
  title,
  footer,
  onClosed,
}: Readonly<{
  children: React.ReactNode;
  title: string;
  footer?: React.ReactNode;
  onClosed: () => void;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const lock = lockBodyScroll();
    return () => lock.unlock();
  }, []);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setVisible(false);
    window.setTimeout(onClosed, OVERLAY_EXIT_MS);
  }, [closing, onClosed]);

  const motionMs = visible && !closing ? OVERLAY_ENTER_MS : OVERLAY_EXIT_MS;

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
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm ease-out',
          visible && !closing ? 'opacity-100' : 'opacity-0',
        )}
        style={{ transitionProperty: 'opacity', transitionDuration: `${motionMs}ms` }}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        role="document"
        style={{
          transitionProperty: 'transform, opacity',
          transitionDuration: `${motionMs}ms`,
          transitionTimingFunction: 'ease-out',
        }}
        className={cn(
          'bg-card fixed z-50 flex flex-col overflow-hidden border shadow-2xl',
          'top-[50%] left-[50%] w-[calc(100%-2rem)] max-h-[min(92dvh,calc(100dvh-1rem))] max-w-lg translate-x-[-50%] rounded-xl',
          visible && !closing
            ? 'translate-y-[-50%] scale-100 opacity-100'
            : 'translate-y-[calc(-50%+12px)] scale-95 opacity-0',
        )}
      >
        <div className="border-border shrink-0 border-b">
          <div className="flex items-center gap-3 px-6 pt-5 pb-3">
            <h2 id="modal-title" className="text-foreground min-w-0 flex-1 truncate text-xl font-semibold">
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
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-3 pb-6">{children}</div>
        {footer ? (
          <div className="border-border bg-card shrink-0 border-t px-6 pt-3 pb-4">{footer}</div>
        ) : null}
      </div>
    </dialog>
  );
}
