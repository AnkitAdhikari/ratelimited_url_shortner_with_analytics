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
import { setupSwagger } from './docs/swagger.js';
import { col, fn } from 'sequelize';
const app = express();

const logger = pino({ base: null });

// restrict to localhost:5173 for GET and POST only
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: false,
  }),
);

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

setupSwagger(app);

/**
 * @openapi
 * /live:
 *   get:
 *     tags: [Health]
 *     summary: Liveness probe
 *     description: Returns 200 while the server is up and accepting requests.
 *     responses:
 *       200:
 *         description: Service is live.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Live and running
 */
app.get('/live', (req, res) => {
  res.status(200).json({
    message: 'Live and running',
  });
});

/**
 * @openapi
 * /api/urls:
 *   post:
 *     tags: [URLs]
 *     summary: Create a short URL
 *     description: >
 *       Creates a short alias for the given long URL. Idempotent — if the long
 *       URL already exists, the existing alias is returned with `200`. This
 *       endpoint is rate limited per client (fixed-window).
 *     parameters:
 *       - in: query
 *         name: longURL
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         description: The destination URL to shorten.
 *         example: https://example.com/some/very/long/path
 *     responses:
 *       200:
 *         description: An existing short URL was returned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShortUrl'
 *       201:
 *         description: A new short URL was created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShortUrl'
 *       400:
 *         description: Invalid or missing `longURL` query parameter.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       429:
 *         description: Rate limit exceeded.
 *       500:
 *         description: Internal server error.
 */
app.post('/api/urls', rateLimit, validateQuery(urlSchema), async (req, res) => {
  const { longURL } = req.query;

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
});

/**
 * @openapi
 * /api/urls:
 *   get:
 *     tags: [URLs]
 *     summary: List all short URLs
 *     description: Returns every short URL with its aggregated total click count, newest first.
 *     responses:
 *       200:
 *         description: The list of short URLs.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UrlList'
 *       500:
 *         description: Failed to fetch URLs.
 */
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

/**
 * @openapi
 * /api/urls/{alias}/analytics:
 *   get:
 *     tags: [Analytics]
 *     summary: Daily clicks for a single alias
 *     description: Returns a 7-day daily click time series for the given short-URL alias.
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]+$'
 *           maxLength: 6
 *         description: The short-URL alias (alphanumeric, up to 6 characters).
 *         example: aB3xZ
 *     responses:
 *       200:
 *         description: The daily click series for the alias.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AliasAnalytics'
 *       400:
 *         description: Invalid alias.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Short URL not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/urls/:alias/analytics', validateParams(aliasSchema), async (req, res) => {
  const { alias } = req.params;

  const url = await Url.findOne({ where: { alias } });
  if (!url) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  const series = await getDailyClicks({ urlId: url.id, days: 7 });
  return res.json({ alias, series });
});

/**
 * @openapi
 * /api/analytics/overview:
 *   get:
 *     tags: [Analytics]
 *     summary: Aggregate daily clicks across all URLs
 *     description: Returns a 7-day daily click time series aggregated over every short URL.
 *     responses:
 *       200:
 *         description: The aggregated daily click series.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsOverview'
 *       500:
 *         description: Failed to fetch analytics overview.
 */
app.get('/api/analytics/overview', async (req, res) => {
  try {
    const data = await getDailyClicks({ days: 7 });
    return res.status(200).json({ data });
  } catch (error) {
    throw new InternalServerError('Failed to fetch analytics overview');
  }
});

/**
 * @openapi
 * /{alias}:
 *   get:
 *     tags: [Redirect]
 *     summary: Resolve a short alias
 *     description: >
 *       Looks up the alias, records a click, and issues a `302` redirect to the
 *       original long URL. Intended to be followed by a browser, not called via
 *       the API console.
 *     parameters:
 *       - in: path
 *         name: alias
 *         required: true
 *         schema:
 *           type: string
 *         description: The short-URL alias to resolve.
 *         example: aB3xZ
 *     responses:
 *       302:
 *         description: Redirect to the original long URL.
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *               format: uri
 *             description: The destination long URL.
 *       404:
 *         description: URL not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error.
 */
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
