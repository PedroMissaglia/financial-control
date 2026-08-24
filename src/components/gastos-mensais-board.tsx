'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  createGastoMensal,
  deleteGastoMensal,
  desmarcarGastoMensal,
  pagarGastoMensal,
  updateGastoMensal,
} from '@/app/services/gastos-mensais';
import { DonoBadge } from '@/components/dono-badge';
import { EntityListRow } from '@/components/entity-list-row';
import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectMenu } from '@/components/ui/select-menu';
import {
  competenciaAtual,
  type GastoMensal,
  type GastoMensalInput,
  isGastoMensalAtrasado,
  labelCompetencia,
  shiftCompetencia,
} from '@/data/gastos-mensais';
import { type FormaPagamento, FORMAS_PAGAMENTO } from '@/data/transacoes';
import { useCategorias } from '@/lib/use-categorias';
import { useEscopoFinanceiro } from '@/lib/use-escopo-financeiro';
import { useGastosMensais } from '@/lib/use-gastos-mensais';
import { useMediaQuery } from '@/lib/use-media-query';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/store/hooks';

const DIA_OPTIONS = Array.from({ length: 31 }, (_, index) => {
  const dia = String(index + 1);
  return { value: dia, label: dia };
});

const FORMA_OPTIONS = [
  { value: '', label: 'Nenhuma' },
  ...FORMAS_PAGAMENTO.map(item => ({ value: item.value, label: item.label })),
];

const EMPTY_FORM = {
  titulo: '',
  descricao: '',
  diaVencimento: '10',
  valor: 0,
  categoria: 'outros',
  formaPagamento: '',
};

type FormState = typeof EMPTY_FORM;

function toInput(form: FormState): GastoMensalInput {
  return {
    titulo: form.titulo.trim(),
    descricao: form.descricao.trim(),
    diaVencimento: Number(form.diaVencimento),
    valor: form.valor,
    categoria: form.categoria,
    formaPagamento: (form.formaPagamento || null) as FormaPagamento | null,
  };
}

function fromGasto(gasto: GastoMensal): FormState {
  return {
    titulo: gasto.titulo,
    descricao: gasto.descricao,
    diaVencimento: String(gasto.diaVencimento),
    valor: gasto.valor,
    categoria: gasto.categoria,
    formaPagamento: gasto.formaPagamento ?? '',
  };
}

