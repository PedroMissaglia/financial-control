'use client';

import { CheckCircle2, X } from 'lucide-react';
import { useEffect } from 'react';

import { cn } from '@/lib/utils';

interface FeedbackToastProps {
  message: string | null;
  onClose: () => void;
  className?: string;
}

export function FeedbackToast({ message, onClose, className }: Readonly<FeedbackToastProps>) {
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timeout);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'border-border bg-card text-foreground fixed inset-x-4 z-[60] flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg',
        'top-[calc(var(--header-offset)+0.75rem)]',
        className,
      )}
    >
      <CheckCircle2 className="text-success mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1 transition-colors"
        aria-label="Fechar aviso"
        onClick={onClose}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
