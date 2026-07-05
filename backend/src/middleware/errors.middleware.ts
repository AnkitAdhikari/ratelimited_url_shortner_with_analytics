import type { NextFunction, Request, Response } from 'express';
import { HttpError, type AppError } from '../utils/errors/app.errors.js';

export const appErrorHandler = (
  err: HttpError | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, ...err.details });
    return;
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

export const genericErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
};
