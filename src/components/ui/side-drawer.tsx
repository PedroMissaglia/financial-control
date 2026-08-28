'use client';

import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { lockBodyScroll } from '@/lib/lock-body-scroll';
import { OVERLAY_ENTER_MS, OVERLAY_EXIT_MS } from '@/lib/overlay-animation';
import { cn } from '@/lib/utils';

export const SIDE_DRAWER_ENTER_MS = OVERLAY_ENTER_MS;
export const SIDE_DRAWER_EXIT_MS = OVERLAY_EXIT_MS;

type Side = 'left' | 'right';

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Called after the exit animation finishes (when `open` became false). */
  onClosed?: () => void;
  /** Optional id for aria-controls on the trigger button. */
  id?: string;
  side?: Side;
  title: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SideDrawer({
  open,
  onClose,
  onClosed,
  id,
  side = 'left',
  title,
  description,
  footer,
  children,
  className,
}: Readonly<SideDrawerProps>) {
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timeout = window.setTimeout(() => {
      setMounted(false);
      onClosedRef.current?.();
    }, SIDE_DRAWER_EXIT_MS || SIDE_DRAWER_ENTER_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const lock = lockBodyScroll();
    return () => lock.unlock();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mounted, onClose]);

  if (!mounted) return null;

  const motionMs = visible ? SIDE_DRAWER_ENTER_MS : SIDE_DRAWER_EXIT_MS || SIDE_DRAWER_ENTER_MS;
  const hiddenTransform = side === 'left' ? '-translate-x-full' : 'translate-x-full';

  return (
    <div role="presentation" className="relative z-[70]">
      <button
        type="button"
        className={cn(
          'fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm ease-out',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        style={{ transitionProperty: 'opacity', transitionDuration: `${motionMs}ms` }}
        aria-label="Fechar painel"
        onClick={onClose}
      />

      <aside
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        style={{
          transitionProperty: 'transform',
          transitionDuration: `${motionMs}ms`,
          transitionTimingFunction: 'ease-out',
        }}
        className={cn(
          'bg-card border-border fixed inset-y-0 z-[80] flex w-[min(85vw,18rem)] flex-col border shadow-2xl',
          'pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-[env(safe-area-inset-bottom,0px)]',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          visible ? 'translate-x-0' : hiddenTransform,
          className,
        )}
      >
        <div className="border-border flex shrink-0 items-start justify-between gap-3 border-b px-4 pb-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-foreground truncate text-sm font-semibold">
              {title}
            </h2>
            {description ? (
              <div id={descriptionId} className="text-muted-foreground text-xs">
                {description}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-2 transition-colors"
            aria-label="Fechar painel"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3">{children}</div>

        {footer ? (
          <div className="border-border shrink-0 space-y-1 border-t px-2 pt-3 pb-3">{footer}</div>
        ) : null}
      </aside>
    </div>
  );
}
