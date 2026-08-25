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
  anoReceita: ListSwatch;
  anoDespesa: ListSwatch;
  saldoPos: ListSwatch;
  saldoNeg: ListSwatch;
  tipo: Record<string, ListSwatch>;
  forma: Record<string, ListSwatch>;
}

interface HslColor {
  h: number;
  s: number;
  l: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function wrapHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

function parseHsl(raw: string): HslColor | null {
  const match = raw.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!match) return null;
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) };
}

function formatHsl(color: HslColor): string {
  return `hsl(${Math.round(color.h)} ${Math.round(color.s)}% ${Math.round(color.l)}%)`;
}

function swatchFrom(color: HslColor): ListSwatch {
  const value = formatHsl(color);
  return { fill: value, stroke: value };
}

function token(style: CSSStyleDeclaration | null, name: string, fallback: string): string {
  const raw = style?.getPropertyValue(name).trim();
  return raw || fallback;
}

function isDarkMode(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset['finThemeMode'] === 'dark';
}

/** Paleta relativa à primária: mesma saturação/claridade, matizes distintas. */
const CHART_HUES = {
  lime: 84,
  yellow: 50,
  orange: 28,
  red: 8,
  pink: 340,
  purple: 275,
  blue: 210,
  teal: 175,
} as const;

const SERIES_HUES = [
  CHART_HUES.blue,
  CHART_HUES.purple,
  CHART_HUES.orange,
  CHART_HUES.pink,
  CHART_HUES.teal,
  CHART_HUES.yellow,
  CHART_HUES.lime,
  CHART_HUES.red,
] as const;

function relativeTone(hue: number, isDark: boolean, lightnessShift = 0): HslColor {
  return {
    h: wrapHue(hue),
    s: isDark ? 44 : 46,
    l: clamp((isDark ? 62 : 66) + lightnessShift, 28, 78),
  };
}

function buildSeries(isDark: boolean): string[] {
  return SERIES_HUES.map(hue => formatHsl(relativeTone(hue, isDark)));
}

function readChartThemeColorsFrom(style: CSSStyleDeclaration | null): ChartThemeColors {
  const dark = isDarkMode();
  const primaryRaw = token(style, '--chart-primary', token(style, '--primary', '84 59% 57%'));
  const dangerRaw = token(style, '--chart-danger', token(style, '--destructive', '8 46% 52%'));
  const mutedRaw = token(style, '--muted-foreground', dark ? '84 8% 62%' : '84 12% 38%');

  const primary = parseHsl(primaryRaw) ?? { h: 84, s: 59, l: dark ? 52 : 57 };
  const dangerBase = parseHsl(dangerRaw) ?? { h: 8, s: 46, l: 52 };
  const muted = parseHsl(mutedRaw);

  const receita = relativeTone(primary.h, dark);
  const despesa = relativeTone(dangerBase.h, dark);
  const anoReceita = relativeTone(CHART_HUES.yellow, dark, -10);
  const anoDespesa = relativeTone(CHART_HUES.pink, dark);
  const saldoPos = relativeTone(CHART_HUES.blue, dark);
  const saldoNeg = relativeTone(dangerBase.h, dark);

  const axis = muted
    ? formatHsl({
        h: muted.h,
        s: clamp(muted.s * 0.9, 10, 36),
        l: dark ? clamp(muted.l, 58, 72) : clamp(muted.l, 34, 46),
      })
    : formatHsl(relativeTone(primary.h, dark));

  return {
    line: formatHsl(saldoPos),
    success: formatHsl(receita),
    danger: formatHsl(despesa),
    series: buildSeries(dark),
    axis,
    receita: swatchFrom(receita),
    despesa: swatchFrom(despesa),
    anoReceita: swatchFrom(anoReceita),
    anoDespesa: swatchFrom(anoDespesa),
    saldoPos: swatchFrom(saldoPos),
    saldoNeg: swatchFrom(saldoNeg),
    tipo: {
      deposito: swatchFrom(relativeTone(CHART_HUES.blue, dark)),
      saque: swatchFrom(relativeTone(CHART_HUES.orange, dark)),
      transferencia: swatchFrom(relativeTone(CHART_HUES.purple, dark)),
      pagamento: swatchFrom(relativeTone(CHART_HUES.red, dark)),
    },
    forma: {
      pix: swatchFrom(relativeTone(CHART_HUES.yellow, dark)),
      credito: swatchFrom(relativeTone(CHART_HUES.pink, dark)),
      debito: swatchFrom(relativeTone(CHART_HUES.purple, dark)),
      vr_va: swatchFrom(relativeTone(CHART_HUES.teal, dark)),
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
