import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { fetchProfile, saveProfile } from '@/app/services/profiles';
import { DEFAULT_APP_THEME, DEFAULT_APP_THEME_MODE, type AppThemeId, type AppThemeMode } from '@/data/app-themes';
import {
  createDefaultDashboardLayout,
  DEFAULT_EXTRATO_LIMITE,
  DEFAULT_TRANSACOES_PAGE_SIZE,
  normalizeExtratoLimite,
  normalizeColStart,
  type DashboardProfile,
  type DashboardWidget,
  type LayoutGroupDefinition,
  type LayoutRow,
  type WidgetCols,
  type WidgetColStart,
  type WidgetId,
} from '@/data/dashboard-profile';
import { applyAppAppearance } from '@/lib/app-theme';
import {
  layoutPayloadFromSegments,
  migrateLayoutFromWidgets,
  reconcileLayoutAfterWidgetColsChange,
  resolveDashboardLayout,
} from '@/lib/dashboard-layout';
import { FILTROS_VAZIOS, type TransacoesFiltros } from '@/lib/transacao-filters';

interface DashboardState {
  usuarioId: string | null;
  theme: AppThemeId;
  themeMode: AppThemeMode;
  widgets: DashboardWidget[];
  layoutRows: LayoutRow[];
  layoutGroups: LayoutGroupDefinition[];
  metaEconomia: number;
  alertaGastos: number;
  transacoesPageSize: number;
  transacoesFiltros: TransacoesFiltros;
  extratoLimite: number;
  blocoNotas: string;
}

const defaultLayout = createDefaultDashboardLayout();

const initialState: DashboardState = {
  usuarioId: null,
  theme: DEFAULT_APP_THEME,
  themeMode: DEFAULT_APP_THEME_MODE,
  widgets: defaultLayout.widgets,
  layoutRows: defaultLayout.layoutRows,
  layoutGroups: defaultLayout.layoutGroups,
  metaEconomia: 800,
  alertaGastos: 2500,
  transacoesPageSize: DEFAULT_TRANSACOES_PAGE_SIZE,
  transacoesFiltros: { ...FILTROS_VAZIOS },
  extratoLimite: DEFAULT_EXTRATO_LIMITE,
  blocoNotas: '',
};

function persist(state: DashboardState) {
  if (!state.usuarioId) return;
  void saveProfile({
    id: state.usuarioId,
    usuarioId: state.usuarioId,
    theme: state.theme,
    themeMode: state.themeMode,
    widgets: state.widgets,
    layoutRows: state.layoutRows,
    layoutGroups: state.layoutGroups,
    metaEconomia: state.metaEconomia,
    alertaGastos: state.alertaGastos,
    transacoesPageSize: state.transacoesPageSize,
    transacoesFiltros: state.transacoesFiltros,
    extratoLimite: state.extratoLimite,
    blocoNotas: state.blocoNotas,
  });
}

function applyProfile(state: DashboardState, profile: DashboardProfile) {
  state.usuarioId = profile.usuarioId;
  state.theme = profile.theme;
  state.themeMode = profile.themeMode;
  state.widgets = Array.isArray(profile.widgets) ? profile.widgets : defaultLayout.widgets;
  state.layoutRows = Array.isArray(profile.layoutRows)
    ? profile.layoutRows
    : migrateLayoutFromWidgets(state.widgets).layoutRows;
  state.layoutGroups = Array.isArray(profile.layoutGroups)
    ? profile.layoutGroups
    : migrateLayoutFromWidgets(state.widgets).layoutGroups;
  state.metaEconomia = profile.metaEconomia;
  state.alertaGastos = profile.alertaGastos;
  state.transacoesPageSize = profile.transacoesPageSize;
  state.transacoesFiltros = profile.transacoesFiltros;
  state.extratoLimite = profile.extratoLimite;
  state.blocoNotas = profile.blocoNotas ?? '';
  applyAppAppearance(profile.theme, profile.themeMode);
}

