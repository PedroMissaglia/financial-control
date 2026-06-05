'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { createTransacao } from '@/app/services/transacoes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { TIPOS_TRANSACAO } from '@/data/transacoes';

const quickSchema = z.object({
  tipo: z.enum(['deposito', 'transferencia', 'saque', 'pagamento']),
  valor: z.number().positive('Informe um valor válido'),
});

type QuickFormData = z.infer<typeof quickSchema>;

export function NovaTransacaoRapida() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuickFormData>({
    resolver: zodResolver(quickSchema),
    defaultValues: { tipo: 'deposito', valor: 0 },
  });

  async function onSubmit(data: QuickFormData) {
    if (!usuario?.id) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createTransacao({
      ...data,
      usuarioId: usuario.id,
      data: new Date().toISOString().split('T')[0],
      descricao: `Nova ${TIPOS_TRANSACAO.find(t => t.value === data.tipo)?.label.toLowerCase()}`,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message ?? 'Erro ao registrar transação');
      return;
    }

    reset();
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova transação rápida</CardTitle>
        <CardDescription>Registre uma movimentação informando tipo e valor</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="quick-tipo">Tipo</Label>
            <Select id="quick-tipo" {...register('tipo')}>
              {TIPOS_TRANSACAO.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-valor">Valor</Label>
            <Controller
              control={control}
              name="valor"
              render={({ field }) => (
                <CurrencyInput
                  id="quick-valor"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={!!errors.valor}
                />
              )}
            />
            {errors.valor && <p className="text-destructive text-sm">{errors.valor.message}</p>}
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrar'}
            </Button>
            <Link href="/transacoes/nova">
              <Button type="button" variant="outline">
                Formulário completo
              </Button>
            </Link>
          </div>
        </form>

        {error && (
          <p className="text-destructive mt-3 text-sm" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
