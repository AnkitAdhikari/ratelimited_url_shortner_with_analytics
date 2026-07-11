import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd';
import { useEffect } from 'react';

import { GREPSR_BRAND_COLOR, GREPSR_BRAND_FONT } from '@/constants';
import { selectThemeMode, THEME_STORAGE_KEY } from '@/redux/feature/themeSlice';
import { useAppSelector } from '@/redux/store/hooks';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useAppSelector(selectThemeMode);

  useEffect(() => {
    document.documentElement.style.setProperty('--brand', GREPSR_BRAND_COLOR);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    // keep native scrollbars/form controls in sync with the theme
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  return (
    <ConfigProvider
      theme={{
        // expose tokens as --ant-* css variables for stylesheets
        cssVar: {},
        algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          fontFamily: GREPSR_BRAND_FONT,
        },
      }}
    >
      <AntApp message={{ maxCount: 2 }}>{children}</AntApp>
    </ConfigProvider>
  );
}

export default ThemeProvider;
