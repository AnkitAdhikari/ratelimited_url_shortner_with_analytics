import { z } from 'zod';

import { env } from '../db/client.js';

const OWN_HOST = new URL(env.PUBLIC_BASE_URL).host.toLowerCase();

const SELF_URL_MESSAGE = 'You cannot shorten a link that points back to this site.';

function pointsToOwnSite(value: string): boolean {
  try {
    return new URL(value).host.toLowerCase() === OWN_HOST;
  } catch {
    return false;
  }
}

export const urlSchema = z.object({
  longURL: z
    .url()
    .trim()
    .min(1, { message: 'longURL is required' })
    .refine((value) => !pointsToOwnSite(value), { message: SELF_URL_MESSAGE }),
});

export const aliasSchema = z.object({
  alias: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/, { message: 'alias must be alphanumeric' })
    .min(1, { message: 'alias is required' })
    .max(6, { message: 'alias must be at most 6 characters long' }),
});
