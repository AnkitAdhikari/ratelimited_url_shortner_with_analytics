import { loadEnv } from './config/env.js';
import { createSequelize } from './db/client.js';
import express from 'express';
import pino from 'pino';
import { pinoHttp } from 'pino-http';

try {
  process.loadEnvFile();
} catch {
  // No .env file — fall back to the ambient environment.
}
const env = loadEnv();

const app = express();

const logger = pino({ base: null });

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

app.get('/live', (req, res) => {
  res.status(200).json({
    message: 'Live and running',
  });
});

app.listen(env.PORT, async () => {
  console.log('server is running ...');
  try {
    await createSequelize(env.DATABASE_URL).authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});
