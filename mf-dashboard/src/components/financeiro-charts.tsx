import { useEffect, useState, type ReactNode } from 'react';
import { Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { PontoSaldo, TotalPorGrupo } from '@/data/analises';
import { useChartThemeColors } from '@/lib/chart-theme';
import { formatCurrency } from '@/lib/utils';

function formatTooltipValue(value: unknown) {
  return typeof value === 'number' ? formatCurrency(value) : String(value ?? '');
}

function formatAxisValue(value: number) {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
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

interface EvolucaoSaldoChartProps {
  evolucao: PontoSaldo[];
}

export function EvolucaoSaldoChart({ evolucao }: Readonly<EvolucaoSaldoChartProps>) {
  const isMobile = useIsMobile();
  const colors = useChartThemeColors();
  const chartHeight = isMobile ? 220 : 280;

  return (
    <ChartFrame
      title="Evolução do saldo"
      label="Gráfico de linha com a evolução do saldo ao longo do tempo"
      height={chartHeight}
    >
      {evolucao.length === 0 ? (
        <p className="fc-caption">Sem dados para o gráfico.</p>
      ) : (
        <ResponsiveContainer
          key={evolucao.map(item => `${item.data}:${item.saldo}`).join('|')}
          width="100%"
          height={chartHeight}
        >
          <LineChart data={evolucao} margin={{ top: 8, right: 12, left: 4, bottom: isMobile ? 40 : 8 }}>
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
            <Tooltip formatter={formatTooltipValue} />
            <Line
              type="monotone"
              dataKey="saldo"
              stroke={colors.line}
              strokeWidth={2}
              dot={{ r: 3, fill: colors.line, stroke: colors.line }}
              name="Saldo"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}

interface ReceitasDespesasChartProps {
  receitasDespesas: { name: string; valor: number }[];
}

export function ReceitasDespesasChart({ receitasDespesas }: Readonly<ReceitasDespesasChartProps>) {
  const isMobile = useIsMobile();
  const colors = useChartThemeColors();
  const chartHeight = isMobile ? 220 : 280;

  return (
    <ChartFrame
      title="Receitas vs despesas"
      label="Gráfico de pizza comparando receitas e despesas"
      height={chartHeight}
    >
      {receitasDespesas.every(item => item.valor === 0) ? (
        <p className="fc-caption">Sem dados para o gráfico.</p>
      ) : (
        <ResponsiveContainer
          key={receitasDespesas.map(item => `${item.name}:${item.valor}`).join('|')}
          width="100%"
          height={chartHeight}
        >
          <PieChart>
            <Pie
              data={receitasDespesas}
              dataKey="valor"
              nameKey="name"
              cx="50%"
              cy="46%"
              outerRadius={isMobile ? 68 : 78}
              isAnimationActive={false}
            >
              {receitasDespesas.map(entry => (
                <Cell
                  key={entry.name}
                  fill={entry.name.toLowerCase().includes('receita') ? colors.success : colors.danger}
                />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltipValue} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}

interface GastosCategoriaChartProps {
  porCategoria: TotalPorGrupo[];
}

export function GastosCategoriaChart({ porCategoria }: Readonly<GastosCategoriaChartProps>) {
  const isMobile = useIsMobile();
  const colors = useChartThemeColors();
  const categoryHeight = isMobile ? 260 : 320;

  return (
    <>
      <ChartFrame
        title="Gastos por categoria"
        label="Gráfico de pizza com gastos agrupados por categoria"
        height={categoryHeight}
      >
        {porCategoria.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma despesa categorizada.</p>
        ) : (
          <ResponsiveContainer
            key={porCategoria.map(item => `${item.chave}:${item.valor}`).join('|')}
            width="100%"
            height={categoryHeight}
          >
            <PieChart>
              <Pie
                data={porCategoria}
                dataKey="valor"
                nameKey="label"
                cx="50%"
                cy="42%"
                innerRadius={isMobile ? 40 : 50}
                outerRadius={isMobile ? 72 : 86}
                isAnimationActive={false}
              >
                {porCategoria.map((entry, index) => (
                  <Cell key={entry.chave} fill={colors.series[index % colors.series.length]} />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltipValue} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartFrame>
      <table className="sr-only">
        <caption>Gastos por categoria</caption>
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
