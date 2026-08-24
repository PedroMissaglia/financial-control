'use client';

import { ChevronDown, Filter, FilterX, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectMenu } from '@/components/ui/select-menu';
import { CATEGORIAS_TRANSACAO } from '@/data/transacoes';
import {
  categoriasFiltro,
  chipsFiltros,
  contagemResultados,
  FILTROS_VAZIOS,
  FORMAS_PAGAMENTO_FILTRO,
  removerFiltro,
  temFiltrosAtivos,
  TIPOS_FILTRO,
  type TransacoesFiltros,
} from '@/lib/transacao-filters';
import { useCategorias } from '@/lib/use-categorias';
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/hooks';

interface TransacoesFiltersProps {
  filtros: TransacoesFiltros;
  total: number;
  visiveis: number;
  onChange: (filtros: TransacoesFiltros) => void;
}

function patchValor(value: number): number | null {
  return value > 0 ? value : null;
}

function AdvancedFilterFields({
  filtros,
  onPatch,
  categoriaOptions,
  idPrefix = '',
}: Readonly<{
  filtros: TransacoesFiltros;
  onPatch: (partial: Partial<TransacoesFiltros>) => void;
  categoriaOptions: { value: string; label: string }[];
  idPrefix?: string;
}>) {
  const tipoId = `${idPrefix}filtro-tipo`;
  const categoriaId = `${idPrefix}filtro-categoria`;
  const pagamentoId = `${idPrefix}filtro-pagamento`;
  const deId = `${idPrefix}filtro-de`;
  const ateId = `${idPrefix}filtro-ate`;
  const minId = `${idPrefix}filtro-min`;
  const maxId = `${idPrefix}filtro-max`;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div className="space-y-2">
        <Label htmlFor={tipoId}>Tipo</Label>
        <SelectMenu
          id={tipoId}
          value={filtros.tipo}
          onChange={tipo => onPatch({ tipo })}
          options={TIPOS_FILTRO.map(item => ({ value: item.value, label: item.label }))}
          aria-label="Filtrar por tipo"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={categoriaId}>Categoria</Label>
        <SelectMenu
          id={categoriaId}
          value={filtros.categoria}
          onChange={categoria => onPatch({ categoria })}
          options={categoriaOptions}
          aria-label="Filtrar por categoria"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={pagamentoId}>Pagamento</Label>
        <SelectMenu
          id={pagamentoId}
          value={filtros.formaPagamento}
          onChange={formaPagamento => onPatch({ formaPagamento })}
          options={FORMAS_PAGAMENTO_FILTRO.map(item => ({ value: item.value, label: item.label }))}
          aria-label="Filtrar por forma de pagamento"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={deId}>De</Label>
          <DatePicker
            id={deId}
            value={filtros.dataInicio}
            max={filtros.dataFim || undefined}
            onChange={dataInicio => onPatch({ dataInicio })}
            aria-label="Data inicial"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={ateId}>Até</Label>
          <DatePicker
            id={ateId}
            value={filtros.dataFim}
            min={filtros.dataInicio || undefined}
            align="end"
            onChange={dataFim => onPatch({ dataFim })}
            aria-label="Data final"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={minId}>Valor mín.</Label>
        <CurrencyInput
          id={minId}
          value={filtros.valorMin ?? 0}
          onChange={valor => onPatch({ valorMin: patchValor(valor) })}
          aria-label="Valor mínimo"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={maxId}>Valor máx.</Label>
        <CurrencyInput
          id={maxId}
          value={filtros.valorMax ?? 0}
          onChange={valor => onPatch({ valorMax: patchValor(valor) })}
          aria-label="Valor máximo"
        />
      </div>
    </div>
  );
}

const COLLAPSED_CHIP_LIMIT = 3;
const FILTROS_PAINEL_ID = 'transacoes-filtros-painel';

function FilterChips({
  chips,
  filtros,
  onChange,
  showClear,
  limit,
  onOverflowClick,
}: Readonly<{
  chips: ReturnType<typeof chipsFiltros>;
  filtros: TransacoesFiltros;
  onChange: (filtros: TransacoesFiltros) => void;
  showClear?: boolean;
  limit?: number;
  onOverflowClick?: () => void;
}>) {
  if (chips.length === 0) return null;

  const visible = limit == null ? chips : chips.slice(0, limit);
  const overflow = limit == null ? 0 : Math.max(0, chips.length - limit);

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
      {visible.map(chip => (
        <Badge key={chip.key} variant="secondary" className="gap-1 pr-1">
          {chip.label}
          <button
            type="button"
            className="hover:bg-background/60 rounded-full p-0.5"
            aria-label={`Remover filtro ${chip.label}`}
            onClick={() => onChange(removerFiltro(filtros, chip.key))}
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </Badge>
      ))}
      {overflow > 0 && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-6 rounded-full px-2 text-xs"
          onClick={onOverflowClick}
          aria-label={`Mostrar mais ${overflow} filtros`}
        >
          +{overflow}
        </Button>
      )}
      {showClear && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => onChange(FILTROS_VAZIOS)}
        >
          <FilterX className="h-3.5 w-3.5" aria-hidden="true" />
          Limpar
        </Button>
      )}
    </div>
  );
}

