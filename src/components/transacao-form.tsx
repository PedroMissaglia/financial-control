'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { createCategoria } from '@/app/services/categorias';
import { createTransacao, fetchAnexo, updateTransacao } from '@/app/services/transacoes';
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
  type FormaPagamento,
  FORMAS_PAGAMENTO,
  FORMAS_PAGAMENTO_IDS,
  type NovaTransacao,
  sugerirCategoria,
  TIPOS_TRANSACAO,
  type Transacao,
  type TransacaoAnexo,
} from '@/data/transacoes';
import { useCategorias } from '@/lib/use-categorias';
import { useAuth } from '@/store/hooks';
import { useEscopoFinanceiro } from '@/lib/use-escopo-financeiro';

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
  categoria: z.string().min(1, 'Selecione uma categoria'),
  formaPagamento: z.enum(FORMAS_PAGAMENTO_IDS).or(z.literal('')),
});

type TransacaoFormData = z.infer<typeof transacaoSchema>;

const TIPO_OPTIONS = TIPOS_TRANSACAO.map(tipo => ({ value: tipo.value, label: tipo.label }));
const FORMA_PAGAMENTO_OPTIONS = [
  { value: '', label: 'Nenhuma' },
  ...FORMAS_PAGAMENTO.map(item => ({ value: item.value, label: item.label })),
];
const CATEGORIA_FALLBACK = CATEGORIAS_TRANSACAO.map(item => ({ value: item.value, label: item.label }));

interface TransacaoFormProps {
  transacao?: Transacao;
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
  /** HTML id for the form element (needed when actions live outside via form=). */
  formId?: string;
  /** Hide Cancel/Submit — use with Modal footer + form= attribute. */
  hideActions?: boolean;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

export function TransacaoForm({
  transacao,
  mode = 'create',
  onSuccess,
  formId: formIdProp,
  hideActions = false,
  onSubmittingChange,
}: Readonly<TransacaoFormProps>) {
  const router = useRouter();
  const { usuario } = useAuth();
  const { visao, usuarioIdEscrita, parceiro } = useEscopoFinanceiro();
  const [donoId, setDonoId] = useState(usuarioIdEscrita ?? usuario?.id ?? '');
  const categoriasOwner = mode === 'edit' && transacao ? transacao.usuarioId : donoId || usuarioIdEscrita;
  const { categorias } = useCategorias(
    mode === 'edit' && transacao
      ? transacao.usuarioId
      : visao === 'conjunto'
        ? [usuario?.id, parceiro?.id].filter(Boolean) as string[]
        : categoriasOwner,
  );

  useEffect(() => {
    if (usuarioIdEscrita) setDonoId(usuarioIdEscrita);
  }, [usuarioIdEscrita]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anexo, setAnexo] = useState<TransacaoAnexo | null>(transacao?.anexo ?? null);
  const [anexoTouched, setAnexoTouched] = useState(Boolean(transacao?.anexo));
  const [anexoError, setAnexoError] = useState<string | null>(null);
  const [sugestao, setSugestao] = useState<CategoriaTransacao | null>(null);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [criandoCategoria, setCriandoCategoria] = useState(false);
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);
  const generatedId = useId();
  const formId = formIdProp ?? generatedId;

