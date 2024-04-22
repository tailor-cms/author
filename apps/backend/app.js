import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import history from 'connect-history-api-fallback';
import origin from './shared/origin.js';
import path from 'node:path';

/* eslint-disable */
import auth from './shared/auth/index.js';
import config from './config/server/index.js';
import getLogger from './shared/logger.js';
import router from './router.js';
/* eslint-enable */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { STORAGE_PATH } = process.env;
const logger = getLogger();
const app = express();

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
app.use(cors({ origin: config.auth.corsAllowedOrigins, credentials: true }));
app.use(cookieParser(config.auth.jwt.cookie.secret));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(auth.initialize());
app.use(origin());
app.use(history());
// Mount main router.
app.use('/api', requestLogger, router);
app.use(
  express.static(path.join(__dirname, '../frontend-nuxt/.output/public')),
);
if (STORAGE_PATH) app.use(express.static(STORAGE_PATH));

// Global error handler.
app.use(errorHandler);

// Handle non-existing routes.
app.use((req, res, next) => res.status(404).end());

export default app;

function requestLogger(req, res, next) {
  logger.info({ req });
  next();
}

function errorHandler(err, _req, res, _next) {
  if (!err.status || err.status === 500) {
    logger.error({ err });
    res.status(500).end();
    return;
  }
  const { status, message } = err;
  res.status(err.status).json({ error: { status, message } });
}
