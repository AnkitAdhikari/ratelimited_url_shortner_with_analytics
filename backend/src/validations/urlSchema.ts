import { z } from 'zod';

export const urlSchema = z.object({
  longURL: z.url().trim().min(1, { message: 'longURL is required' }),
});
