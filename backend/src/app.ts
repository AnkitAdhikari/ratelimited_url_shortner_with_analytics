import express from 'express';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import cors from 'cors';

import { env } from './db/client.js';
import { appErrorHandler } from './middleware/errors.middleware.js';
import { setupSwagger } from './docs/swagger.js';
import { router } from './routes/index.js';

export const app = express();

const logger = pino({ base: null });

// restrict to the configured origin for GET and POST only
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

setupSwagger(app);

app.use(router);

app.use(appErrorHandler);
