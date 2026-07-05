import { Router } from 'express';

import { getOverview } from '../controllers/analytics.controller.js';

export const analyticsRouter = Router();

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
analyticsRouter.get('/overview', getOverview);
