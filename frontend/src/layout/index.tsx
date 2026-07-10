import { Layout as AntLayout, Menu, Typography } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { GREPSR_BRAND_COLOR } from '@/constants';
import { DASHBOARD_ROUTE, HOME_ROUTE } from '@/routes/routeNames';

const { Header, Content } = AntLayout;

const menuItems = [
  { key: HOME_ROUTE, label: <Link to={HOME_ROUTE}>Shorten</Link> },
  { key: DASHBOARD_ROUTE, label: <Link to={DASHBOARD_ROUTE}>Dashboard</Link> },
];

export default function Layout() {
  const { pathname } = useLocation();
  const selectedKey = pathname.startsWith(DASHBOARD_ROUTE) ? DASHBOARD_ROUTE : HOME_ROUTE;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          backgroundColor: GREPSR_BRAND_COLOR,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>
          URL Shortener
        </Typography.Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ backgroundColor: 'transparent', flex: 1, minWidth: 0 }}
        />
      </Header>
      <Content style={{ width: '100%', maxWidth: 960, margin: '0 auto', padding: 24 }}>
        <Outlet />
      </Content>
    </AntLayout>
  );
}
