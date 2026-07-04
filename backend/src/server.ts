import express from 'express';
import pino from 'pino';
import { pinoHttp } from 'pino-http';

import Url from './db/models/url.js';
import { env, sequelize } from './db/client.js';
import { validateQuery } from './validations/index.js';
import { urlSchema } from './validations/urlSchema.js';
const app = express();

const logger = pino({ base: null });

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

app.get('/live', (req, res) => {
  res.status(200).json({
    message: 'Live and running',
  });
});

app.post('/api/url', validateQuery(urlSchema), async (req, res) => {
  const { longURL } = req.query;

  const demoAlias = 'ABc123';

  try {
    const existingUrl = await Url.findOne({ where: { longURL } });

    if (existingUrl) {
      return res.status(200).json({
        shortURL: `${env.PUBLIC_BASE_URL}/${existingUrl.alias}`,
        longURL: existingUrl.longURL,
      });
    }

    const url = await Url.create({
      alias: demoAlias,
      longURL,
    });
    return res.status(201).json({
      shortURL: `${env.PUBLIC_BASE_URL}/${url.alias}`,
      longURL: url.longURL,
    });
  } catch (error) {
    console.error('Error creating URL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/:alias', async (req, res) => {
  const { alias } = req.params;

  try {
    const url = await Url.findOne({ where: { alias } });
    console.log('url:', url);
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    res.status(302).redirect(url.longURL);
  } catch (error) {
    console.error('Error creating URL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

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
