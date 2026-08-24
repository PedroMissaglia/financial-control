'use client';

import { User } from 'lucide-react';

import { DashboardEditorMicrofrontend } from '@/components/dashboard-editor-microfrontend';
import { ContaConjuntaSection } from '@/components/conta-conjunta-section';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectMenu } from '@/components/ui/select-menu';
import { EXTRATO_LIMITE_OPTIONS } from '@/data/dashboard-profile';
import type { Transacao } from '@/data/transacoes';
import { useAppDispatch, useAppSelector, useAuth } from '@/store/hooks';
import { setAlertaGastos, setExtratoLimite, setMetaEconomia } from '@/store/slices/dashboard-slice';

interface ProfileBoardProps {
  transacoes: Transacao[];
}

export function ProfileBoard({ transacoes }: Readonly<ProfileBoardProps>) {
  const dispatch = useAppDispatch();
  const { usuario } = useAuth();
  const metaEconomia = useAppSelector(state => state.dashboard.metaEconomia);
  const alertaGastos = useAppSelector(state => state.dashboard.alertaGastos);
  const extratoLimite = useAppSelector(state => state.dashboard.extratoLimite);

  return (
    <div className="mx-auto w-full min-w-0 max-w-full space-y-6">
      <div className="space-y-1">
        <h1 className="fc-page-title">Meu perfil</h1>
        <p className="fc-card-subtitle">Personalize sua conta e o dashboard. As alterações são salvas automaticamente.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white">
              {usuario?.nome?.trim().charAt(0).toUpperCase() || <User className="h-6 w-6" aria-hidden="true" />}
            </div>
            <div className="min-w-0">
              <CardTitle>{usuario?.nome ?? 'Usuário'}</CardTitle>
              <CardDescription>{usuario?.email ?? '—'}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <ContaConjuntaSection />

      <section className="bg-card space-y-6 rounded-xl border p-4 shadow-sm sm:p-6" aria-label="Preferências do dashboard">
        <div>
          <h2 className="fc-panel-title mb-3">Metas e alertas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meta-economia">Meta de economia (R$)</Label>
              <Input
                id="meta-economia"
                type="number"
                min={0}
                step="50"
                value={metaEconomia}
                onChange={event => dispatch(setMetaEconomia(Number(event.target.value) || 0))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alerta-gastos">Alerta de gastos (R$)</Label>
              <Input
                id="alerta-gastos"
                type="number"
                min={0}
                step="50"
                value={alertaGastos}
                onChange={event => dispatch(setAlertaGastos(Number(event.target.value) || 0))}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="fc-panel-title mb-3">Extrato recente</h2>
          <div className="max-w-full space-y-2 sm:max-w-xs">
            <Label htmlFor="extrato-limite">Quantidade de itens no extrato</Label>
            <SelectMenu
              id="extrato-limite"
              value={String(extratoLimite)}
              onChange={value => dispatch(setExtratoLimite(Number(value)))}
              options={EXTRATO_LIMITE_OPTIONS.map(item => ({
                value: String(item),
                label: `${item} transações`,
              }))}
              aria-label="Quantidade de itens no extrato recente"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3" aria-label="Layout do dashboard">
        <div>
          <h2 className="fc-panel-title">Layout do dashboard</h2>
          <p className="fc-caption">
            Arraste os painéis para reorganizar. Crie, renomeie ou exclua grupos conforme precisar.
          </p>
        </div>

        <DashboardEditorMicrofrontend transacoes={transacoes} />
      </section>
    </div>
  );
}
