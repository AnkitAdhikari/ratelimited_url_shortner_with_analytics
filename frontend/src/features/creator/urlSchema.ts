import { z } from 'zod';

export const urlSchema = z.url();

const INVALID_URL_MESSAGE = 'Enter a valid URL, e.g. https://example.com';

export function getUrlError(value: string): string | null {
  return urlSchema.safeParse(value.trim()).success ? null : INVALID_URL_MESSAGE;
}