export function TransacoesFilters({ filtros, total, visiveis, onChange }: Readonly<TransacoesFiltersProps>) {
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const { usuario } = useAuth();
  const { categorias, labels } = useCategorias(usuario?.id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ativos = temFiltrosAtivos(filtros);
  const resumo = contagemResultados(total, visiveis, filtros);
  const chips = chipsFiltros(filtros, labels);
  const categoriaOptions = categoriasFiltro(
    categorias.length
      ? categorias.map(item => ({ value: item.id, label: item.nome }))
      : CATEGORIAS_TRANSACAO.map(item => ({ value: item.value, label: item.label })),
  );
  const advancedCount = chips.filter(chip => chip.key !== 'busca').length;

  function patch(partial: Partial<TransacoesFiltros>) {
    onChange({ ...filtros, ...partial });
  }

  useEffect(() => {
    if (isDesktop && sheetOpen) {
      setSheetOpen(false);
    }
  }, [isDesktop, sheetOpen]);

  const collapsedSummary = ativos ? (
    <FilterChips
      chips={chips}
      filtros={filtros}
      onChange={onChange}
      limit={COLLAPSED_CHIP_LIMIT}
      onOverflowClick={() => setExpanded(true)}
    />
  ) : (
    <p className="text-muted-foreground text-sm">Nenhum filtro ativo</p>
  );

  const expandedForm = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="filtro-busca">Buscar</Label>
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="filtro-busca"
            type="search"
            placeholder="Descrição ou palavra-chave"
            className="ps-9"
            value={filtros.busca}
            onChange={event => patch({ busca: event.target.value })}
          />
        </div>
      </div>

      <AdvancedFilterFields filtros={filtros} onPatch={patch} categoriaOptions={categoriaOptions} />

      {ativos && (
        <div className="border-t pt-4">
          <FilterChips chips={chips} filtros={filtros} onChange={onChange} />
        </div>
      )}
    </div>
  );

  return (
    <section className="bg-card mb-4 rounded-xl border p-3 shadow-sm sm:p-4" aria-label="Filtros de transações">
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div>
          <h2 className="fc-section-title">Filtros</h2>
          <p className="fc-caption">{resumo}</p>
        </div>
        {isDesktop && (
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:self-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2 sm:w-auto"
              aria-expanded={expanded}
              aria-controls={FILTROS_PAINEL_ID}
              onClick={() => setExpanded(current => !current)}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
              {expanded ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2 sm:w-auto"
              disabled={!ativos}
              onClick={() => onChange(FILTROS_VAZIOS)}
            >
              <FilterX className="h-4 w-4" aria-hidden="true" />
              Limpar filtros
            </Button>
          </div>
        )}
      </div>

      {!isDesktop ? (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                id="filtro-busca-mobile"
                type="search"
                placeholder="Descrição ou palavra-chave"
                className="ps-9"
                value={filtros.busca}
                onChange={event => patch({ busca: event.target.value })}
                aria-label="Buscar transações"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="relative shrink-0 gap-1.5 px-3"
              onClick={() => setSheetOpen(true)}
              aria-expanded={sheetOpen}
              aria-haspopup="dialog"
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filtros
              {advancedCount > 0 && (
                <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                  {advancedCount}
                </span>
              )}
            </Button>
          </div>

          <FilterChips
            chips={chips}
            filtros={filtros}
            onChange={onChange}
            showClear
            limit={COLLAPSED_CHIP_LIMIT}
            onOverflowClick={() => setSheetOpen(true)}
          />
        </div>
      ) : (
        <div id={FILTROS_PAINEL_ID}>
          <div
            className={cn(
              'grid overflow-hidden transition-[grid-template-rows,opacity] duration-200',
              expanded ? 'pointer-events-none grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
            )}
            aria-hidden={expanded}
          >
            <div className="min-h-0 overflow-hidden">{collapsedSummary}</div>
          </div>
          <div
            className={cn(
              'grid transition-[grid-template-rows,opacity] duration-200',
              expanded
                ? 'grid-rows-[1fr] overflow-visible opacity-100'
                : 'pointer-events-none grid-rows-[0fr] overflow-hidden opacity-0',
            )}
            aria-hidden={!expanded}
          >
            <div className={cn('min-h-0', expanded ? 'overflow-visible' : 'overflow-hidden')}>{expandedForm}</div>
          </div>
        </div>
      )}

      {!isDesktop && (
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Filtros"
          description={resumo}
          footer={
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                disabled={!ativos}
                onClick={() => onChange(FILTROS_VAZIOS)}
              >
                <FilterX className="h-4 w-4" aria-hidden="true" />
                Limpar
              </Button>
              <Button type="button" className="flex-1" onClick={() => setSheetOpen(false)}>
                Aplicar
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <AdvancedFilterFields
              filtros={filtros}
              onPatch={patch}
              categoriaOptions={categoriaOptions}
              idPrefix="sheet-"
            />
          </div>
        </BottomSheet>
      )}
    </section>
  );
}
