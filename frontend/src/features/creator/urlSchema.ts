import { z } from 'zod';

export const urlSchema = z.url();

const INVALID_URL_MESSAGE = 'Enter a valid URL, e.g. https://example.com';
const SELF_URL_MESSAGE = 'You cannot shorten a link that points back to this site.';

function hostOf(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

const OWN_HOSTS = new Set(
  [
    typeof window === 'undefined' ? null : window.location.host.toLowerCase(),
    hostOf(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'),
  ].filter((host): host is string => host !== null),
);

export function getUrlError(value: string): string | null {
  const trimmed = value.trim();

  if (!urlSchema.safeParse(trimmed).success) return INVALID_URL_MESSAGE;

  const host = hostOf(trimmed);
  if (host !== null && OWN_HOSTS.has(host)) return SELF_URL_MESSAGE;

  return null;
}
