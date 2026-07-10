import { aliasAnalyticsUrl, URLS_URL } from '../../constants/apiUrlConstants';
import { api } from '../store/api';
import type { AliasAnalytics, CreateUrlResponse, UrlSummary } from '../../types/urlTypes';

export const urlsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createShortUrl: builder.mutation<CreateUrlResponse, string>({
      query: (longURL) => ({
        url: URLS_URL,
        method: 'POST',
        body: { longURL },
      }),
      invalidatesTags: ['urls'],
    }),
    getUrls: builder.query<UrlSummary[], void>({
      query: () => URLS_URL,
      transformResponse: (response: { urls: UrlSummary[] }) => response.urls,
      providesTags: ['urls'],
    }),
    getAliasAnalytics: builder.query<AliasAnalytics, string>({
      query: (alias) => aliasAnalyticsUrl(alias),
      providesTags: (_result, _error, alias) => [{ type: 'analytics', id: alias }],
    }),
  }),
});

export const { useCreateShortUrlMutation, useGetUrlsQuery, useGetAliasAnalyticsQuery } = urlsApi;
