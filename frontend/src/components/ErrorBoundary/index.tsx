import { Button, Result } from 'antd';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

import { HOME_ROUTE } from '@/routes/routeNames';

export default function ErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <Result
      status={notFound ? '404' : '500'}
      title={notFound ? '404 - Page not found' : 'Something went wrong'}
      subTitle={
        notFound
          ? 'The page you are looking for might have been removed, had its name changed or is temporarily unavailable.'
          : 'An unexpected error occurred. Please try again.'
      }
      extra={
        <Link to={HOME_ROUTE}>
          <Button type="primary">Go to homepage</Button>
        </Link>
      }
    />
  );
}
