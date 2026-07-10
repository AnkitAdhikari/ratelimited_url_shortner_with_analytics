import type { Request, Response } from 'express';
import { col, fn } from 'sequelize';

import { Click, Url } from '../db/models/index.js';
import { env, sequelize } from '../db/client.js';
import { toBase62 } from '../utils/base62.js';
import { InternalServerError } from '../utils/errors/app.errors.js';

export async function createShortUrl(req: Request, res: Response) {
  const { longURL } = req.body;

  try {
    const existingUrl = await Url.findOne({ where: { longURL } });
    if (existingUrl) {
      return res.status(200).json({
        shortURL: `${env.PUBLIC_BASE_URL}/${existingUrl.alias.trim()}`,
        longURL: existingUrl.longURL,
      });
    }

    const created = await sequelize.transaction(async (t) => {
      const newUrl = await Url.create({ longURL, alias: '' }, { transaction: t });

      const alias = toBase62(newUrl.id);
      newUrl.alias = alias;
      await newUrl.save({ transaction: t });

      return newUrl;
    });

    return res.status(201).json({
      shortURL: `${env.PUBLIC_BASE_URL}/${created.alias.trim()}`,
      longURL: created.longURL,
    });
  } catch (error) {
    console.error('Error creating URL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function listUrls(_req: Request, res: Response) {
  try {
    const urls = await Url.findAll({
      attributes: {
        include: [[fn('COUNT', col('clicks.id')), 'totalClicks']],
      },
      include: [{ model: Click, as: 'clicks', attributes: [] }],
      group: ['Url.id'],
      order: [['createdAt', 'DESC']],
      subQuery: false,
    });
    res.json({ urls });
  } catch (error) {
    console.error('Error fetching URLs:', error);
    throw new InternalServerError('Failed to fetch URLs');
  }
}
