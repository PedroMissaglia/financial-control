import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { autenticar } from '@/app/services/usuarios';
import type { UsuarioPublico } from '@/data/usuarios';
import { logoutRemote } from '@/lib/api-client';
import { clearPersistedUsuario, persistUsuario, readStoredUsuario } from '@/lib/auth-session';

interface AuthState {
  usuario: UsuarioPublico | null;
  loading: boolean;
}

const initialState: AuthState = {
  usuario: null,
  loading: true,
};

export const loginThunk = createAsyncThunk('auth/login', async ({ email, senha }: { email: string; senha: string }) => {
  const result = await autenticar(email, senha);

  if (!result.success || !result.data) {
    throw new Error(result.message ?? 'Não foi possível autenticar');
  }

  persistUsuario(result.data);
  return result.data;
});

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await logoutRemote();
  clearPersistedUsuario();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateFromStorage(state) {
      const usuario = readStoredUsuario();
      state.usuario = usuario;
      state.loading = false;
    },
    logout(state) {
      state.usuario = null;
      state.loading = false;
      clearPersistedUsuario();
    },
  },
  extraReducers: builder => {
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.usuario = action.payload;
      state.loading = false;
    });
    builder.addCase(logoutThunk.fulfilled, state => {
      state.loading = false;
    });
    builder.addCase(logoutThunk.rejected, state => {
      state.loading = false;
    });
  },
});

export const { hydrateFromStorage, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
