import { createSlice } from '@reduxjs/toolkit';

import { urlsApi } from '../services/urls';
import type { RateLimitErrorBody } from '../../types/urlTypes';
import type { RootState } from '../store/store';

interface RateLimitState {
  // epoch ms when the client may retry, null when not limited
  until: number | null;
}

const initialState: RateLimitState = { until: null };

const FALLBACK_RETRY_SECONDS = 60;

function isRateLimitBody(data: unknown): data is RateLimitErrorBody {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as RateLimitErrorBody).retryAfterSeconds === 'number'
  );
}

export const rateLimitSlice = createSlice({
  name: 'rateLimit',
  initialState,
  reducers: {
    rateLimitCleared(state) {
      state.until = null;
    },
  },
  // any createShortUrl 429 lands here
  extraReducers: (builder) => {
    builder.addMatcher(urlsApi.endpoints.createShortUrl.matchRejected, (state, action) => {
      const error = action.payload;
      if (error === undefined || error.status !== 429) return;

      const retryAfterSeconds = isRateLimitBody(error.data)
        ? error.data.retryAfterSeconds
        : FALLBACK_RETRY_SECONDS;
      state.until = Date.now() + retryAfterSeconds * 1000;
    });
  },
});

export const { rateLimitCleared } = rateLimitSlice.actions;

export const selectRateLimitUntil = (state: RootState) => state.rateLimit.until;
