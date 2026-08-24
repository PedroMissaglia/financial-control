import { useEffect, useState } from 'react';

const FIN_THEME_CHANGED = 'fincontrol:theme-changed';

export interface ListSwatch {
  fill: string;
  stroke: string;
}

export interface ChartThemeColors {
  line: string;
  success: string;
  danger: string;
  series: string[];
  axis: string;
  receita: ListSwatch;
  despesa: ListSwatch;
  saldoPos: ListSwatch;
  saldoNeg: ListSwatch;
  tipo: Record<string, ListSwatch>;
  forma: Record<string, ListSwatch>;
}

const FALLBACK_RAW = {
  receita: '205 55% 40%',
  despesa: '8 72% 58%',
  saldoPos: '205 55% 40%',
  saldoNeg: '8 72% 58%',
  axis: '80 10% 38%',
  deposito: '205 55% 40%',
  saque: '19 70% 46%',
  transferencia: '46 68% 50%',
  pagamento: '8 72% 58%',
  pix: '38 70% 48%',
  credito: '350 68% 52%',
  debito: '325 58% 42%',
  vrVa: '54 68% 50%',
};

function hsl(raw: string): string {
  return `hsl(${raw})`;
}

function swatch(raw: string): ListSwatch {
  const color = hsl(raw);
  return { fill: color, stroke: color };
}

function token(style: CSSStyleDeclaration | null, name: string, fallback: string): string {
  const raw = style?.getPropertyValue(name).trim();
  return raw || fallback;
}

function isDarkMode(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset['finThemeMode'] === 'dark';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Mesma matiz, menos saturação e brilho — evita neon no fundo quase preto. */
function softenForDark(raw: string): string {
  const parts = /^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/.exec(raw.trim());
  if (!parts) return raw;
  const saturation = Math.round(clamp(Number(parts[2]) * 0.72, 42, 56));
  const lightness = Math.round(clamp(Number(parts[3]) * 0.9, 40, 52));
  return `${parts[1]} ${saturation}% ${lightness}%`;
}

function readChartThemeColorsFrom(style: CSSStyleDeclaration | null): ChartThemeColors {
  const dark = isDarkMode();
  const take = (name: string, fallback: string) => {
    const raw = token(style, name, fallback);
    return dark ? softenForDark(raw) : raw;
  };

  const receita = take('--chart-receita', FALLBACK_RAW.receita);
  const despesa = take('--chart-despesa', FALLBACK_RAW.despesa);
  const saldoPos = take('--chart-saldo-positivo', FALLBACK_RAW.saldoPos);
  const saldoNeg = take('--chart-saldo-negativo', FALLBACK_RAW.saldoNeg);
  const muted = token(style, '--muted-foreground', FALLBACK_RAW.axis);
  const deposito = take('--tipo-deposito', FALLBACK_RAW.deposito);
  const saque = take('--tipo-saque', FALLBACK_RAW.saque);
  const transferencia = take('--tipo-transferencia', FALLBACK_RAW.transferencia);
  const pagamento = take('--tipo-pagamento', FALLBACK_RAW.pagamento);
  const pix = take('--forma-pix', FALLBACK_RAW.pix);
  const credito = take('--forma-credito', FALLBACK_RAW.credito);
  const debito = take('--forma-debito', FALLBACK_RAW.debito);
  const vrVa = take('--forma-vr-va', FALLBACK_RAW.vrVa);

  return {
    line: hsl(saldoPos),
    success: hsl(saldoPos),
    danger: hsl(saldoNeg),
    series: [receita, despesa, pix, transferencia, credito, debito, vrVa, saque].map(hsl),
    axis: hsl(dark ? '42 8% 62%' : muted),
    receita: swatch(receita),
    despesa: swatch(despesa),
    saldoPos: swatch(saldoPos),
    saldoNeg: swatch(saldoNeg),
    tipo: {
      deposito: swatch(deposito),
      saque: swatch(saque),
      transferencia: swatch(transferencia),
      pagamento: swatch(pagamento),
    },
    forma: {
      pix: swatch(pix),
      credito: swatch(credito),
      debito: swatch(debito),
      vr_va: swatch(vrVa),
    },
  };
}

const FALLBACK = readChartThemeColorsFrom(null);

export function readChartThemeColors(): ChartThemeColors {
  if (typeof document === 'undefined') return FALLBACK;
  return readChartThemeColorsFrom(getComputedStyle(document.documentElement));
}

export function useChartThemeColors(): ChartThemeColors {
  const [colors, setColors] = useState(FALLBACK);

  useEffect(() => {
    const update = () => setColors(readChartThemeColors());
    update();
    window.addEventListener(FIN_THEME_CHANGED, update);
    return () => window.removeEventListener(FIN_THEME_CHANGED, update);
  }, []);

  return colors;
}
