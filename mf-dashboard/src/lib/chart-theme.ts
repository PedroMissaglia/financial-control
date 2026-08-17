import { useEffect, useState } from 'react';

const FIN_THEME_CHANGED = 'fincontrol:theme-changed';

export interface ChartThemeColors {
  line: string;
  success: string;
  danger: string;
  series: string[];
  axis: string;
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

function buildFromPrimary(primaryRaw: string, mutedRaw: string, isDark: boolean): ChartThemeColors {
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

const FALLBACK = buildFromPrimary('160 84% 30%', '160 10% 40%', false);

export function readChartThemeColors(): ChartThemeColors {
  if (typeof document === 'undefined') return FALLBACK;

  const style = getComputedStyle(document.documentElement);
  const primary =
    style.getPropertyValue('--chart-primary').trim() || style.getPropertyValue('--primary').trim();
  const muted = style.getPropertyValue('--muted-foreground').trim();

  return buildFromPrimary(primary, muted, isDarkMode());
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
