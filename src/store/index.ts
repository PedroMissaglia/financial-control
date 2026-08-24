import { configureStore } from '@reduxjs/toolkit';

import { authReducer } from '@/store/slices/auth-slice';
import { contaConjuntaReducer } from '@/store/slices/conta-conjunta-slice';
import { dashboardReducer } from '@/store/slices/dashboard-slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    contaConjunta: contaConjuntaReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