export const loadDashboardProfile = createAsyncThunk('dashboard/loadProfile', async (usuarioId: string) => {
  return fetchProfile(usuarioId);
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    hydrateDashboard(state, action: PayloadAction<DashboardProfile>) {
      applyProfile(state, action.payload);
    },
    setTheme(state, action: PayloadAction<AppThemeId>) {
      state.theme = action.payload;
      applyAppAppearance(action.payload, state.themeMode);
      persist(state);
    },
    setThemeMode(state, action: PayloadAction<AppThemeMode>) {
      state.themeMode = action.payload;
      applyAppAppearance(state.theme, action.payload);
      persist(state);
    },
    toggleWidget(state, action: PayloadAction<WidgetId>) {
      const widget = state.widgets.find(item => item.id === action.payload);
      if (widget) {
        widget.visible = !widget.visible;
        persist(state);
      }
    },
    setWidgetCols(state, action: PayloadAction<{ id: WidgetId; cols: WidgetCols }>) {
      const widget = state.widgets.find(item => item.id === action.payload.id);
      if (!widget) return;
      widget.cols = action.payload.cols;
      widget.colStart = normalizeColStart(action.payload.cols, widget.colStart);

      const reconciled = reconcileLayoutAfterWidgetColsChange(
        state.widgets,
        state.layoutRows,
        state.layoutGroups,
        action.payload.id,
      );
      state.layoutRows = reconciled.layoutRows;
      state.layoutGroups = reconciled.layoutGroups;

      const segments = resolveDashboardLayout(state.widgets, state.layoutRows, state.layoutGroups, {
        includeHidden: true,
      });
      state.widgets = layoutPayloadFromSegments(segments).widgets;
      persist(state);
    },
    setWidgetColStart(state, action: PayloadAction<{ id: WidgetId; colStart: WidgetColStart }>) {
      const widget = state.widgets.find(item => item.id === action.payload.id);
      if (!widget) return;
      widget.colStart = normalizeColStart(widget.cols, action.payload.colStart);
      persist(state);
    },
    moveWidget(state, action: PayloadAction<{ from: number; to: number }>) {
      const { from, to } = action.payload;
      if (from === to || from < 0 || to < 0 || from >= state.widgets.length || to >= state.widgets.length) return;
      const [item] = state.widgets.splice(from, 1);
      state.widgets.splice(to, 0, item);
      persist(state);
    },
    setDashboardLayout(
      state,
      action: PayloadAction<{
        widgets: DashboardWidget[];
        layoutRows: LayoutRow[];
        layoutGroups: LayoutGroupDefinition[];
      }>,
    ) {
      if ((!action.payload.widgets || action.payload.widgets.length === 0) && state.widgets.length > 0) {
        return;
      }
      state.widgets = action.payload.widgets;
      state.layoutRows = action.payload.layoutRows;
      state.layoutGroups = action.payload.layoutGroups;
      persist(state);
    },
    setWidgetLayout(state, action: PayloadAction<DashboardWidget[]>) {
      state.widgets = action.payload;
      const migrated = migrateLayoutFromWidgets(action.payload);
      state.layoutRows = migrated.layoutRows;
      state.layoutGroups = migrated.layoutGroups;
      persist(state);
    },
    setMetaEconomia(state, action: PayloadAction<number>) {
      state.metaEconomia = action.payload;
      persist(state);
    },
    setAlertaGastos(state, action: PayloadAction<number>) {
      state.alertaGastos = action.payload;
      persist(state);
    },
    setExtratoLimite(state, action: PayloadAction<number>) {
      state.extratoLimite = normalizeExtratoLimite(action.payload);
      persist(state);
    },
    setBlocoNotas(state, action: PayloadAction<string>) {
      state.blocoNotas = action.payload;
      persist(state);
    },
    syncTransacoesPageSize(state, action: PayloadAction<number>) {
      state.transacoesPageSize = action.payload;
    },
    syncTransacoesFiltros(state, action: PayloadAction<TransacoesFiltros>) {
      state.transacoesFiltros = action.payload;
    },
    resetDashboard(state) {
      if (!state.usuarioId) return { ...initialState };
      const defaultDashboard = createDefaultDashboardLayout();
      const next = {
        ...initialState,
        usuarioId: state.usuarioId,
        theme: state.theme,
        themeMode: state.themeMode,
        transacoesPageSize: state.transacoesPageSize,
        transacoesFiltros: state.transacoesFiltros,
        extratoLimite: state.extratoLimite,
        blocoNotas: state.blocoNotas,
        widgets: defaultDashboard.widgets,
        layoutRows: defaultDashboard.layoutRows,
        layoutGroups: defaultDashboard.layoutGroups,
      };
      persist(next);
      return next;
    },
  },
  extraReducers: builder => {
    builder.addCase(loadDashboardProfile.fulfilled, (state, action) => {
      applyProfile(state, action.payload);
      persist(state);
    });
  },
});

export const {
  hydrateDashboard,
  setTheme,
  setThemeMode,
  toggleWidget,
  setWidgetCols,
  setWidgetColStart,
  moveWidget,
  setDashboardLayout,
  setWidgetLayout,
  setMetaEconomia,
  setAlertaGastos,
  setExtratoLimite,
  setBlocoNotas,
  syncTransacoesPageSize,
  syncTransacoesFiltros,
  resetDashboard,
} = dashboardSlice.actions;
export const dashboardReducer = dashboardSlice.reducer;
export type { WidgetColStart, WidgetCols, WidgetId };
