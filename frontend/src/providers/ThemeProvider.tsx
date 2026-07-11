import { ConfigProvider, theme as antdTheme } from 'antd';
import { useEffect } from 'react';

import { GREPSR_BRAND_COLOR, GREPSR_BRAND_FONT } from '@/constants';
import { selectThemeMode, THEME_STORAGE_KEY } from '@/redux/feature/themeSlice';
import { useAppSelector } from '@/redux/store/hooks';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useAppSelector(selectThemeMode);

  useEffect(() => {
    // stylesheets read the brand color as var(--brand); constants.ts stays the single source
    document.documentElement.style.setProperty('--brand', GREPSR_BRAND_COLOR);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    // keeps native UI (scrollbars, form controls) in sync with the app theme
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  return (
    <ConfigProvider
      theme={{
        // emit tokens as --ant-* CSS variables so CSS Modules stay theme-aware
        cssVar: {},
        algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          fontFamily: GREPSR_BRAND_FONT,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export default ThemeProvider;
