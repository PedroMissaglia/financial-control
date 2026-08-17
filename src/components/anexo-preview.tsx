import type { TransacaoAnexo } from '@/data/transacoes';
import { cn } from '@/lib/utils';

interface AnexoPreviewProps {
  anexo: TransacaoAnexo;
  alt?: string;
  className?: string;
}

export function AnexoPreview({ anexo, alt, className }: Readonly<AnexoPreviewProps>) {
  if (anexo.mimeType.startsWith('image/')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={anexo.dataUrl}
        alt={alt ?? `Pré-visualização de ${anexo.nome}`}
        className={cn('h-auto max-h-72 w-full rounded-md border bg-background object-contain', className)}
      />
    );
  }

  if (anexo.mimeType === 'application/pdf') {
    return (
      <object
        data={anexo.dataUrl}
        type="application/pdf"
        aria-label={alt ?? `Pré-visualização de ${anexo.nome}`}
        className={cn('h-72 w-full overflow-hidden rounded-md border bg-background', className)}
      >
        <a href={anexo.dataUrl} download={anexo.nome} className="text-primary block p-4 text-sm underline">
          Abrir {anexo.nome}
        </a>
      </object>
    );
  }

  return null;
}
