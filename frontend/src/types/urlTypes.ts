export interface UrlSummary {
  alias: string;
  longURL: string;
  totalClicks: number;
  createdAt: string;
}

export interface DailyCount {
  day: string;
  count: number;
}

export interface AliasAnalytics {
  alias: string;
  series: DailyCount[];
}

export interface CreateUrlResponse {
  shortURL: string;
  longURL: string;
}

// body of a 429 from the rate limiter: { error, retryAfterSeconds }
export interface RateLimitErrorBody {
  error: string;
  retryAfterSeconds: number;
}
