import { Spin } from 'antd';
import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';

import Shorten from '@/pages/Shorten';
import { DASHBOARD_ROUTE } from './routeNames';

// lazy: keeps chart.js out of the landing-page bundle
const Dashboard = lazy(() => import('@/pages/Dashboard'));

const lazyFallback = (
  <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
    <Spin size="large" />
  </div>
);

export const appLinks: RouteObject[] = [
  { index: true, element: <Shorten /> },
  {
    path: DASHBOARD_ROUTE,
    element: (
      <Suspense fallback={lazyFallback}>
        <Dashboard />
      </Suspense>
    ),
  },
];
