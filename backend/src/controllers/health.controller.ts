import type { Request, Response } from 'express';

export function live(_req: Request, res: Response) {
  res.status(200).json({
    message: 'Live and running',
  });
}
