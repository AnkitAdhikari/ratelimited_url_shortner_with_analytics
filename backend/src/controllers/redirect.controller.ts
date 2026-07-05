import type { Request, Response } from 'express';

import { Click, Url } from '../db/models/index.js';

export async function redirectToLongUrl(req: Request, res: Response) {
  const { alias } = req.params;

  try {
    const url = await Url.findOne({ where: { alias } });
    console.log('url:', url);
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    Click.create({
      urlId: url.id,
      ipAddress: req.ip,
    });
    res.status(302).redirect(url.longURL);
  } catch (error) {
    console.error('Error creating URL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
