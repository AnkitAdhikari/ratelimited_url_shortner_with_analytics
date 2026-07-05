import { Router } from 'express';

import { env } from '../db/client.js';
import { validateParams, validateQuery } from '../validations/index.js';
import { aliasSchema, urlSchema } from '../validations/urlSchema.js';
import { createRateLimit } from '../middleware/rateLimit.middleware.js';
import { FixedWindowLimiter } from '../ratelimit/fixedWindow.js';
import { MapStore } from '../ratelimit/store.js';
import { createShortUrl, listUrls } from '../controllers/url.controller.js';
import { getAliasAnalytics } from '../controllers/analytics.controller.js';

export const urlRouter = Router();

const rateLimit = createRateLimit(
  new FixedWindowLimiter({
    store: new MapStore(),
    max: env.RATE_LIMIT_MAX_REQUESTS,
    windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
  }),
);

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
urlRouter.post('/', rateLimit, validateQuery(urlSchema), createShortUrl);

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
urlRouter.get('/', listUrls);

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
urlRouter.get('/:alias/analytics', validateParams(aliasSchema), getAliasAnalytics);
