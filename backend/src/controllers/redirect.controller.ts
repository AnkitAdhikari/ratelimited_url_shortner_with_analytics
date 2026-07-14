import type { Request, Response } from 'express';

import { Click, Url } from '../db/models/index.js';

// prevents prefetch from counted as clicks
function isSpeculativeRequest(req: Request): boolean {
  const secPurpose = req.get('sec-purpose') ?? '';
  return (
    secPurpose.includes('prefetch') ||
    secPurpose.includes('prerender') ||
    req.get('purpose') === 'prefetch' ||
    req.get('x-moz') === 'prefetch' ||
    req.get('x-purpose') === 'preview'
  );
}

export async function redirectToLongUrl(req: Request, res: Response) {
  const { alias } = req.params;

  try {
    const url = await Url.findOne({ where: { alias } });
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    if (!isSpeculativeRequest(req)) {
      // don't await db write for this request
      Click.create({
        urlId: url.id,
        ipAddress: req.ip,
      }).catch((error) => {
        console.error('Error recording click:', error);
      });
    }
    res.redirect(url.longURL);
  } catch (error) {
    console.error('Error resolving alias:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
