import { ConfigProvider } from 'antd';
import { GREPSR_BRAND_FONT } from '../constants';

function FontConfigProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: GREPSR_BRAND_FONT,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export default FontConfigProvider;