export function GastosMensaisBoard() {
  const { usuario } = useAuth();
  const { usuarioIds, usuarioIdEscrita, visao, parceiro, ativa } = useEscopoFinanceiro();
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const [competencia, setCompetencia] = useState(competenciaAtual);
  const { gastos, loading, reload } = useGastosMensais(usuarioIds, competencia);
  const categoriasEscopo = useMemo(() => {
    if (ativa && usuario?.id && parceiro?.id) return [usuario.id, parceiro.id];
    return usuarioIds;
  }, [ativa, parceiro?.id, usuario?.id, usuarioIds]);
  const { categorias } = useCategorias(categoriasEscopo);
  const [donoId, setDonoId] = useState(usuarioIdEscrita ?? usuario?.id ?? '');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const podeEscolherDono = Boolean(ativa && usuario && parceiro);

  useEffect(() => {
    if (usuarioIdEscrita) setDonoId(usuarioIdEscrita);
  }, [usuarioIdEscrita]);

  const categoriaOptions = useMemo(
    () =>
      categorias.length
        ? categorias.map(item => ({ value: item.id, label: item.nome }))
        : [{ value: 'outros', label: 'Outros' }],
    [categorias],
  );

  const sheetEditing = Boolean(editingId) && !isDesktop;
  const sheetForm = sheetEditing ? editForm : form;
  const setSheetForm = sheetEditing ? setEditForm : setForm;
  const editingGasto = gastos.find(item => item.id === editingId);

  function closeSheet() {
    setSheetOpen(false);
    setEditingId(null);
  }

  function openCreateSheet() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setSheetOpen(true);
  }

  function openEdit(gasto: GastoMensal) {
    setEditingId(gasto.id);
    setEditForm(fromGasto(gasto));
    setError(null);
    if (!isDesktop) setSheetOpen(true);
  }

  async function handleCreate() {
    const input = toInput(form);
    const ownerId = donoId || usuarioIdEscrita;
    if (!input.titulo || input.titulo.length < 2 || !ownerId) return;

    setBusy(true);
    setError(null);
    const result = await createGastoMensal(ownerId, input);
    setBusy(false);

    if (!result.success) {
      setError(result.message ?? 'Não foi possível criar o gasto');
      return;
    }

    setForm(EMPTY_FORM);
    setSheetOpen(false);
    await reload();
  }

  async function handleSaveEdit(gasto: GastoMensal) {
    const input = toInput(editForm);
    if (!input.titulo || input.titulo.length < 2) return;

    setBusy(true);
    setError(null);
    const result = await updateGastoMensal(gasto.id, input);
    setBusy(false);

    if (!result.success) {
      setError(result.message ?? 'Não foi possível salvar o gasto');
      return;
    }

    setEditingId(null);
    setSheetOpen(false);
    await reload();
  }

  async function handleDelete(gasto: GastoMensal) {
    setBusy(true);
    setError(null);
    const result = await deleteGastoMensal(gasto.id);
    setBusy(false);

    if (!result.success) {
      setError(result.message ?? 'Não foi possível excluir o gasto');
      return;
    }

    if (editingId === gasto.id) {
      setEditingId(null);
      setSheetOpen(false);
    }
    await reload();
  }

  async function handleToggle(gasto: GastoMensal, pago: boolean) {
    setBusyId(gasto.id);
    setError(null);
    const result = pago
      ? await pagarGastoMensal(gasto.id, competencia)
      : await desmarcarGastoMensal(gasto.id, competencia);
    setBusyId(null);

    if (!result.success) {
      setError(result.message ?? 'Não foi possível atualizar o pagamento');
      return;
    }

    await reload();
  }

  function renderFormFields(
    state: FormState,
    setState: (next: FormState) => void,
    idPrefix: string,
    showDono = false,
  ) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {showDono && podeEscolherDono && usuario && parceiro && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${idPrefix}-dono`}>Lançar em nome de</Label>
            <SelectMenu
              id={`${idPrefix}-dono`}
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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-titulo`}>Título</Label>
          <Input
            id={`${idPrefix}-titulo`}
            value={state.titulo}
            maxLength={80}
            placeholder="Ex: Aluguel"
            onChange={event => setState({ ...state, titulo: event.target.value })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-descricao`}>Descrição</Label>
          <Input
            id={`${idPrefix}-descricao`}
            value={state.descricao}
            maxLength={240}
            placeholder="Opcional"
            onChange={event => setState({ ...state, descricao: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-dia`}>Dia do vencimento</Label>
          <SelectMenu
            id={`${idPrefix}-dia`}
            value={state.diaVencimento}
            onChange={value => setState({ ...state, diaVencimento: value })}
            options={DIA_OPTIONS}
            aria-label="Dia do vencimento"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-valor`}>Valor</Label>
          <CurrencyInput
            id={`${idPrefix}-valor`}
            value={state.valor}
            onChange={value => setState({ ...state, valor: value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-categoria`}>Categoria</Label>
          <SelectMenu
            id={`${idPrefix}-categoria`}
            value={state.categoria}
            onChange={value => setState({ ...state, categoria: value })}
            options={
              state.categoria && !categoriaOptions.some(option => option.value === state.categoria)
                ? [...categoriaOptions, { value: state.categoria, label: state.categoria }]
                : categoriaOptions
            }
            aria-label="Categoria"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-forma`}>Forma de pagamento</Label>
          <SelectMenu
            id={`${idPrefix}-forma`}
            value={state.formaPagamento}
            onChange={value => setState({ ...state, formaPagamento: value })}
            options={FORMA_OPTIONS}
            aria-label="Forma de pagamento"
          />
        </div>
      </div>
    );
  }

  let checklist;
  if (loading && gastos.length === 0) {
    checklist = <p className="text-muted-foreground text-sm">Carregando gastos...</p>;
  } else if (gastos.length === 0) {
    checklist = <p className="text-muted-foreground text-sm">Nenhum gasto mensal cadastrado.</p>;
  } else {
    checklist = (
      <ul className="divide-border divide-y">
        {gastos.map(item => {
          const atrasado = isGastoMensalAtrasado(item, competencia);

          return (
            <li key={item.id} className="py-3">
              {editingId === item.id && isDesktop ? (
                <div className="space-y-3">
                  {renderFormFields(editForm, setEditForm, `edit-${item.id}`)}
                  <div className="flex gap-2">
                    <Button type="button" size="sm" disabled={busy} onClick={() => void handleSaveEdit(item)}>
                      Salvar
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setEditingId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <EntityListRow
                  title={item.titulo}
                  subtitle={`${formatCurrency(item.valor)} · vence dia ${item.diaVencimento}${
                    item.descricao ? ` · ${item.descricao}` : ''
                  }`}
                  titleClassName={item.pago ? 'text-muted-foreground line-through' : undefined}
                  badge={
                    <>
                      <DonoBadge usuarioId={item.usuarioId} />
                      {item.pago ? (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-transparent bg-status-pago/25 text-status-pago dark:bg-status-pago/14"
                        >
                          Pago
                        </Badge>
                      ) : atrasado ? (
                        <Badge
                          variant="destructive"
                          className="shrink-0 border-transparent bg-status-atrasado/25 text-status-atrasado dark:bg-status-atrasado/14"
                        >
                          Atrasado
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-transparent bg-status-aberto/25 text-status-aberto dark:bg-status-aberto/14"
                        >
                          Em aberto
                        </Badge>
                      )}
                    </>
                  }
                  leading={
                    <Checkbox
                      checked={item.pago}
                      disabled={busy || busyId === item.id}
                      tone={atrasado ? 'danger' : 'default'}
                      aria-label={`Marcar ${item.titulo} como pago em ${labelCompetencia(competencia)}${
                        atrasado ? ', atrasado' : ''
                      }`}
                      onChange={event => void handleToggle(item, event.target.checked)}
                    />
                  }
                  editLabel={`Editar ${item.titulo}`}
                  deleteLabel={`Excluir ${item.titulo}`}
                  disabled={busy}
                  onEdit={() => openEdit(item)}
                  onDelete={() => void handleDelete(item)}
                />
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  const sheetCanSubmit = sheetForm.titulo.trim().length >= 2;

  return (
    <div className="space-y-4">
      <div
        className="bg-background sticky z-10 flex items-center justify-between gap-2 py-2"
        style={{ top: 'var(--header-offset)' }}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Mês anterior"
          onClick={() => setCompetencia(current => shiftCompetencia(current, -1))}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <p className="text-center text-base font-medium sm:text-lg">{labelCompetencia(competencia)}</p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Próximo mês"
          onClick={() => setCompetencia(current => shiftCompetencia(current, 1))}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {isDesktop ? (
        <section className="bg-card space-y-4 rounded-xl border p-4 shadow-sm sm:p-6" aria-label="Novo gasto mensal">
          {renderFormFields(form, setForm, 'novo-gasto', true)}
          <Button
            type="button"
            className="gap-1.5"
            disabled={busy || loading || form.titulo.trim().length < 2 || !(donoId || usuarioIdEscrita)}
            onClick={() => void handleCreate()}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Criar
          </Button>
          {visao === 'parceiro' && parceiro && !podeEscolherDono && (
            <p className="text-muted-foreground text-xs">O gasto será criado na conta de {parceiro.nome}.</p>
          )}
        </section>
      ) : (
        <Button type="button" className="w-full gap-1.5" onClick={openCreateSheet}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Novo gasto
        </Button>
      )}

      {error && !sheetOpen && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <section className="bg-card rounded-xl border p-4 shadow-sm sm:p-6" aria-label="Checklist do mês">
        {checklist}
      </section>

      {!isDesktop && (
        <BottomSheet
          open={sheetOpen}
          onClose={closeSheet}
          title={sheetEditing ? 'Editar gasto' : 'Novo gasto'}
          footer={
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" disabled={busy} onClick={closeSheet}>
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={busy || !sheetCanSubmit}
                onClick={() => {
                  if (sheetEditing && editingGasto) {
                    void handleSaveEdit(editingGasto);
                    return;
                  }
                  void handleCreate();
                }}
              >
                {sheetEditing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          }
        >
          {renderFormFields(sheetForm, setSheetForm, sheetEditing ? 'sheet-edit' : 'sheet-novo', !sheetEditing)}
          {error && sheetOpen ? (
            <p className="text-destructive mt-3 text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </BottomSheet>
      )}
    </div>
  );
}
