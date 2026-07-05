import { Router } from 'express';

import { live } from '../controllers/health.controller.js';

export const healthRouter = Router();

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
healthRouter.get('/live', live);