  function setSubmitting(next: boolean) {
    setIsSubmitting(next);
    onSubmittingChange?.(next);
  }

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
      formaPagamento: transacao?.formaPagamento ?? '',
    },
  });

  const categoriaOptions = useMemo(() => {
    const items = categorias.length
      ? categorias.map(item => ({ value: item.id, label: item.nome }))
      : CATEGORIA_FALLBACK;
    const atual = transacao?.categoria;
    if (atual && !items.some(item => item.value === atual)) {
      return [...items, { value: atual, label: CATEGORIA_LABELS[atual] ?? atual }];
    }
    return items;
  }, [categorias, transacao?.categoria]);

  useEffect(() => {
    if (mode === 'create' && usuarioIdEscrita) setDonoId(usuarioIdEscrita);
  }, [mode, usuarioIdEscrita]);

  useEffect(() => {
    if (!transacao?.anexoId || transacao.anexo) return;
    let cancelled = false;

    void fetchAnexo(transacao.anexoId).then(result => {
      if (cancelled || !result.success || !result.data) return;
      setAnexo(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [transacao?.anexo, transacao?.anexoId]);

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

  async function handleNovaCategoria() {
    const nome = novaCategoria.trim();
    if (!nome || !categoriasOwner) return;

    setSalvandoCategoria(true);
    setError(null);
    const result = await createCategoria(categoriasOwner, nome);
    setSalvandoCategoria(false);

    if (!result.success || !result.data) {
      setError(result.message ?? 'Não foi possível criar a categoria');
      return;
    }

    setValue('categoria', result.data.id);
    setNovaCategoria('');
    setCriandoCategoria(false);
    setSugestao(null);
  }

  async function onSubmit(data: TransacaoFormData) {
    const usuarioId = mode === 'edit' && transacao ? transacao.usuarioId : donoId || usuarioIdEscrita;

    if (!usuarioId) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: NovaTransacao = {
      usuarioId,
      tipo: data.tipo,
      valor: data.valor,
      data: data.data,
      descricao: data.descricao,
      categoria: data.categoria,
      formaPagamento: (data.formaPagamento || null) as FormaPagamento | null,
      hora: mode === 'edit' && transacao ? transacao.hora || '00:00:00' : agoraLocal().hora,
    };

    if (mode === 'create' || anexoTouched || anexo) {
      payload.anexo = anexo;
    }

    const result =
      mode === 'edit' && transacao ? await updateTransacao(transacao.id, payload) : await createTransacao(payload);

    setSubmitting(false);

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
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {mode === 'create' && visao === 'conjunto' && usuario && parceiro && (
        <div className="space-y-2">
          <Label htmlFor="dono">Lançar em nome de</Label>
          <SelectMenu
            id="dono"
            value={donoId || usuario.id}
            onChange={setDonoId}
            options={[
              { value: usuario.id, label: `Você (${usuario.nome})` },
              { value: parceiro.id, label: parceiro.nome },
            ]}
            aria-label="Lançar em nome de"
          />
        </div>
      )}
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
              options={categoriaOptions}
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
        {criandoCategoria ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={novaCategoria}
              onChange={event => setNovaCategoria(event.target.value)}
              placeholder="Nome da nova categoria"
              aria-label="Nome da nova categoria"
              maxLength={40}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="flex-1 sm:flex-none"
                disabled={salvandoCategoria || !novaCategoria.trim()}
                onClick={() => void handleNovaCategoria()}
              >
                {salvandoCategoria ? 'Criando...' : 'Criar'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 sm:flex-none"
                disabled={salvandoCategoria}
                onClick={() => {
                  setCriandoCategoria(false);
                  setNovaCategoria('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="text-primary text-sm hover:underline"
            onClick={() => setCriandoCategoria(true)}
          >
            Nova categoria…
          </button>
        )}
        {errors.categoria && (
          <p id={categoriaErrorId} className="text-destructive text-sm">
            {errors.categoria.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="formaPagamento">Forma de pagamento</Label>
        <Controller
          control={control}
          name="formaPagamento"
          render={({ field }) => (
            <SelectMenu
              id="formaPagamento"
              value={field.value}
              onChange={field.onChange}
              options={FORMA_PAGAMENTO_OPTIONS}
              aria-label="Forma de pagamento"
            />
          )}
        />
        <p className="text-muted-foreground text-xs">Opcional. Escolha “Nenhuma” se não quiser informar.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="anexo">Anexo (recibo ou comprovante)</Label>
        <AnexoDropzone
          id="anexo"
          anexo={anexo}
          errorId={anexoError ? anexoErrorId : undefined}
          onAnexoChange={next => {
            setAnexoTouched(true);
            setAnexo(next);
          }}
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

      {!hideActions && (
        <div className="border-border mt-2 flex flex-col gap-2 border-t pt-3 sm:mt-0 sm:flex-row sm:justify-end sm:gap-3 sm:border-0 sm:pt-2">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : mode === 'edit' ? 'Salvar alterações' : 'Adicionar transação'}
          </Button>
        </div>
      )}
    </form>
  );
}
