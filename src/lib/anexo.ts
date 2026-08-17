import type { TransacaoAnexo } from '@/data/transacoes';

export const MAX_ANEXO_BYTES = 2 * 1024 * 1024;

export const ANEXO_TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;

export function isAnexoPermitido(file: File): string | null {
  if (!ANEXO_TIPOS_ACEITOS.includes(file.type as (typeof ANEXO_TIPOS_ACEITOS)[number])) {
    return 'Envie um PDF ou imagem (JPG, PNG ou WebP).';
  }

  if (file.size > MAX_ANEXO_BYTES) {
    return 'O anexo deve ter no máximo 2 MB.';
  }

  return null;
}

export function fileToAnexo(file: File): Promise<TransacaoAnexo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        nome: file.name,
        mimeType: file.type,
        dataUrl: String(reader.result),
      });
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo'));
    reader.readAsDataURL(file);
  });
}
