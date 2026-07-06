import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import history, { type Context as HistoryContext } from 'connect-history-api-fallback';
import multer from 'multer';
import qs from 'qs';
import router from './router.ts';
import origin from '#shared/origin.js';

import config, { env } from '#config';
import { createHttpLogger } from '#logger';
import auth from '#shared/auth/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { STORAGE_PATH } = process.env;
const app = express();

// NUXT_PUBLIC_* config shipped to the frontend via the `config` cookie.
// Undeclared keys (OIDC login text, Statsig key, ...) pass through from the
// process; schema-declared ones are spread from `env` afterwards so their
// defaults reach the frontend even when the var is unset.
const publicEnv = (source: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(source).filter(([key]) => key.startsWith('NUXT_PUBLIC_')),
  );

const configCookie = JSON.stringify({
  ...publicEnv(process.env),
  ...publicEnv(env),
});

if (config.general.reverseProxyPolicy)
  app.set('trust proxy', config.general.reverseProxyPolicy);

if (config.auth.oidc.enabled) {
  const { default: consolidate } = await import('consolidate');
  const { default: session } = await import('express-session');
  app.engine('mustache', consolidate.mustache);
  app.set('view engine', 'mustache');
  const { secret, ...sessionOpts } = config.auth.session;
  app.use(session({ ...sessionOpts, secret: secret! }));
}

app.use(
  helmet({
    // TODO: Reevaluate and enable, for now, disabled as it breaks a lot of things
    contentSecurityPolicy: false,
    // Helmet defaults to `no-referrer`, which strips the Referer on the served
    // cross-origin requests. Third-party embeds (e.g. YouTube iframes)
    // then refuse to play because they can't verify the embedding domain.
    //
    // `strict-origin-when-cross-origin` (the modern browser default) sends:
    //   - same-origin request        -> full URL (path + query)
    //   - cross-origin, same security -> origin only (scheme + host + port),
    //                                    e.g. `https://ourdomain.com` - no path
    //   - HTTPS -> HTTP downgrade     -> nothing (never leak over insecure hops)
    // So YouTube gets our origin to authorize the embed, without exposing which
    // page the user is on.
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);

// Patch Express 5 query parser (not parsing arrays properly).
app.use((req: Request, _res: Response, next: NextFunction) => {
  const { query } = req;
  if (query) Object.defineProperty(req, 'query', { value: qs.parse(query as any) });
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
        to: (context: HistoryContext) => context.parsedUrl.path ?? '',
      },
    ],
  }),
);
app.use(
  express.static(path.join(__dirname, '../frontend/.output/public'), {
    setHeaders: (res, p) => {
      if (!p.endsWith('/public/index.html')) return;
      return res.cookie('config', configCookie);
    },
  }),
);
if (STORAGE_PATH) app.use(express.static(STORAGE_PATH));

// Mount main router.
app.use('/api', createHttpLogger(), router);

// Global error handler. Express identifies error middleware by its
// 4-argument signature; the `_next` is required for the dispatch table
// even though we always terminate the response here.
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Multer errors carry no `.status`, so map them explicitly
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File exceeds the maximum allowed upload size.'
        : err.message;
    res.status(status).json({ error: { status, message } });
    return;
  }
  if (!err.status || err.status === 500) {
    (req as any).log?.error({ err });
    res.status(500).end();
    return;
  }
  const { status, message } = err;
  res.status(err.status).json({ error: { status, message } });
};

app.use(errorHandler);

// Handle non-existing routes.
app.use((_req: Request, res: Response) => res.status(404).end());

export default app;
