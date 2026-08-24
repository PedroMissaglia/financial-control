'use client';

import { Filter, FilterX, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
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
import { useAuth } from '@/store/hooks';

interface TransacoesFiltersProps {
  filtros: TransacoesFiltros;
  total: number;
  visiveis: number;
  onChange: (filtros: TransacoesFiltros) => void;
}

function parseValor(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

      <div className="space-y-2">
        <Label htmlFor={minId}>Valor mín.</Label>
        <div className="relative">
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
            R$
          </span>
          <Input
            id={minId}
            type="number"
            min={0}
            step="0.01"
            placeholder="0,00"
            className="ps-9"
            value={filtros.valorMin ?? ''}
            onChange={event => onPatch({ valorMin: parseValor(event.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={maxId}>Valor máx.</Label>
        <div className="relative">
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
            R$
          </span>
          <Input
            id={maxId}
            type="number"
            min={0}
            step="0.01"
            placeholder="0,00"
            className="ps-9"
            value={filtros.valorMax ?? ''}
            onChange={event => onPatch({ valorMax: parseValor(event.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}

function FilterChips({
  chips,
  filtros,
  onChange,
  showClear,
}: Readonly<{
  chips: ReturnType<typeof chipsFiltros>;
  filtros: TransacoesFiltros;
  onChange: (filtros: TransacoesFiltros) => void;
  showClear?: boolean;
}>) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
      {chips.map(chip => (
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

  return (
    <section className="bg-card mb-4 rounded-xl border p-3 shadow-sm sm:p-4" aria-label="Filtros de transações">
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div>
          <h2 className="fc-section-title">Filtros</h2>
          <p className="fc-caption">{resumo}</p>
        </div>
        {isDesktop && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full shrink-0 gap-2 self-stretch sm:w-auto sm:self-start"
            disabled={!ativos}
            onClick={() => onChange(FILTROS_VAZIOS)}
          >
            <FilterX className="h-4 w-4" aria-hidden="true" />
            Limpar filtros
          </Button>
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

          <FilterChips chips={chips} filtros={filtros} onChange={onChange} showClear />
        </div>
      ) : (
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
