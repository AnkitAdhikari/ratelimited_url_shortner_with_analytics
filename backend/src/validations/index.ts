import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

const partLabel: Record<RequestPart, string> = {
  body: 'Invalid request body',
  query: 'Invalid query params',
  params: 'Invalid path params',
};

const validate = (schema: z.ZodType, part: RequestPart) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req[part]);
      next();
    } catch (error) {
      if (!(error instanceof z.ZodError)) {
        next(error);
        return;
      }

      const issues = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));

      res.status(400).json({
        success: false,
        message: issues[0]?.message ?? partLabel[part],
        error: issues,
      });
    }
  };
};

export const validateRequestBody = (schema: z.ZodType) => validate(schema, 'body');
export const validateQuery = (schema: z.ZodType) => validate(schema, 'query');
export const validateParams = (schema: z.ZodType) => validate(schema, 'params');
