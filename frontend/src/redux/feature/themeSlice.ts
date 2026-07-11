import { createSlice } from '@reduxjs/toolkit';

import type { RootState } from '../store/store';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'rlus-theme';

// stored preference wins; otherwise follow the OS setting
function initialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface ThemeState {
  mode: ThemeMode;
}

const initialState: ThemeState = { mode: initialMode() };

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    themeToggled(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
    },
  },
});

export const { themeToggled } = themeSlice.actions;

export const selectThemeMode = (state: RootState) => state.theme.mode;
