const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

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

  const error = String(body.error ?? 'Request failed');
  return { ok: false, status: response.status, error };
}
