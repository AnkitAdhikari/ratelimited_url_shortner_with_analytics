import type { NextFunction, Request, Response } from 'express';
import type { AppError } from '../utils/errors/app.errors.js';

export const appErrorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
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
