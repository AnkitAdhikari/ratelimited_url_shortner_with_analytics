import type { RouteObject } from 'react-router-dom';

import Dashboard from '@/pages/Dashboard';
import Shorten from '@/pages/Shorten';
import { DASHBOARD_ROUTE } from './routeNames';

export const appLinks: RouteObject[] = [
  { index: true, element: <Shorten /> },
  { path: DASHBOARD_ROUTE, element: <Dashboard /> },
];
