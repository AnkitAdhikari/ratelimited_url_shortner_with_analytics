import express from 'express';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import cors from 'cors';

import { Click, Url } from './db/models/index.js';
import { env, sequelize } from './db/client.js';
import { validateParams, validateQuery } from './validations/index.js';
import { aliasSchema, urlSchema } from './validations/urlSchema.js';
import { appErrorHandler } from './middleware/errors.middleware.js';
import { toBase62 } from './utils/base62.js';
import { getDailyClicks } from './services/analytics.service.js';
import { InternalServerError } from './utils/errors/app.errors.js';
import { MapStore } from './ratelimit/store.js';
import { FixedWindowLimiter } from './ratelimit/fixedWindow.js';
import { createRateLimit } from './middleware/rateLimit.middleware.js';
import { col, fn } from 'sequelize';
const app = express();

const logger = pino({ base: null });

// allow all cross-origin requests
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(
  pinoHttp({
    logger,
    redact: {
      paths: ['req.headers.cookie', 'req.headers.authorization'],
      remove: true,
    },
    serializers: {
      req(req) {
        return { method: req.method, url: req.url };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
    autoLogging: {
      ignore: (req) => req.url === '/favicon.ico',
    },
  }),
);

const rateLimit = createRateLimit(
  new FixedWindowLimiter({
    store: new MapStore(),
    max: env.RATE_LIMIT_MAX_REQUESTS,
    windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
  }),
);

app.get('/live', (req, res) => {
  res.status(200).json({
    message: 'Live and running',
  });
});

app.post('/api/urls', rateLimit, validateQuery(urlSchema), async (req, res) => {
  const { longURL } = req.query;

  try {
    const existingUrl = await Url.findOne({ where: { longURL } });
    if (existingUrl) {
      return res.status(200).json({
        shortURL: `${env.PUBLIC_BASE_URL}/${existingUrl.alias}`,
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
      shortURL: `${env.PUBLIC_BASE_URL}/${created.alias}`,
      longURL: created.longURL,
    });
  } catch (error) {
    console.error('Error creating URL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/urls', async (req, res) => {
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
});

app.get('/api/urls/:alias/analytics', validateParams(aliasSchema), async (req, res) => {
  const { alias } = req.params;

  const url = await Url.findOne({ where: { alias } });
  if (!url) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  const series = await getDailyClicks({ urlId: url.id, days: 7 });
  return res.json({ alias, series });
});

app.get('/api/analytics/overview', async (req, res) => {
  try {
    const data = await getDailyClicks({ days: 7 });
    return res.status(200).json({ data });
  } catch (error) {
    throw new InternalServerError('Failed to fetch analytics overview');
  }
});

app.get('/:alias', async (req, res) => {
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
});

app.use(appErrorHandler);

app.listen(env.PORT, async () => {
  console.log('server is running ...');
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // REMOVE LATER: production should use migrations
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});
