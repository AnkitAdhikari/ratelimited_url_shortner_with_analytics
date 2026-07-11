import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd';
import { useEffect } from 'react';

import { BRAND_ACCENT, BRAND_FONT, HEADER_BG } from '@/constants';
import { selectThemeMode, THEME_STORAGE_KEY } from '@/redux/feature/themeSlice';
import { useAppSelector } from '@/redux/store/hooks';

// palettes from the terminal design (URL Shortener.dc.html)
const DARK = {
  colorPrimary: BRAND_ACCENT,
  colorInfo: BRAND_ACCENT,
  colorLink: BRAND_ACCENT,
  colorBgBase: '#0a0e14',
  colorBgLayout: '#0a0e14',
  colorBgContainer: '#0f141c',
  colorBgElevated: '#141a24',
  colorBorder: '#232b38',
  colorBorderSecondary: '#232b38',
  colorText: '#e7edf5',
  colorTextSecondary: '#7c8798',
  colorSuccess: '#4ade80',
  colorSuccessBg: 'rgba(39, 201, 63, 0.08)',
  colorSuccessBorder: 'rgba(39, 201, 63, 0.35)',
  colorWarning: '#ffbd2e',
  colorWarningBg: 'rgba(255, 189, 46, 0.08)',
  colorWarningBorder: 'rgba(255, 189, 46, 0.35)',
  colorError: '#ff5f56',
};

const LIGHT = {
  colorPrimary: '#0891b2',
  colorInfo: '#0891b2',
  colorLink: '#0891b2',
  colorBgBase: '#f6f8fa',
  colorBgLayout: '#f6f8fa',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#f1f4f7',
  colorBorder: '#dde3ea',
  colorBorderSecondary: '#dde3ea',
  colorText: '#10151c',
  colorTextSecondary: '#5b6472',
  colorSuccess: '#1a9b3d',
  colorSuccessBg: '#f0faf1',
  colorSuccessBorder: '#bfe8c4',
  colorWarning: '#a3690a',
  colorWarningBg: '#fff8ea',
  colorWarningBorder: '#f3dfa8',
  colorError: '#d64541',
};

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useAppSelector(selectThemeMode);
  const dark = mode === 'dark';

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
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          fontFamily: BRAND_FONT,
          borderRadius: 7,
          borderRadiusLG: 12,
          ...(dark ? DARK : LIGHT),
        },
        components: {
          // the header stays dark in both modes, per the design
          Layout: { headerBg: dark ? HEADER_BG : '#12161f' },
          // readable text on the cyan primary button
          Button: { primaryColor: dark ? '#06181c' : '#ffffff' },
        },
      }}
    >
      <AntApp message={{ maxCount: 2 }}>{children}</AntApp>
    </ConfigProvider>
  );
}

export default ThemeProvider;
