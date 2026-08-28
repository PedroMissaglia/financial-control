import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { fetchContaConjunta } from '@/app/services/conta-conjunta';
import { fetchProfile } from '@/app/services/profiles';
import {
  CONTA_CONJUNTA_VAZIA,
  type ContaConjuntaConvite,
  type ContaConjuntaParceiro,
  type ContaConjuntaStatus,
  type ContaConjuntaView,
  type VisaoFinanceira,
  VISAO_STORAGE_KEY,
} from '@/data/conta-conjunta';

export interface ParceiroMeta {
  metaEconomia: number;
  alertaGastos: number;
  blocoNotas: string;
}

interface ContaConjuntaState {
  status: ContaConjuntaStatus;
  parceiro: ContaConjuntaParceiro | null;
  convite: ContaConjuntaConvite | null;
  visao: VisaoFinanceira;
  parceiroMeta: ParceiroMeta | null;
  loading: boolean;
}

function readStoredVisao(): VisaoFinanceira {
  if (typeof window === 'undefined') return 'eu';
  const stored = sessionStorage.getItem(VISAO_STORAGE_KEY);
  if (stored === 'parceiro' || stored === 'conjunto' || stored === 'eu') return stored;
  return 'eu';
}

function persistVisao(visao: VisaoFinanceira) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(VISAO_STORAGE_KEY, visao);
}

const initialState: ContaConjuntaState = {
  ...CONTA_CONJUNTA_VAZIA,
  visao: 'eu',
  parceiroMeta: null,
  loading: true,
};

function applyView(state: ContaConjuntaState, view: ContaConjuntaView) {
  state.status = view.status;
  state.parceiro = view.parceiro;
  state.convite = view.convite;
  if (view.status !== 'ativa') {
    state.visao = 'eu';
    state.parceiroMeta = null;
    persistVisao('eu');
  }
}

export const loadContaConjunta = createAsyncThunk('contaConjunta/load', async () => {
  const result = await fetchContaConjunta();
  const view = result.data ?? CONTA_CONJUNTA_VAZIA;
  let parceiroMeta: ParceiroMeta | null = null;
  if (view.status === 'ativa' && view.parceiro) {
    const profile = await fetchProfile(view.parceiro.id);
    parceiroMeta = {
      metaEconomia: profile.metaEconomia,
      alertaGastos: profile.alertaGastos,
      blocoNotas: profile.blocoNotas ?? '',
    };
  }
  return { view, parceiroMeta };
});

const contaConjuntaSlice = createSlice({
  name: 'contaConjunta',
  initialState,
  reducers: {
    hydrateVisao(state) {
      const stored = readStoredVisao();
      state.visao = state.status === 'ativa' ? stored : 'eu';
      state.loading = false;
    },
    setVisao(state, action: PayloadAction<VisaoFinanceira>) {
      if (state.status !== 'ativa' && action.payload !== 'eu') return;
      state.visao = action.payload;
      persistVisao(action.payload);
    },
    applyContaConjuntaView(state, action: PayloadAction<ContaConjuntaView>) {
      applyView(state, action.payload);
    },
    setParceiroBlocoNotas(state, action: PayloadAction<string>) {
      if (!state.parceiroMeta) {
        state.parceiroMeta = { metaEconomia: 0, alertaGastos: 0, blocoNotas: action.payload };
        return;
      }
      state.parceiroMeta.blocoNotas = action.payload;
    },
    resetContaConjunta() {
      persistVisao('eu');
      return { ...initialState, loading: false };
    },
  },
  extraReducers: builder => {
    builder.addCase(loadContaConjunta.pending, state => {
      if (state.status === 'nenhuma' && !state.parceiro && !state.convite) {
        state.loading = true;
      }
    });
    builder.addCase(loadContaConjunta.fulfilled, (state, action) => {
      applyView(state, action.payload.view);
      state.parceiroMeta = action.payload.parceiroMeta;
      if (state.status === 'ativa') {
        const stored = readStoredVisao();
        state.visao = stored;
      }
      state.loading = false;
    });
    builder.addCase(loadContaConjunta.rejected, state => {
      state.loading = false;
    });
  },
});

export const { hydrateVisao, setVisao, applyContaConjuntaView, setParceiroBlocoNotas, resetContaConjunta } =
  contaConjuntaSlice.actions;
export const contaConjuntaReducer = contaConjuntaSlice.reducer;
