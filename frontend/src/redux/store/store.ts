import { configureStore } from '@reduxjs/toolkit';

import { rateLimitSlice } from '../feature/rateLimitSlice';
import { themeSlice } from '../feature/themeSlice';
import { api } from './api';

export const store = configureStore({
  reducer: {
    rateLimit: rateLimitSlice.reducer,
    theme: themeSlice.reducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
