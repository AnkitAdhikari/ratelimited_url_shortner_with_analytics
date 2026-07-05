import type { Request, Response } from 'express';

import { Url } from '../db/models/index.js';
import { getDailyClicks } from '../services/analytics.service.js';
import { InternalServerError } from '../utils/errors/app.errors.js';

export async function getAliasAnalytics(req: Request, res: Response) {
  const { alias } = req.params;

  const url = await Url.findOne({ where: { alias } });
  if (!url) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  const series = await getDailyClicks({ urlId: url.id, days: 7 });
  return res.json({ alias, series });
}

export async function getOverview(_req: Request, res: Response) {
  try {
    const data = await getDailyClicks({ days: 7 });
    return res.status(200).json({ data });
  } catch (error) {
    throw new InternalServerError('Failed to fetch analytics overview');
  }
}
