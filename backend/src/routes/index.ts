import { Router } from 'express';

import { healthRouter } from './health.routes.js';
import { urlRouter } from './url.routes.js';
import { analyticsRouter } from './analytics.routes.js';
import { redirectRouter } from './redirect.routes.js';

export const router = Router();

router.use(healthRouter);
router.use('/api/urls', urlRouter);
router.use('/api/analytics', analyticsRouter);

// Catch-all alias resolver — keep last so it doesn't shadow the routes above.
router.use(redirectRouter);
