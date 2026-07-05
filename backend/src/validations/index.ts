import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export const validateRequestBody = (schema: z.ZodType<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      // If the validation fails,
      res.status(400).json({
        message: 'Invalid request body',
        success: false,
        error: error,
      });
    }
  };
};

export const validateQuery = (schema: z.ZodType<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Validating query params:', req.query);
      await schema.parseAsync(req.query);
      console.log('Query params are valid');
      next();
    } catch (error) {
      // If the validation fails,
      res.status(400).json({
        message: 'Invalid query params',
        success: false,
        error: error,
      });
    }
  };
};

export const validateParams = (schema: z.ZodType<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Validating request params', req.params);
      await schema.parseAsync(req.params);
      console.log('Params are valid');
      next();
    } catch (error) {
      // If the validation fails,
      res.status(400).json({
        message: 'Invalid params params',
        success: false,
        error: error,
      });
    }
  };
};
