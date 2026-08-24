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
  const match = raw.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!match) return null;
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) };
}

function formatHsl(color: HslColor): string {
  return `hsl(${Math.round(color.h)} ${Math.round(color.s)}% ${Math.round(color.l)}%)`;
}

function isDarkMode(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset['finThemeMode'] === 'dark';
}

function tuneForMode(base: HslColor, isDark: boolean, lightnessOffset = 0, saturationScale = 1): HslColor {
  const saturation = clamp(base.s * saturationScale, isDark ? 48 : 55, 92);
  const lightness = isDark
    ? clamp(base.l + 10 + lightnessOffset, 38, 72)
    : clamp(base.l + lightnessOffset, 24, 48);

  return { h: base.h, s: saturation, l: lightness };
}

function buildHarmoniousSeries(base: HslColor, isDark: boolean): string[] {
  const tuned = tuneForMode(base, isDark);

  const steps: Array<{ hueOffset: number; satScale: number; lightOffset: number }> = [
    { hueOffset: 0, satScale: 1, lightOffset: 0 },
    { hueOffset: -18, satScale: 0.92, lightOffset: isDark ? 10 : -6 },
    { hueOffset: 18, satScale: 0.9, lightOffset: isDark ? 14 : -10 },
    { hueOffset: -32, satScale: 0.82, lightOffset: isDark ? 6 : 4 },
    { hueOffset: 32, satScale: 0.84, lightOffset: isDark ? 18 : -14 },
    { hueOffset: 0, satScale: 0.72, lightOffset: isDark ? 22 : 8 },
    { hueOffset: -48, satScale: 0.78, lightOffset: isDark ? 2 : -2 },
    { hueOffset: 48, satScale: 0.76, lightOffset: isDark ? 20 : 6 },
  ];

  return steps.map(step => {
    const color = tuneForMode(
      {
        h: wrapHue(tuned.h + step.hueOffset),
        s: tuned.s,
        l: tuned.l,
      },
      isDark,
      step.lightOffset,
      step.satScale,
    );
    return formatHsl(color);
  });
}

function buildSemanticPair(base: HslColor, isDark: boolean): { success: string; danger: string } {
  const tuned = tuneForMode(base, isDark);

  const success = formatHsl(
    tuneForMode(
      { h: wrapHue(tuned.h - 26), s: tuned.s * 0.9, l: tuned.l },
      isDark,
      isDark ? 4 : -2,
      0.95,
    ),
  );

  const danger = formatHsl(
    tuneForMode(
      { h: wrapHue(tuned.h + 148), s: tuned.s * 0.88, l: tuned.l },
      isDark,
      isDark ? 2 : -4,
      0.92,
    ),
  );

  return { success, danger };
}

const FORMA_LIGHT: Record<string, ListSwatch> = {
  pix: { fill: 'hsl(214 90% 93%)', stroke: 'hsl(217 80% 38%)' },
  debito: { fill: 'hsl(45 96% 88%)', stroke: 'hsl(38 90% 32%)' },
  credito: { fill: 'hsl(24 95% 90%)', stroke: 'hsl(20 90% 38%)' },
  vr_va: { fill: 'hsl(270 70% 93%)', stroke: 'hsl(270 55% 40%)' },
};

const FORMA_DARK: Record<string, ListSwatch> = {
  pix: { fill: 'hsl(217 80% 50% / 0.22)', stroke: 'hsl(214 90% 78%)' },
  debito: { fill: 'hsl(45 90% 50% / 0.22)', stroke: 'hsl(45 90% 72%)' },
  credito: { fill: 'hsl(24 90% 50% / 0.22)', stroke: 'hsl(24 90% 72%)' },
  vr_va: { fill: 'hsl(270 60% 50% / 0.24)', stroke: 'hsl(270 70% 80%)' },
};

function tokenHsl(style: CSSStyleDeclaration, name: string, fallback: string): string {
  const raw = style.getPropertyValue(name).trim();
  return raw ? `hsl(${raw})` : fallback;
}

function tokenHslAlpha(style: CSSStyleDeclaration, name: string, alpha: number, fallback: string): string {
  const raw = style.getPropertyValue(name).trim();
  return raw ? `hsl(${raw} / ${alpha})` : fallback;
}

type ChartThemeCore = Omit<ChartThemeColors, 'tipo' | 'forma'>;

function listColors(
  style: CSSStyleDeclaration | null,
  isDark: boolean,
  base: ChartThemeCore,
): Pick<ChartThemeColors, 'tipo' | 'forma'> {
  const success = style ? tokenHsl(style, '--success', base.success) : 'hsl(152 69% 40%)';
  const destructive = style ? tokenHsl(style, '--destructive', base.danger) : 'hsl(0 72% 51%)';
  const primary = style ? tokenHsl(style, '--primary', base.line) : 'hsl(160 84% 30%)';
  const accentFg = style ? tokenHsl(style, '--accent-foreground', base.line) : 'hsl(160 84% 24%)';

  return {
    tipo: {
      deposito: {
        fill: style ? tokenHslAlpha(style, '--success', 0.14, 'hsl(152 69% 40% / 0.14)') : 'hsl(152 69% 40% / 0.14)',
        stroke: success,
      },
      pagamento: {
        fill: style ? tokenHslAlpha(style, '--destructive', 0.14, 'hsl(0 72% 51% / 0.14)') : 'hsl(0 72% 51% / 0.14)',
        stroke: destructive,
      },
      saque: {
        fill: style ? tokenHslAlpha(style, '--accent', 0.55, 'hsl(152 76% 90% / 0.55)') : 'hsl(152 76% 90% / 0.55)',
        stroke: accentFg,
      },
      transferencia: {
        fill: style ? tokenHslAlpha(style, '--primary', 0.14, 'hsl(160 84% 30% / 0.14)') : 'hsl(160 84% 30% / 0.14)',
        stroke: primary,
      },
    },
    forma: isDark ? FORMA_DARK : FORMA_LIGHT,
  };
}

function buildFromPrimary(primaryRaw: string, mutedRaw: string, isDark: boolean): ChartThemeCore {
  const base = parseHsl(primaryRaw) ?? { h: 160, s: 84, l: isDark ? 42 : 30 };
  const line = formatHsl(tuneForMode(base, isDark));
  const { success, danger } = buildSemanticPair(base, isDark);
  const series = buildHarmoniousSeries(base, isDark);
  const muted = parseHsl(mutedRaw);
  const axis = muted
    ? formatHsl(tuneForMode(muted, isDark, 0, 0.85))
    : formatHsl({ h: base.h, s: clamp(base.s * 0.25, 12, 35), l: isDark ? 62 : 42 });

  return { line, success, danger, series, axis };
}

const FALLBACK_CORE = buildFromPrimary('160 84% 30%', '160 10% 40%', false);
const FALLBACK: ChartThemeColors = {
  ...FALLBACK_CORE,
  ...listColors(null, false, FALLBACK_CORE),
};

export function readChartThemeColors(): ChartThemeColors {
  if (typeof document === 'undefined') return FALLBACK;

  const style = getComputedStyle(document.documentElement);
  const primary =
    style.getPropertyValue('--chart-primary').trim() || style.getPropertyValue('--primary').trim();
  const muted = style.getPropertyValue('--muted-foreground').trim();
  const isDark = isDarkMode();
  const core = buildFromPrimary(primary, muted, isDark);

  return { ...core, ...listColors(style, isDark, core) };
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
