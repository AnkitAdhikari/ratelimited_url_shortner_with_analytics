import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Express } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { env } from '../db/client.js';

// Resolve the source root (this file lives in <root>/src/docs) so the JSDoc
// scanner finds the route annotations regardless of the process' cwd.
// Note: in dev (tsx) this points at src/**/*.ts. A dist-only production build
// strips comments, so ship the sources or move the paths into `definition`.
const sourceRoot = path.resolve(fileURLToPath(import.meta.url), '../..');

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Rate-Limited URL Shortener API',
      version: '1.0.0',
      description:
        'A URL shortener with per-client rate limiting and click analytics. ' +
        'Create short aliases, follow them via redirects, and inspect daily click trends.',
    },
    servers: [
      {
        url: env.PUBLIC_BASE_URL,
        description: 'Configured public base URL',
      },
    ],
    tags: [
      { name: 'Health', description: 'Service liveness' },
      { name: 'URLs', description: 'Create and list short URLs' },
      { name: 'Analytics', description: 'Click analytics and trends' },
      { name: 'Redirect', description: 'Short-alias resolution' },
    ],
    components: {
      schemas: {
        ShortUrl: {
          type: 'object',
          properties: {
            shortURL: {
              type: 'string',
              format: 'uri',
              example: 'http://localhost:3000/aB3xZ',
            },
            longURL: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/some/very/long/path',
            },
          },
          required: ['shortURL', 'longURL'],
        },
        UrlListItem: {
          type: 'object',
          properties: {
            id: { type: 'integer', format: 'int64', example: 42 },
            alias: { type: 'string', example: 'aB3xZ' },
            longURL: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/some/very/long/path',
            },
            createdAt: { type: 'string', format: 'date-time' },
            totalClicks: {
              type: 'string',
              description: 'Aggregated click count (returned as a string by the driver).',
              example: '17',
            },
          },
        },
        UrlList: {
          type: 'object',
          properties: {
            urls: {
              type: 'array',
              items: { $ref: '#/components/schemas/UrlListItem' },
            },
          },
        },
        DailyClick: {
          type: 'object',
          properties: {
            day: { type: 'string', example: '2026-07-05' },
            count: { type: 'integer', example: 12 },
          },
          required: ['day', 'count'],
        },
        AliasAnalytics: {
          type: 'object',
          properties: {
            alias: { type: 'string', example: 'aB3xZ' },
            series: {
              type: 'array',
              items: { $ref: '#/components/schemas/DailyClick' },
            },
          },
        },
        AnalyticsOverview: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/DailyClick' },
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Invalid query params' },
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              description: 'Raw ZodError describing which fields failed.',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'URL not found' },
          },
        },
      },
    },
  },
  apis: [path.join(sourceRoot, '**/*.ts'), path.join(sourceRoot, '**/*.js')],
};

export const swaggerSpec = swaggerJSDoc(options);

/**
 * Mounts the interactive Swagger UI at `/docs` and the raw OpenAPI JSON at
 * `/docs.json`.
 */
export function setupSwagger(app: Express): void {
  app.get('/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'URL Shortener API Docs',
      swaggerOptions: { persistAuthorization: true },
    }),
  );
}
