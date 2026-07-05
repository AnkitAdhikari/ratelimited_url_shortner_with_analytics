import { Layout, Tabs, Typography } from 'antd';

import UrlCreator from './features/creator/UrlCreator';
import { GREPSR_BRAND_COLOR } from './constants';
import Dashboard from './features/dashboard/Dashboard';

const { Header, Content } = Layout;

export default function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ backgroundColor: GREPSR_BRAND_COLOR }}>
        <Typography.Title
          level={2}
          style={{ color: '#fff', margin: '14px 0', textAlign: 'center' }}
        >
          URL Shortener
        </Typography.Title>
      </Header>
      <Content style={{ width: '100%', maxWidth: 960, margin: '0 auto', padding: 24 }}>
        <Tabs
          defaultActiveKey="create"
          items={[
            { key: 'create', label: 'Shorten', children: <UrlCreator /> },
            { key: 'dashboard', label: 'Dashboard', children: <Dashboard /> },
          ]}
        />
      </Content>
    </Layout>
  );
}
