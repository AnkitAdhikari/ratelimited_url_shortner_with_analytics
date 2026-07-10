import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { BACKEND_BASE_URL } from '../../constants';

const baseQuery = fetchBaseQuery({
  baseUrl: BACKEND_BASE_URL,
});

// central api slice; each service injects its own endpoints
export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['urls', 'analytics'],
  endpoints: () => ({}),
});
