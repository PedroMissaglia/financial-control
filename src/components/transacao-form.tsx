'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { createTransacao, updateTransacao } from '@/app/services/transacoes';
import { AnexoDropzone } from '@/components/anexo-dropzone';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectMenu } from '@/components/ui/select-menu';
import {
  agoraLocal,
  CATEGORIA_LABELS,
  CATEGORIAS_TRANSACAO,
  type CategoriaTransacao,
  sugerirCategoria,
  TIPOS_TRANSACAO,
  type Transacao,
  type TransacaoAnexo,
} from '@/data/transacoes';
import { useAuth } from '@/store/hooks';

const hoje = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const transacaoSchema = z.object({
  tipo: z.enum(['deposito', 'transferencia', 'saque', 'pagamento']),
  valor: z.number().positive('O valor deve ser maior que zero'),
  data: z
    .string()
    .min(1, 'Informe a data')
    .refine(value => value <= hoje(), 'A data não pode ser futura'),
  descricao: z.string().trim().min(2, 'Descrição deve ter ao menos 2 caracteres').max(80, 'Máximo de 80 caracteres'),
  categoria: z.enum([
    'salario',
    'freelance',
    'moradia',
    'alimentacao',
    'transporte',
    'saude',
    'educacao',
    'lazer',
    'servicos',
    'transferencias',
    'outros',
  ]),
});

type TransacaoFormData = z.infer<typeof transacaoSchema>;

const TIPO_OPTIONS = TIPOS_TRANSACAO.map(tipo => ({ value: tipo.value, label: tipo.label }));
const CATEGORIA_OPTIONS = CATEGORIAS_TRANSACAO.map(item => ({ value: item.value, label: item.label }));

interface TransacaoFormProps {
  transacao?: Transacao;
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
}

export function TransacaoForm({ transacao, mode = 'create', onSuccess }: TransacaoFormProps) {
  const router = useRouter();
  const { usuario } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anexo, setAnexo] = useState<TransacaoAnexo | null>(transacao?.anexo ?? null);
  const [anexoError, setAnexoError] = useState<string | null>(null);
  const [sugestao, setSugestao] = useState<CategoriaTransacao | null>(null);
  const formId = useId();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TransacaoFormData>({
    resolver: zodResolver(transacaoSchema),
    defaultValues: {
      tipo: transacao?.tipo ?? 'deposito',
      valor: transacao?.valor ?? 0,
      data: transacao?.data ?? hoje(),
      descricao: transacao?.descricao ?? '',
      categoria: transacao?.categoria ?? 'outros',
    },
  });

  function atualizarSugestao(descricao: string) {
    const sugerida = sugerirCategoria(descricao);
    const categoriaAtual = getValues('categoria');
    if (sugerida && categoriaAtual === 'outros') {
      setValue('categoria', sugerida);
      setSugestao(null);
      return;
    }
    setSugestao(sugerida && sugerida !== categoriaAtual ? sugerida : null);
  }

  async function onSubmit(data: TransacaoFormData) {
    const usuarioId = mode === 'edit' && transacao ? transacao.usuarioId : usuario?.id;

    if (!usuarioId) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      ...data,
      usuarioId,
      anexo,
      hora: mode === 'edit' && transacao ? transacao.hora || '00:00:00' : agoraLocal().hora,
    };
    const result =
      mode === 'edit' && transacao ? await updateTransacao(transacao.id, payload) : await createTransacao(payload);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message ?? 'Erro ao salvar transação');
      return;
    }

    if (onSuccess) {
      onSuccess();
    } else {
      router.push('/transacoes');
      router.refresh();
    }
  }

  const descricaoErrorId = `${formId}-descricao-error`;
  const valorErrorId = `${formId}-valor-error`;
  const dataErrorId = `${formId}-data-error`;
  const categoriaErrorId = `${formId}-categoria-error`;
  const anexoErrorId = `${formId}-anexo-error`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo de transação</Label>
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <SelectMenu
              id="tipo"
              value={field.value}
              onChange={field.onChange}
              options={TIPO_OPTIONS}
              aria-label="Tipo de transação"
            />
          )}
        />
        {errors.tipo && <p className="text-destructive text-sm">{errors.tipo.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="valor">Valor</Label>
        <Controller
          control={control}
          name="valor"
          render={({ field }) => (
            <CurrencyInput
              id="valor"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              aria-invalid={!!errors.valor}
              aria-describedby={errors.valor ? valorErrorId : undefined}
            />
          )}
        />
        {errors.valor && (
          <p id={valorErrorId} className="text-destructive text-sm">
            {errors.valor.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="data">Data</Label>
        <Controller
          control={control}
          name="data"
          render={({ field }) => (
            <DatePicker
              id="data"
              value={field.value}
              onChange={field.onChange}
              max={hoje()}
              aria-label="Data da transação"
            />
          )}
        />
        {errors.data && (
          <p id={dataErrorId} className="text-destructive text-sm">
            {errors.data.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Input
          id="descricao"
          placeholder="Ex: Salário, Aluguel..."
          {...register('descricao', {
            onChange: event => atualizarSugestao(event.target.value),
          })}
          aria-invalid={!!errors.descricao}
          aria-describedby={errors.descricao ? descricaoErrorId : undefined}
        />
        {errors.descricao && (
          <p id={descricaoErrorId} className="text-destructive text-sm">
            {errors.descricao.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoria">Categoria</Label>
        <Controller
          control={control}
          name="categoria"
          render={({ field }) => (
            <SelectMenu
              id="categoria"
              value={field.value}
              onChange={field.onChange}
              options={CATEGORIA_OPTIONS}
              aria-label="Categoria da transação"
            />
          )}
        />
        {sugestao && (
          <button
            type="button"
            className="text-primary flex items-center gap-1 text-sm hover:underline"
            onClick={() => {
              setValue('categoria', sugestao);
              setSugestao(null);
            }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Sugestão: {CATEGORIA_LABELS[sugestao]}. Aplicar?
          </button>
        )}
        {errors.categoria && (
          <p id={categoriaErrorId} className="text-destructive text-sm">
            {errors.categoria.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="anexo">Anexo (recibo ou comprovante)</Label>
        <AnexoDropzone
          id="anexo"
          anexo={anexo}
          errorId={anexoError ? anexoErrorId : undefined}
          onAnexoChange={setAnexo}
          onError={setAnexoError}
        />
        {anexoError && (
          <p id={anexoErrorId} className="text-destructive text-sm" role="alert">
            {anexoError}
          </p>
        )}
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : mode === 'edit' ? 'Salvar alterações' : 'Adicionar transação'}
        </Button>
      </div>
    </form>
  );
}
