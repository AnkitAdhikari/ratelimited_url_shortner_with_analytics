import { z } from 'zod';

export const urlSchema = z.object({
  longURL: z.url().trim().min(1, { message: 'longURL is required' }),
});

export const aliasSchema = z.object({
  alias: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/, { message: 'alias must be alphanumeric' })
    .min(1, { message: 'alias is required' })
    .max(6, { message: 'alias must be at most 6 characters long' }),
});
