import { Router } from 'express';

import { redirectToLongUrl } from '../controllers/redirect.controller.js';

export const redirectRouter = Router();

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
redirectRouter.get('/:alias', redirectToLongUrl);
