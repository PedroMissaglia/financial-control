'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { createTransacao, updateTransacao } from '@/app/services/transacoes';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { TIPOS_TRANSACAO, type Transacao } from '@/data/transacoes';

const transacaoSchema = z.object({
  tipo: z.enum(['deposito', 'transferencia', 'saque', 'pagamento']),
  valor: z.number().positive('O valor deve ser maior que zero'),
  data: z.string().min(1, 'Informe a data'),
  descricao: z.string().min(2, 'Descrição deve ter ao menos 2 caracteres'),
});

type TransacaoFormData = z.infer<typeof transacaoSchema>;

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

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TransacaoFormData>({
    resolver: zodResolver(transacaoSchema),
    defaultValues: {
      tipo: transacao?.tipo ?? 'deposito',
      valor: transacao?.valor ?? 0,
      data: transacao?.data ?? new Date().toISOString().split('T')[0],
      descricao: transacao?.descricao ?? '',
    },
  });

  async function onSubmit(data: TransacaoFormData) {
    const usuarioId = mode === 'edit' && transacao ? transacao.usuarioId : usuario?.id;

    if (!usuarioId) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = { ...data, usuarioId };
    const result =
      mode === 'edit' && transacao
        ? await updateTransacao(transacao.id, payload)
        : await createTransacao(payload);

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo de transação</Label>
        <Select id="tipo" {...register('tipo')} aria-invalid={!!errors.tipo}>
          {TIPOS_TRANSACAO.map(tipo => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </Select>
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
            />
          )}
        />
        {errors.valor && <p className="text-destructive text-sm">{errors.valor.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="data">Data</Label>
        <Input id="data" type="date" {...register('data')} aria-invalid={!!errors.data} />
        {errors.data && <p className="text-destructive text-sm">{errors.data.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Input
          id="descricao"
          placeholder="Ex: Salário, Aluguel..."
          {...register('descricao')}
          aria-invalid={!!errors.descricao}
        />
        {errors.descricao && <p className="text-destructive text-sm">{errors.descricao.message}</p>}
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : mode === 'edit' ? 'Salvar alterações' : 'Adicionar transação'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
