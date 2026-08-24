'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { lockBodyScroll } from '@/lib/lock-body-scroll';
import { cn } from '@/lib/utils';

export const BOTTOM_SHEET_ENTER_MS = 500;
export const BOTTOM_SHEET_EXIT_MS = 250;
export const BOTTOM_SHEET_SNAP_MS = 300;

/** @deprecated Use BOTTOM_SHEET_ENTER_MS / BOTTOM_SHEET_EXIT_MS */
export const BOTTOM_SHEET_ANIMATION_MS = BOTTOM_SHEET_ENTER_MS;

const HALF_VH = 50;
const TALL_VH = 80;
const RANGE_VH = TALL_VH - HALF_VH;

const DRAG_CLOSE_PX = 100;
const DRAG_CLOSE_FROM_HALF_AFTER_COLLAPSE_PX = 80;
const DRAG_EXPAND_PX = 72;
const DRAG_COLLAPSE_PX = 72;
const DRAG_VELOCITY_PX_MS = 0.45;

type Snap = 'half' | 'tall';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** Called after the exit animation finishes (when `open` became false). */
  onClosed?: () => void;
  title: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

function vhToPx(vh: number) {
  return (window.innerHeight * vh) / 100;
}

export function BottomSheet({
  open,
  onClose,
  onClosed,
  title,
  description,
  footer,
  children,
}: Readonly<BottomSheetProps>) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [snap, setSnap] = useState<Snap>('half');
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragLastY = useRef(0);
  const dragLastTs = useRef(0);
  const dragVelocity = useRef(0);
  const snapRef = useRef<Snap>('half');
  const isShowingRef = useRef(open);
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;
  snapRef.current = snap;

  // Mount / unmount lifecycle — do not start enter animation here.
  useEffect(() => {
    if (open) {
      isShowingRef.current = true;
      setEntered(false);
      setVisible(false);
      setMounted(true);
      return;
    }

    setVisible(false);
    setEntered(false);
    setDragging(false);
    setDragY(0);
    setSnap('half');
    snapRef.current = 'half';

    if (!isShowingRef.current) return;

    const timeout = window.setTimeout(() => {
      isShowingRef.current = false;
      setMounted(false);
      onClosedRef.current?.();
    }, BOTTOM_SHEET_EXIT_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  // Enter only after the sheet is in the DOM and painted off-screen (fixes first-open skip).
  useLayoutEffect(() => {
    if (!open || !mounted || visible) return;

    const node = sheetRef.current;
    if (node) {
      // Force layout so the browser commits translateY(100%) before we animate in.
      void node.offsetHeight;
    }

    const frame = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [open, mounted, visible]);

  useEffect(() => {
    if (!visible) {
      setEntered(false);
      return;
    }
    const timeout = window.setTimeout(() => setEntered(true), BOTTOM_SHEET_ENTER_MS);
    return () => window.clearTimeout(timeout);
  }, [visible]);

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

  const requestClose = useCallback(() => {
    if (!open) return;
    onClose();
  }, [open, onClose]);

  const onHandlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!open) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStartY.current = event.clientY;
      dragLastY.current = event.clientY;
      dragLastTs.current = event.timeStamp;
      dragVelocity.current = 0;
      setDragging(true);
    },
    [open],
  );

  const onHandlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const raw = event.clientY - dragStartY.current;
    const rangePx = vhToPx(RANGE_VH);
    // half: up to -rangePx (expand), down unlimited (dismiss)
    // tall: down starts by collapsing height, then dismiss past range
    const minY = snapRef.current === 'half' ? -rangePx : 0;
    const nextY = Math.min(Math.max(raw, minY), window.innerHeight);
    const dt = event.timeStamp - dragLastTs.current;
    if (dt > 0) {
      dragVelocity.current = (event.clientY - dragLastY.current) / dt;
    }
    dragLastY.current = event.clientY;
    dragLastTs.current = event.timeStamp;
    setDragY(nextY);
  }, []);

  const onHandlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
      event.currentTarget.releasePointerCapture(event.pointerId);

      const velocity = dragVelocity.current;
      const currentSnap = snapRef.current;
      const rangePx = vhToPx(RANGE_VH);

      setDragging(false);
      setDragY(0);

      if (currentSnap === 'half') {
        if (dragY < -DRAG_EXPAND_PX || velocity < -DRAG_VELOCITY_PX_MS) {
          setSnap('tall');
          snapRef.current = 'tall';
          return;
        }
        if (dragY > DRAG_CLOSE_PX || velocity > DRAG_VELOCITY_PX_MS) {
          requestClose();
        }
        return;
      }

      // tall
      if (dragY > rangePx + DRAG_CLOSE_FROM_HALF_AFTER_COLLAPSE_PX || velocity > DRAG_VELOCITY_PX_MS * 1.6) {
        requestClose();
        return;
      }
      if (dragY > DRAG_COLLAPSE_PX || velocity > DRAG_VELOCITY_PX_MS) {
        setSnap('half');
        snapRef.current = 'half';
      }
    },
    [dragY, requestClose],
  );

  if (!mounted) return null;

  const rangePx = typeof window !== 'undefined' ? vhToPx(RANGE_VH) : 0;
  let heightVh = snap === 'tall' ? TALL_VH : HALF_VH;
  let translateY = 0;

  if (dragging) {
    if (snap === 'half') {
      if (dragY < 0) {
        heightVh = Math.min(TALL_VH, HALF_VH + (-dragY / window.innerHeight) * 100);
      } else {
        translateY = dragY;
      }
    } else {
      // tall: shrink toward half first, then translate to dismiss
      if (dragY <= rangePx) {
        heightVh = Math.max(HALF_VH, TALL_VH - (dragY / window.innerHeight) * 100);
      } else {
        heightVh = HALF_VH;
        translateY = dragY - rangePx;
      }
    }
  }

  const isExiting = !visible;
  const sheetMs = dragging
    ? 0
    : isExiting
      ? BOTTOM_SHEET_EXIT_MS
      : entered
        ? BOTTOM_SHEET_SNAP_MS
        : BOTTOM_SHEET_ENTER_MS;
  const backdropMs = isExiting ? BOTTOM_SHEET_EXIT_MS : BOTTOM_SHEET_ENTER_MS;

  return (
    <div role="presentation" className="relative z-[70]">
      <button
        type="button"
        className={cn(
          'fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm ease-out',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        style={{ transitionProperty: 'opacity', transitionDuration: `${backdropMs}ms` }}
        aria-label="Fechar"
        onClick={requestClose}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          height: `${heightVh}dvh`,
          maxHeight: `${heightVh}dvh`,
          transform: !visible ? 'translateY(100%)' : translateY ? `translateY(${translateY}px)` : 'translateY(0)',
          transitionProperty: dragging ? 'none' : 'transform, height, max-height',
          transitionDuration: `${sheetMs}ms`,
          transitionTimingFunction: 'ease-out',
        }}
        className="bg-card border-border fixed inset-x-0 bottom-0 z-[80] flex flex-col overflow-hidden rounded-t-2xl border shadow-2xl"
      >
        {/* Header — fixed */}
        <div className="border-border shrink-0 border-b">
          <div
            className="flex touch-none justify-center pt-2 pb-1"
            role="button"
            tabIndex={0}
            aria-label="Arraste para redimensionar ou fechar"
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                requestClose();
              }
            }}
          >
            <div className="bg-muted h-1 w-10 rounded-full" />
          </div>
          <div className="px-4 pt-1 pb-3">
            <h2 id={titleId} className="text-foreground truncate text-lg font-semibold">
              {title}
            </h2>
            {description ? <div className="fc-caption mt-0.5">{description}</div> : null}
          </div>
        </div>

        {/* Body — only scrollable region */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">{children}</div>

        {/* Footer — always pinned to sheet bottom */}
        {footer ? (
          <div className="border-border bg-card shrink-0 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
            {footer}
          </div>
        ) : (
          <div className="shrink-0 pb-[env(safe-area-inset-bottom,0px)]" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
