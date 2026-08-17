import {
  type AppThemeId,
  type AppThemeMode,
  resolveAppTheme as resolveThemeId,
  resolveAppThemeMode,
} from '@/data/app-themes';

export const FIN_THEME_CHANGED = 'fincontrol:theme-changed';

export interface FinThemeChangedDetail {
  theme: AppThemeId;
  themeMode: AppThemeMode;
}

export function applyAppAppearance(theme: AppThemeId, themeMode: AppThemeMode = 'light'): void {
  if (typeof document === 'undefined') return;

  document.documentElement.dataset['finTheme'] = theme;

  if (themeMode === 'dark') {
    document.documentElement.dataset['finThemeMode'] = 'dark';
  } else {
    delete document.documentElement.dataset['finThemeMode'];
  }

  window.dispatchEvent(
    new CustomEvent<FinThemeChangedDetail>(FIN_THEME_CHANGED, { detail: { theme, themeMode } }),
  );
}

export function resolveAppTheme(value: unknown): AppThemeId {
  return resolveThemeId(value);
}

export { type AppThemeMode, resolveAppThemeMode };
