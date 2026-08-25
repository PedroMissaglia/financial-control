import { useEffect, useState, type ReactNode } from 'react';
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { type PontoSaldo, type ReceitasDespesasAno, type TotalPorGrupo } from '@/data/analises';
import type {
  FatiaReceitasDespesas,
  GrupoEmpilhado,
  PontoAnoEmpilhado,
  PontoEvolucaoEmpilhado,
} from '@/lib/build-widget-analytics';
import { useChartThemeColors, type ListSwatch } from '@/lib/chart-theme';
import { formatCurrency } from '@/lib/utils';

function formatTooltipValue(value: unknown) {
  return typeof value === 'number' ? formatCurrency(value) : String(value ?? '');
}

function ChartTooltip() {
  return (
    <Tooltip
      formatter={formatTooltipValue}
      contentStyle={{
        backgroundColor: 'hsl(var(--popover))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '0.5rem',
        color: 'hsl(var(--popover-foreground))',
      }}
      itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
      labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 600 }}
    />
  );
}

function formatAxisValue(value: number) {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function pastelFromHsl(color: string): { fill: string; stroke: string } {
  return { fill: color, stroke: color };
}

function heightForCategoryBars(count: number, isMobile: boolean, seriesCount = 1): number {
  const min = isMobile ? 200 : 220;
  const max = isMobile ? 400 : 480;
  const row = seriesCount > 1 ? 48 : 40;
  return Math.min(max, Math.max(min, count * row + 48));
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isMobile;
}

function ChartFrame({
  title,
  label,
  height,
  children,
}: Readonly<{ title: string; label: string; height: number; children: ReactNode }>) {
  return (
    <div className="bg-card w-full rounded-xl border p-3 shadow-sm sm:p-4">
      <h3 className="fc-chart-title mb-4">{title}</h3>
      <div role="img" aria-label={label} className="w-full" style={{ height }}>
        {children}
      </div>
    </div>
  );
}

function ContrastLegend({ items }: Readonly<{ items: { label: string; color: string }[] }>) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
      {items.map(item => (
        <li key={item.label} className="text-card-foreground flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function pessoaSeriesSwatch(series: string[], index: number, fallback: string): ListSwatch {
  return pastelFromHsl(series[index % series.length] ?? fallback);
}

function shadeSwatch(swatch: ListSwatch, lightnessShift: number): ListSwatch {
  const inner = /^hsl\((.+)\)$/.exec(swatch.stroke);
  if (!inner?.[1]) return swatch;
  const parts = /^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/.exec(inner[1].trim());
  if (!parts) return swatch;
  const lightness = Math.min(78, Math.max(22, Number(parts[3]) + lightnessShift));
  const color = `hsl(${parts[1]} ${parts[2]}% ${lightness}%)`;
  return { fill: color, stroke: color };
}

/** Pessoa 0 = cor da visão unitária; demais = mesmo matiz, tom mais claro. */
function pessoaShadeOf(base: ListSwatch, pessoaIndex: number): ListSwatch {
  if (pessoaIndex === 0) return base;
  return shadeSwatch(base, 16);
}

function receitaDespesaSwatch(
  colors: ReturnType<typeof useChartThemeColors>,
  kind: 'receita' | 'despesa',
  pessoaIndex: number,
): ListSwatch {
  const base = kind === 'receita' ? colors.receita : colors.despesa;
  if (pessoaIndex === 0) return base;
  return shadeSwatch(base, kind === 'receita' ? 16 : -10);
}

function receitaDespesaAnoSwatch(
  colors: ReturnType<typeof useChartThemeColors>,
  kind: 'receita' | 'despesa',
  pessoaIndex: number,
): ListSwatch {
  const base = kind === 'receita' ? colors.anoReceita : colors.anoDespesa;
  if (pessoaIndex === 0) return base;
  return shadeSwatch(base, 16);
}

interface SeriePessoa {
  dataKey: string;
  nome: string;
}

function PessoaShadeLegend({ seriesPessoas }: Readonly<{ seriesPessoas: SeriePessoa[] }>) {
  const primeira = seriesPessoas[0];
  const segunda = seriesPessoas[1];
  if (!primeira || !segunda) return null;
  return (
    <p className="text-muted-foreground mt-1 text-center text-xs">
      {primeira.nome}: cor da categoria · {segunda.nome}: mesmo tom, mais claro
    </p>
  );
}

interface EvolucaoSaldoChartProps {
  evolucao: PontoSaldo[];
  evolucaoEmpilhado?: PontoEvolucaoEmpilhado[];
  seriesPessoas?: SeriePessoa[];
  ano: number;
}

export function EvolucaoSaldoChart({
  evolucao,
  evolucaoEmpilhado = [],
  seriesPessoas = [],
  ano,
}: Readonly<EvolucaoSaldoChartProps>) {
  const isMobile = useIsMobile();
  const colors = useChartThemeColors();
  const chartHeight = isMobile ? 220 : 280;
  const prefix = `${ano}-`;
  const evolucaoAno = evolucao.filter(item => item.data.startsWith(prefix));
  const evolucaoEmpilhadoAno = evolucaoEmpilhado.filter(item => String(item.data).startsWith(prefix));
  const fragmentado = seriesPessoas.length > 1 && evolucaoEmpilhadoAno.length > 0;
  const tomSaldoUnitario = pessoaSeriesSwatch(colors.series, 0, colors.line);

  return (
    <ChartFrame
      title={`Evolução do saldo · ${ano}`}
      label={`Gráfico de barras com a evolução do saldo em ${ano}`}
      height={chartHeight}
    >
      {fragmentado ? (
        evolucaoEmpilhadoAno.length === 0 ? (
          <p className="fc-caption">Sem dados para o gráfico.</p>
        ) : (
          <ResponsiveContainer
            key={evolucaoEmpilhadoAno.map(item => `${item.data}:${seriesPessoas.map(s => item[s.dataKey]).join(',')}`).join('|')}
            width="100%"
            height={chartHeight}
          >
            <BarChart data={evolucaoEmpilhadoAno} margin={{ top: 8, right: 12, left: 4, bottom: isMobile ? 40 : 8 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: isMobile ? 10 : 12, fill: colors.axis }}
                angle={isMobile ? -35 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
                height={isMobile ? 40 : 30}
                minTickGap={isMobile ? 8 : 24}
                interval="preserveStartEnd"
              />
              <YAxis width={44} tick={{ fontSize: 10, fill: colors.axis }} tickFormatter={formatAxisValue} />
              <ChartTooltip />
              <Legend
                content={() => (
                  <ContrastLegend
                    items={seriesPessoas.map((serie, index) => ({
                      label: serie.nome,
                      color: pessoaSeriesSwatch(colors.series, index, colors.line).stroke,
                    }))}
                  />
                )}
              />
              {seriesPessoas.map((serie, index) => {
                const tone = pessoaSeriesSwatch(colors.series, index, colors.line);
                return (
                  <Bar
                    key={serie.dataKey}
                    dataKey={serie.dataKey}
                    name={serie.nome}
                    fill={tone.fill}
                    stroke={tone.stroke}
                    strokeWidth={1}
                    isAnimationActive={false}
                    maxBarSize={40}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        )
      ) : evolucaoAno.length === 0 ? (
        <p className="fc-caption">Sem dados para o gráfico.</p>
      ) : (
        <ResponsiveContainer
          key={evolucaoAno.map(item => `${item.data}:${item.saldo}`).join('|')}
          width="100%"
          height={chartHeight}
        >
          <BarChart data={evolucaoAno} margin={{ top: 8, right: 12, left: 4, bottom: isMobile ? 40 : 8 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: isMobile ? 10 : 12, fill: colors.axis }}
              angle={isMobile ? -35 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 40 : 30}
              minTickGap={isMobile ? 8 : 24}
              interval="preserveStartEnd"
            />
            <YAxis width={44} tick={{ fontSize: 10, fill: colors.axis }} tickFormatter={formatAxisValue} />
            <ChartTooltip />
            <Bar
              dataKey="saldo"
              name="Saldo"
              fill={tomSaldoUnitario.fill}
              stroke={tomSaldoUnitario.stroke}
              isAnimationActive={false}
              maxBarSize={48}
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}

interface VolumePorTipoChartProps {
  porTipo: TotalPorGrupo[];
  porTipoEmpilhado?: GrupoEmpilhado[];
  seriesPessoas?: SeriePessoa[];
  periodo: string;
}

export function VolumePorTipoChart({
  porTipo,
  porTipoEmpilhado = [],
  seriesPessoas = [],
  periodo,
}: Readonly<VolumePorTipoChartProps>) {
  const isMobile = useIsMobile();
  const colors = useChartThemeColors();
  const chartHeight = isMobile ? 220 : 260;
  const fragmentado = seriesPessoas.length > 1 && porTipoEmpilhado.length > 0;
  const vazio = fragmentado
    ? porTipoEmpilhado.every(row => seriesPessoas.every(s => Number(row[s.dataKey] ?? 0) === 0))
    : porTipo.every(item => item.valor === 0);

  return (
    <>
      <ChartFrame
        title={`Por tipo · ${periodo}`}
        label={`Gráfico de barras com o volume em reais por tipo de transação de ${periodo}`}
        height={chartHeight}
      >
        {vazio ? (
          <p className="fc-caption">Sem dados para o gráfico.</p>
        ) : fragmentado ? (
          <ResponsiveContainer
            key={porTipoEmpilhado.map(item => `${item.chave}:${seriesPessoas.map(s => item[s.dataKey]).join(',')}`).join('|')}
            width="100%"
            height={chartHeight}
          >
            <BarChart
              data={porTipoEmpilhado}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
            >
              <XAxis type="number" tick={{ fontSize: 10, fill: colors.axis }} tickFormatter={formatAxisValue} />
              <YAxis
                type="category"
                dataKey="label"
                width={isMobile ? 88 : 108}
                tick={{ fontSize: isMobile ? 11 : 12, fill: colors.axis }}
              />
              <ChartTooltip />
              <Legend content={() => <PessoaShadeLegend seriesPessoas={seriesPessoas} />} />
              {seriesPessoas.map((serie, pessoaIndex) => (
                <Bar
                  key={serie.dataKey}
                  dataKey={serie.dataKey}
                  name={serie.nome}
                  stackId="tipo"
                  isAnimationActive={false}
                  maxBarSize={28}
                >
                  {porTipoEmpilhado.map(entry => {
                    const tone = pessoaShadeOf(colors.tipo[entry.chave] ?? pastelFromHsl(colors.line), pessoaIndex);
                    return (
                      <Cell key={`${serie.dataKey}-${entry.chave}`} fill={tone.fill} stroke={tone.stroke} strokeWidth={1} />
                    );
                  })}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer
            key={porTipo.map(item => `${item.chave}:${item.valor}`).join('|')}
            width="100%"
            height={chartHeight}
          >
            <BarChart data={porTipo} layout="vertical" margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: colors.axis }} tickFormatter={formatAxisValue} />
              <YAxis
                type="category"
                dataKey="label"
                width={isMobile ? 88 : 108}
                tick={{ fontSize: isMobile ? 11 : 12, fill: colors.axis }}
              />
              <ChartTooltip />
              <Bar dataKey="valor" name="Volume" isAnimationActive={false} maxBarSize={28}>
                {porTipo.map(entry => {
                  const swatch = colors.tipo[entry.chave];
                  return (
                    <Cell
                      key={entry.chave}
                      fill={swatch?.fill ?? colors.line}
                      stroke={swatch?.stroke ?? colors.line}
                      strokeWidth={1}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartFrame>
      <table className="sr-only">
        <caption>Volume por tipo de transação</caption>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {porTipo.map(item => (
            <tr key={item.chave}>
              <td>{item.label}</td>
              <td>{formatCurrency(item.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

interface SaidasPorFormaChartProps {
  porForma: TotalPorGrupo[];
  porFormaEmpilhado?: GrupoEmpilhado[];
  seriesPessoas?: SeriePessoa[];
  periodo: string;
}

export function SaidasPorFormaChart({
  porForma,
  porFormaEmpilhado = [],
  seriesPessoas = [],
  periodo,
}: Readonly<SaidasPorFormaChartProps>) {
  const isMobile = useIsMobile();
  const colors = useChartThemeColors();
  const chartHeight = isMobile ? 220 : 260;
  const fragmentado = seriesPessoas.length > 1 && porFormaEmpilhado.length > 0;
  const vazio = fragmentado
    ? porFormaEmpilhado.every(row => seriesPessoas.every(s => Number(row[s.dataKey] ?? 0) === 0))
    : porForma.every(item => item.valor === 0);

  return (
    <>
      <ChartFrame
        title={`Por forma de pagamento · ${periodo}`}
        label={`Gráfico de barras com saídas agrupadas por forma de pagamento de ${periodo}`}
        height={chartHeight}
      >
        {vazio ? (
          <p className="fc-caption">Sem saídas com forma de pagamento.</p>
        ) : fragmentado ? (
          <ResponsiveContainer
            key={porFormaEmpilhado.map(item => `${item.chave}:${seriesPessoas.map(s => item[s.dataKey]).join(',')}`).join('|')}
            width="100%"
            height={chartHeight}
          >
            <BarChart
              data={porFormaEmpilhado}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
            >
              <XAxis type="number" tick={{ fontSize: 10, fill: colors.axis }} tickFormatter={formatAxisValue} />
              <YAxis
                type="category"
                dataKey="label"
                width={isMobile ? 72 : 88}
                tick={{ fontSize: isMobile ? 11 : 12, fill: colors.axis }}
              />
              <ChartTooltip />
              <Legend content={() => <PessoaShadeLegend seriesPessoas={seriesPessoas} />} />
              {seriesPessoas.map((serie, pessoaIndex) => (
                <Bar
                  key={serie.dataKey}
                  dataKey={serie.dataKey}
                  name={serie.nome}
                  stackId="forma"
                  isAnimationActive={false}
                  maxBarSize={28}
                >
                  {porFormaEmpilhado.map(entry => {
                    const tone = pessoaShadeOf(colors.forma[entry.chave] ?? pastelFromHsl(colors.line), pessoaIndex);
                    return (
                      <Cell key={`${serie.dataKey}-${entry.chave}`} fill={tone.fill} stroke={tone.stroke} strokeWidth={1} />
                    );
                  })}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer
            key={porForma.map(item => `${item.chave}:${item.valor}`).join('|')}
            width="100%"
            height={chartHeight}
          >
            <BarChart data={porForma} layout="vertical" margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: colors.axis }} tickFormatter={formatAxisValue} />
              <YAxis
                type="category"
                dataKey="label"
                width={isMobile ? 72 : 88}
                tick={{ fontSize: isMobile ? 11 : 12, fill: colors.axis }}
              />
              <ChartTooltip />
              <Bar dataKey="valor" name="Saídas" isAnimationActive={false} maxBarSize={28}>
                {porForma.map(entry => {
                  const swatch = colors.forma[entry.chave];
                  return (
                    <Cell
                      key={entry.chave}
                      fill={swatch?.fill ?? colors.line}
                      stroke={swatch?.stroke ?? colors.line}
                      strokeWidth={1}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartFrame>
      <table className="sr-only">
        <caption>Saídas por forma de pagamento</caption>
        <thead>
          <tr>
            <th>Forma</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {porForma.map(item => (
            <tr key={item.chave}>
              <td>{item.label}</td>
              <td>{formatCurrency(item.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

interface ReceitasDespesasChartProps {
  receitasDespesas: { name: string; valor: number }[];
  fatias?: FatiaReceitasDespesas[];
  periodo: string;
}

export function ReceitasDespesasChart({
  receitasDespesas,
  fatias = [],
  periodo,
}: Readonly<ReceitasDespesasChartProps>) {
  const isMobile = useIsMobile();
  const colors = useChartThemeColors();
  const chartHeight = isMobile ? 240 : 300;
  const receitas = colors.receita;
  const despesas = colors.despesa;
  const fragmentado = fatias.length > 0;
  const pieData = fragmentado ? fatias.filter(item => item.valor > 0) : receitasDespesas;
  const vazio = pieData.every(item => item.valor === 0);

  const legendItems = fragmentado
    ? fatias.map(item => ({
        label: item.name,
        color: receitaDespesaSwatch(colors, item.kind, item.pessoaIndex).stroke,
      }))
    : [
        { label: 'Receitas', color: receitas.stroke },
        { label: 'Despesas', color: despesas.stroke },
      ];

  return (
    <ChartFrame
      title={`Receitas vs despesas · ${periodo}`}
      label={`Gráfico de pizza comparando receitas e despesas de ${periodo}`}
      height={chartHeight}
    >
      {vazio ? (
        <p className="fc-caption">Sem dados para o gráfico.</p>
      ) : (
        <ResponsiveContainer
          key={pieData.map(item => `${item.name}:${item.valor}`).join('|')}
          width="100%"
          height={chartHeight}
        >
          <PieChart>
            <Pie
              data={pieData}
              dataKey="valor"
              nameKey="name"
              cx="50%"
              cy={fragmentado ? '42%' : '46%'}
              outerRadius={isMobile ? 64 : 74}
              isAnimationActive={false}
            >
              {pieData.map(entry => {
                const fatia = fragmentado ? (entry as FatiaReceitasDespesas) : null;
                const swatch = fatia
                  ? receitaDespesaSwatch(colors, fatia.kind, fatia.pessoaIndex)
                  : entry.name.toLowerCase().includes('receita')
                    ? receitas
                    : despesas;
                return (
                  <Cell key={entry.name} fill={swatch.fill} stroke={swatch.stroke} strokeWidth={1} />
                );
              })}
            </Pie>
            <ChartTooltip />
            <Legend content={() => <ContrastLegend items={legendItems} />} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}

interface ReceitasDespesasAnoChartProps {
  receitasDespesasAno: ReceitasDespesasAno;
  mesesEmpilhado?: PontoAnoEmpilhado[];
  seriesAno?: { dataKey: string; nome: string; kind: 'receita' | 'despesa' }[];
  anoEmpilhado?: number;
}

export function ReceitasDespesasAnoChart({
  receitasDespesasAno,
  mesesEmpilhado = [],
  seriesAno = [],
  anoEmpilhado,
}: Readonly<ReceitasDespesasAnoChartProps>) {
  const isMobile = useIsMobile();
  const colors = useChartThemeColors();
  const chartHeight = isMobile ? 240 : 300;
  const fragmentado = seriesAno.length > 0 && mesesEmpilhado.length > 0;
  const { ano, meses } = receitasDespesasAno;
  const tituloAno = fragmentado ? (anoEmpilhado ?? ano) : ano;
  const vazio = fragmentado
    ? mesesEmpilhado.every(mes => seriesAno.every(s => Number(mes[s.dataKey] ?? 0) === 0))
    : meses.every(item => item.receitas === 0 && item.despesas === 0);
  const receitas = colors.anoReceita;
  const despesas = colors.anoDespesa;

  return (
    <ChartFrame
      title={`Receitas e despesas · ${tituloAno}`}
      label={`Gráfico de barras com receitas e despesas de cada mês de ${tituloAno}`}
      height={chartHeight}
    >
      {vazio ? (
        <p className="fc-caption">Sem dados para o gráfico.</p>
      ) : fragmentado ? (
        <ResponsiveContainer
          key={mesesEmpilhado.map(item => `${item.mes}:${seriesAno.map(s => item[s.dataKey]).join(',')}`).join('|')}
          width="100%"
          height={chartHeight}
        >
          <BarChart data={mesesEmpilhado} margin={{ top: 8, right: 12, left: 4, bottom: isMobile ? 40 : 8 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: isMobile ? 10 : 12, fill: colors.axis }}
              angle={isMobile ? -35 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 40 : 30}
              minTickGap={isMobile ? 4 : 8}
            />
            <YAxis width={44} tick={{ fontSize: 10, fill: colors.axis }} tickFormatter={formatAxisValue} />
            <ChartTooltip />
            <Legend
              content={() => (
                <ContrastLegend
                  items={seriesAno.map((serie, index) => ({
                    label: serie.nome,
                    color: receitaDespesaAnoSwatch(colors, serie.kind, Math.floor(index / 2)).stroke,
                  }))}
                />
              )}
            />
            {seriesAno.map((serie, index) => {
              const tone = receitaDespesaAnoSwatch(colors, serie.kind, Math.floor(index / 2));
              return (
                <Bar
                  key={serie.dataKey}
                  dataKey={serie.dataKey}
                  name={serie.nome}
                  stackId={serie.kind}
                  fill={tone.fill}
                  stroke={tone.stroke}
                  strokeWidth={1}
                  isAnimationActive={false}
                  maxBarSize={28}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer
          key={meses.map(item => `${item.mes}:${item.receitas}:${item.despesas}`).join('|')}
          width="100%"
          height={chartHeight}
        >
          <BarChart data={meses} margin={{ top: 8, right: 12, left: 4, bottom: isMobile ? 40 : 8 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: isMobile ? 10 : 12, fill: colors.axis }}
              angle={isMobile ? -35 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 40 : 30}
              minTickGap={isMobile ? 4 : 8}
            />
            <YAxis width={44} tick={{ fontSize: 10, fill: colors.axis }} tickFormatter={formatAxisValue} />
            <ChartTooltip />
            <Legend
              content={() => (
                <ContrastLegend
                  items={[
                    { label: 'Receitas', color: receitas.stroke },
                    { label: 'Despesas', color: despesas.stroke },
                  ]}
                />
              )}
            />
            <Bar
              dataKey="receitas"
              name="Receitas"
              fill={receitas.fill}
              stroke={receitas.stroke}
              strokeWidth={1}
              isAnimationActive={false}
              maxBarSize={32}
            />
            <Bar
              dataKey="despesas"
              name="Despesas"
              fill={despesas.fill}
              stroke={despesas.stroke}
              strokeWidth={1}
              isAnimationActive={false}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}

interface GastosCategoriaChartProps {
  porCategoria: TotalPorGrupo[];
  porCategoriaEmpilhado?: GrupoEmpilhado[];
  seriesPessoas?: SeriePessoa[];
  periodo: string;
}

export function GastosCategoriaChart({
  porCategoria,
  porCategoriaEmpilhado = [],
  seriesPessoas = [],
  periodo,
}: Readonly<GastosCategoriaChartProps>) {
  const isMobile = useIsMobile();
  const colors = useChartThemeColors();
  const fragmentado = seriesPessoas.length > 1 && porCategoriaEmpilhado.length > 0;
  const rows = fragmentado ? porCategoriaEmpilhado : porCategoria;
  const categoryHeight = heightForCategoryBars(rows.length, isMobile, fragmentado ? seriesPessoas.length : 1);

  return (
    <>
      <ChartFrame
        title={`Gastos por categoria · ${periodo}`}
        label={`Gráfico de barras com gastos agrupados por categoria de ${periodo}`}
        height={categoryHeight}
      >
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma despesa categorizada.</p>
        ) : fragmentado ? (
          <ResponsiveContainer
            key={porCategoriaEmpilhado
              .map(item => `${item.chave}:${seriesPessoas.map(s => item[s.dataKey]).join(',')}`)
              .join('|')}
            width="100%"
            height={categoryHeight}
          >
            <BarChart
              data={porCategoriaEmpilhado}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
            >
              <XAxis type="number" tick={{ fontSize: 10, fill: colors.axis }} tickFormatter={formatAxisValue} />
              <YAxis
                type="category"
                dataKey="label"
                width={isMobile ? 96 : 120}
                tick={{ fontSize: isMobile ? 11 : 12, fill: colors.axis }}
              />
              <ChartTooltip />
              <Legend content={() => <PessoaShadeLegend seriesPessoas={seriesPessoas} />} />
              {seriesPessoas.map((serie, pessoaIndex) => (
                <Bar
                  key={serie.dataKey}
                  dataKey={serie.dataKey}
                  name={serie.nome}
                  stackId="cat"
                  isAnimationActive={false}
                  maxBarSize={28}
                >
                  {porCategoriaEmpilhado.map((entry, index) => {
                    const base = pastelFromHsl(colors.series[index % colors.series.length] ?? colors.line);
                    const tone = pessoaShadeOf(base, pessoaIndex);
                    return (
                      <Cell key={`${serie.dataKey}-${entry.chave}`} fill={tone.fill} stroke={tone.stroke} strokeWidth={1} />
                    );
                  })}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer
            key={porCategoria.map(item => `${item.chave}:${item.valor}`).join('|')}
            width="100%"
            height={categoryHeight}
          >
            <BarChart data={porCategoria} layout="vertical" margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: colors.axis }} tickFormatter={formatAxisValue} />
              <YAxis
                type="category"
                dataKey="label"
                width={isMobile ? 96 : 120}
                tick={{ fontSize: isMobile ? 11 : 12, fill: colors.axis }}
              />
              <ChartTooltip />
              <Bar dataKey="valor" name="Gastos" isAnimationActive={false} maxBarSize={28}>
                {porCategoria.map((entry, index) => {
                  const swatch = pastelFromHsl(colors.series[index % colors.series.length] ?? colors.line);
                  return (
                    <Cell key={entry.chave} fill={swatch.fill} stroke={swatch.stroke} strokeWidth={1} />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartFrame>
      <table className="sr-only">
        <caption>{`Gastos por categoria · ${periodo}`}</caption>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {porCategoria.map(item => (
            <tr key={item.chave}>
              <td>{item.label}</td>
              <td>{formatCurrency(item.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
