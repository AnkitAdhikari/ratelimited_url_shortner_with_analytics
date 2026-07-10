import { z } from 'zod';

import { BACKEND_BASE_URL } from '@/constants';

export const urlSchema = z.url({ protocol: /^https?$/ });

const INVALID_URL_MESSAGE = 'Enter a valid URL including the protocol, e.g. https://example.com';
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
    hostOf(BACKEND_BASE_URL),
  ].filter((host): host is string => host !== null),
);

export function getUrlError(value: string): string | null {
  const trimmed = value.trim();

  if (!urlSchema.safeParse(trimmed).success) return INVALID_URL_MESSAGE;

  const host = hostOf(trimmed);
  if (host !== null && OWN_HOSTS.has(host)) return SELF_URL_MESSAGE;

  return null;
}
