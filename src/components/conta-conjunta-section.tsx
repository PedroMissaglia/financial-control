'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Users } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  aceitarConvite,
  cancelarConvite,
  encerrarContaConjunta,
  enviarConvite,
  recusarConvite,
} from '@/app/services/conta-conjunta';
import { ConfirmarAcaoModal } from '@/components/confirmar-acao-modal';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type ContaConjuntaView } from '@/data/conta-conjunta';
import { useEscopoFinanceiro } from '@/lib/use-escopo-financeiro';
import { useAppDispatch } from '@/store/hooks';
import { applyContaConjuntaView, loadContaConjunta } from '@/store/slices/conta-conjunta-slice';

const conviteSchema = z.object({
  email: z.email('E-mail inválido'),
});

type ConviteForm = z.infer<typeof conviteSchema>;

export function ContaConjuntaSection() {
  const dispatch = useAppDispatch();
  const { status, parceiro, convite } = useEscopoFinanceiro();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [encerrarOpen, setEncerrarOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConviteForm>({
    resolver: zodResolver(conviteSchema),
    defaultValues: { email: '' },
  });

  async function run(action: () => Promise<{ success: boolean; data?: ContaConjuntaView; message?: string }>) {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (!result.success) {
      setError(result.message ?? 'Não foi possível concluir a operação');
      return false;
    }
    if (result.data) dispatch(applyContaConjuntaView(result.data));
    void dispatch(loadContaConjunta());
    return true;
  }

  async function onConvidar(data: ConviteForm) {
    const ok = await run(() => enviarConvite(data.email));
    if (ok) reset();
  }

  return (
    <section className="bg-card space-y-4 rounded-xl border p-4 shadow-sm sm:p-6" aria-label="Conta conjunta">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <Users className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="fc-panel-title">Conta conjunta</h2>
          <p className="text-muted-foreground text-sm">
            Convide quem já tem cadastro. Vocês passam a ter três visões: a sua, a do cônjuge e a soma das duas.
          </p>
        </div>
      </div>

      {status === 'nenhuma' && (
        <form onSubmit={handleSubmit(onConvidar)} className="space-y-3" noValidate>
          <div className="space-y-2">
            <Label htmlFor="convite-email">E-mail do cônjuge</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="convite-email"
                type="email"
                autoComplete="email"
                placeholder="email@exemplo.com"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              <Button type="submit" disabled={busy} className="sm:w-auto">
                {busy ? 'Enviando...' : 'Enviar convite'}
              </Button>
            </div>
            {errors.email && (
              <p className="text-destructive text-sm" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
        </form>
      )}

      {status === 'convite_enviado' && convite && (
        <Card>
          <CardHeader>
            <CardTitle>Convite enviado</CardTitle>
            <CardDescription>
              Aguardando {parceiro?.nome ?? convite.email} ({convite.email}) aceitar o convite.
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-4">
            <Button
              type="button"
              variant="outline"
              disabled={busy || !convite.id}
              onClick={() => void run(() => cancelarConvite(convite.id))}
            >
              Cancelar convite
            </Button>
          </div>
        </Card>
      )}

      {status === 'convite_recebido' && parceiro && convite && (
        <Card>
          <CardHeader>
            <CardTitle>{parceiro.nome} convidou você</CardTitle>
            <CardDescription>
              Ao aceitar, vocês veem e editam as finanças um do outro, além da visão conjunta.
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col gap-2 px-6 pb-4 sm:flex-row">
            <Button type="button" disabled={busy} onClick={() => void run(() => aceitarConvite(convite.id))}>
              Aceitar
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void run(() => recusarConvite(convite.id))}
            >
              Recusar
            </Button>
          </div>
        </Card>
      )}

      {status === 'ativa' && parceiro && (
        <Card>
          <CardHeader>
            <CardTitle>Vinculado a {parceiro.nome}</CardTitle>
            <CardDescription>{parceiro.email}. Use o seletor no topo para alternar entre Eu, cônjuge e conjunta.</CardDescription>
          </CardHeader>
          <div className="px-6 pb-4">
            <Button type="button" variant="destructive" onClick={() => setEncerrarOpen(true)}>
              Encerrar conta conjunta
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <ConfirmarAcaoModal
        open={encerrarOpen}
        title="Encerrar conta conjunta"
        description="Os dados de cada um permanecem. Vocês deixam de ver e editar as finanças um do outro."
        confirmLabel="Encerrar"
        busy={busy}
        error={error}
        onClose={() => setEncerrarOpen(false)}
        onConfirm={() => {
          void run(() => encerrarContaConjunta()).then(ok => {
            if (ok) setEncerrarOpen(false);
          });
        }}
      />
    </section>
  );
}
