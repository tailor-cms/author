import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import history from 'connect-history-api-fallback';
import qs from 'qs';
import router from './router.js';
import origin from '#shared/origin.js';

import auth from '#shared/auth/index.js';
import { createHttpLogger } from '#logger';
import config from '#config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { STORAGE_PATH } = process.env;
const app = express();

const configCookie = JSON.stringify(
  Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      key.startsWith('NUXT_PUBLIC_'),
    ),
  ),
);

if (config.general.reverseProxyPolicy)
  app.set('trust proxy', config.general.reverseProxyPolicy);

config.auth.oidc.enabled &&
  (await (async () => {
    const { default: consolidate } = await import('consolidate');
    const { default: session } = await import('express-session');
    app.engine('mustache', consolidate.mustache);
    app.set('view engine', 'mustache');
    app.use(session(config.auth.session));
  })());

app.use(
  helmet({
    // TODO: Reevaluate and enable, for now, disabled as it breaks a lot of things
    contentSecurityPolicy: false,
  }),
);

// Patch Express 5 query parser (not parsing arrays properly).
app.use((req, _res, next) => {
  const { query } = req;
  if (query) Object.defineProperty(req, 'query', { value: qs.parse(query) });
  next();
});

app.use(cors({ origin: config.auth.corsAllowedOrigins, credentials: true }));
app.use(cookieParser(config.auth.jwt.cookie.secret));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(auth.initialize());
app.use(origin());
app.use(
  history({
    rewrites: [
      {
        from: /^\/api\/.*$/,
        to: (context) => context.parsedUrl.path,
      },
    ],
  }),
);
app.use(
  express.static(path.join(__dirname, '../frontend/.output/public'), {
    setHeaders: (res, path) => {
      if (!path.endsWith('/public/index.html')) return;
      return res.cookie('config', configCookie);
    },
  }),
);
if (STORAGE_PATH) app.use(express.static(STORAGE_PATH));

// Mount main router.
app.use('/api', createHttpLogger(), router);

// Global error handler.
app.use(errorHandler);

// Handle non-existing routes.
app.use((req, res) => res.status(404).end());

export default app;

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (!err.status || err.status === 500) {
    req.log.error({ err });
    res.status(500).end();
    return;
  }
  const { status, message } = err;
  res.status(err.status).json({ error: { status, message } });
}
