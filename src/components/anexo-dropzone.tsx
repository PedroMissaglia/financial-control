'use client';

import { FileUp, Paperclip, X } from 'lucide-react';
import { useState } from 'react';

import { AnexoPreview } from '@/components/anexo-preview';
import { Button } from '@/components/ui/button';
import type { TransacaoAnexo } from '@/data/transacoes';
import { ANEXO_TIPOS_ACEITOS, fileToAnexo, isAnexoPermitido } from '@/lib/anexo';
import { cn } from '@/lib/utils';

interface AnexoDropzoneProps {
  id: string;
  anexo: TransacaoAnexo | null;
  errorId?: string;
  onAnexoChange: (anexo: TransacaoAnexo | null) => void;
  onError: (message: string | null) => void;
}

function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
}

export function AnexoDropzone({ id, anexo, errorId, onAnexoChange, onError }: Readonly<AnexoDropzoneProps>) {
  const [isDragging, setIsDragging] = useState(false);

  async function aplicarArquivo(file: File | undefined) {
    if (!file) return;

    const problema = isAnexoPermitido(file);
    if (problema) {
      onError(problema);
      return;
    }

    onError(null);
    onAnexoChange(await fileToAnexo(file));
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    void aplicarArquivo(file);
  }

  function handleDragEnter(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void aplicarArquivo(event.dataTransfer.files[0]);
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'rounded-xl border-2 border-dashed px-3 py-2.5 transition-colors',
        isDragging ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/50'
      )}
    >
      <input
        id={id}
        type="file"
        accept={ANEXO_TIPOS_ACEITOS.join(',')}
        className="sr-only"
        onChange={handleFileChange}
        aria-describedby={errorId}
      />

      {anexo ? (
        <div className="space-y-3">
          <AnexoPreview anexo={anexo} />
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{anexo.nome}</span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remover anexo"
              onClick={() => {
                onError(null);
                onAnexoChange(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <label htmlFor={id} className="text-muted-foreground block cursor-pointer text-center text-xs hover:underline">
            <span className="sm:hidden">Toque para trocar o arquivo</span>
            <span className="hidden sm:inline">Clique ou arraste outro arquivo para substituir</span>
          </label>
        </div>
      ) : (
        <label htmlFor={id} className="flex cursor-pointer items-center gap-3 py-1 text-left sm:gap-3">
          <span className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
            <FileUp className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium sm:hidden">Toque para escolher foto ou PDF</span>
            <span className="hidden text-sm font-medium sm:block">Arraste o recibo ou comprovante</span>
            <span className="text-muted-foreground block text-xs sm:hidden">PDF ou imagem até 2 MB</span>
            <span className="text-muted-foreground hidden text-xs sm:block">
              ou clique para escolher o arquivo · PDF ou imagem até 2 MB
            </span>
          </span>
        </label>
      )}
    </div>
  );
}
