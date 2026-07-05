const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export interface DailyCount {
  day: string;
  count: number;
}

export interface UrlSummary {
  alias: string;
  longURL: string;
  totalClicks: number;
  createdAt: string;
}

export interface Analytics {
  alias: string;
  targetUrl: string;
  series: DailyCount[];
}

export type CreateResult =
  | { ok: true; alias: string; shortURL: string }
  | { ok: false; status: 429; retryAfterSeconds: number }
  | { ok: false; status: number; error: string };

export async function createShortUrl(url: string): Promise<CreateResult> {
  const response = await fetch(`${API_BASE_URL}/api/urls?longURL=${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
  });

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (response.ok) {
    return { ok: true, alias: String(body.shortURL), shortURL: String(body.shortURL) };
  }

  if (response.status === 429) {
    const retryAfterSeconds =
      typeof body.retryAfterSeconds === 'number'
        ? body.retryAfterSeconds
        : Number(response.headers.get('retry-after')) || 60;
    return { ok: false, status: 429, retryAfterSeconds };
  }

  const error = String(body.message ?? 'Request failed');
  return { ok: false, status: response.status, error };
}

export async function listUrls(): Promise<UrlSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/urls`);
  if (!response.ok) {
    throw new Error(`Failed to list URLs (status ${response.status})`);
  }
  const body = await response.json();
  return (body.urls || []) as UrlSummary[];
}

export async function getAnalytics(alias: string): Promise<Analytics> {
  const response = await fetch(`${API_BASE_URL}/api/urls/${alias.trim()}/analytics`);
  if (!response.ok) {
    throw new Error(`Failed to load analytics (status ${response.status})`);
  }
  return (await response.json()) as Analytics;
}
