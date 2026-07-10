import type { RouteObject } from 'react-router-dom';

import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/layout';
import { appLinks } from '@/routes/appLinks';
import { HOME_ROUTE } from '@/routes/routeNames';

export const Routes: RouteObject[] = [
  {
    path: HOME_ROUTE,
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: appLinks,
  },
];
