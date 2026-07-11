import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Layout as AntLayout, Menu, Switch, Typography } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { selectThemeMode, themeToggled } from '@/redux/feature/themeSlice';
import { useAppDispatch, useAppSelector } from '@/redux/store/hooks';
import { DASHBOARD_ROUTE, HOME_ROUTE } from '@/routes/routeNames';
import styles from './layout.module.css';

const { Header, Content } = AntLayout;

const menuItems = [
  { key: HOME_ROUTE, label: <Link to={HOME_ROUTE}>Shorten</Link> },
  { key: DASHBOARD_ROUTE, label: <Link to={DASHBOARD_ROUTE}>Dashboard</Link> },
];

export default function Layout() {
  const { pathname } = useLocation();
  const selectedKey = pathname.startsWith(DASHBOARD_ROUTE) ? DASHBOARD_ROUTE : HOME_ROUTE;

  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(selectThemeMode);

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header className={styles.header}>
        <Typography.Title level={3} className={styles.title}>
          URL Shortener
        </Typography.Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          className={styles.menu}
        />
        <Switch
          checked={themeMode === 'dark'}
          onChange={() => dispatch(themeToggled())}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
          aria-label="Toggle dark mode"
        />
      </Header>
      <Content className={styles.content}>
        <Outlet />
      </Content>
    </AntLayout>
  );
}
