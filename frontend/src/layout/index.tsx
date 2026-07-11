import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Layout as AntLayout, Switch } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { selectThemeMode, themeToggled } from '@/redux/feature/themeSlice';
import { useAppDispatch, useAppSelector } from '@/redux/store/hooks';
import { DASHBOARD_ROUTE, HOME_ROUTE } from '@/routes/routeNames';
import styles from './layout.module.css';

const { Header, Content } = AntLayout;

export default function Layout() {
  const { pathname } = useLocation();
  const onDashboard = pathname.startsWith(DASHBOARD_ROUTE);

  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(selectThemeMode);

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.lockup}>
            <span className={styles.logoMark}>&gt;_</span>
            <span className={styles.wordmark}>
              url<span className={styles.accent}>shortener</span>
            </span>
          </div>
          <nav className={styles.nav} aria-label="Primary">
            <Link to={HOME_ROUTE} className={onDashboard ? styles.tab : styles.tabActive}>
              shorten
            </Link>
            <Link to={DASHBOARD_ROUTE} className={onDashboard ? styles.tabActive : styles.tab}>
              dashboard
            </Link>
          </nav>
        </div>
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
