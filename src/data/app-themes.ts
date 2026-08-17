export type AppThemeId =
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'rose'
  | 'orange'
  | 'amber';

export interface AppThemeOption {
  id: AppThemeId;
  label: string;
  description: string;
  swatch: string;
}

/** Dez variações no padrão Esmeralda: fundo tintado, primária saturada, bordas suaves. */
export const APP_THEMES: AppThemeOption[] = [
  { id: 'emerald', label: 'Verde Esmeralda', description: 'Crescimento e metas', swatch: '#047857' },
  { id: 'teal', label: 'Teal', description: 'Confiança e clareza', swatch: '#0F766E' },
  { id: 'cyan', label: 'Ciano', description: 'Frescor e leveza', swatch: '#0E7490' },
  { id: 'sky', label: 'Azul Céu', description: 'Aberto e sereno', swatch: '#0369A1' },
  { id: 'blue', label: 'Azul', description: 'Estável e familiar', swatch: '#1D4ED8' },
  { id: 'indigo', label: 'Índigo', description: 'Profundo e moderno', swatch: '#4338CA' },
  { id: 'violet', label: 'Violeta', description: 'Criativo e distinto', swatch: '#6D28D9' },
  { id: 'rose', label: 'Rosa', description: 'Acolhedor e humano', swatch: '#BE123C' },
  { id: 'orange', label: 'Laranja', description: 'Energia e ação', swatch: '#C2410C' },
  { id: 'amber', label: 'Âmbar', description: 'Calor e otimismo', swatch: '#B45309' },
];

export type AppThemeMode = 'light' | 'dark';

export const DEFAULT_APP_THEME: AppThemeId = 'cyan';

export const DEFAULT_APP_THEME_MODE: AppThemeMode = 'light';

export const APP_THEME_IDS = new Set<AppThemeId>(APP_THEMES.map(theme => theme.id));

/** Temas removidos ou renomeados — mantém perfis antigos funcionando. */
const LEGACY_THEME_MAP: Record<string, AppThemeId> = {
  slate: 'blue',
  dark: 'indigo',
  stripe: 'indigo',
  spotify: 'emerald',
  notion: 'amber',
  github: 'emerald',
  slack: 'violet',
  linear: 'indigo',
  figma: 'orange',
  nubank: 'violet',
  mercadolivre: 'amber',
  discord: 'indigo',
};

export function isAppThemeId(value: unknown): value is AppThemeId {
  return typeof value === 'string' && APP_THEME_IDS.has(value as AppThemeId);
}

export function resolveAppTheme(value: unknown): AppThemeId {
  if (isAppThemeId(value)) return value;
  if (typeof value === 'string' && value in LEGACY_THEME_MAP) {
    return LEGACY_THEME_MAP[value];
  }
  return DEFAULT_APP_THEME;
}

export function resolveAppThemeMode(value: unknown): AppThemeMode {
  return value === 'dark' ? 'dark' : DEFAULT_APP_THEME_MODE;
}
