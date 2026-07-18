import BluebirdPromise from 'bluebird';

import { createLogger } from '#logger';
import { printBanner } from '#shared/banner.ts';
import { writeOpenApiSnapshot } from '#shared/openapi/index.ts';
import app from './app.ts';
import config from '#config';
import contentPluginRegistry from '#shared/content-plugins/index.js';
import db from '#shared/database/index.js';

// Bluebird dev diagnostics (long stack traces; off in production).
// `shared/database` casts every Sequelize result to a Bluebird promise (see
// wrapMethods), so when those flow into Express 5's native-promise router,
// Bluebird misfires a "promise created in a handler but not returned" warning.
// It is benign, so `wForgottenReturn` is disabled.
BluebirdPromise.config({
  longStackTraces: !config.isProduction,
  warnings: { wForgottenReturn: false },
});

const logger = createLogger();

db.initialize()
  .then(() => logger.info('Database initialized'))
  .then(() => contentPluginRegistry.initialize())
  .then(
    () =>
      new Promise<void>((resolve) => {
        const server = app.listen(Number(config.port), () => resolve());
        // Node caps the time to receive a full request body at `requestTimeout`
        // (default 5 min). Multi-GB asset uploads legitimately take longer.
        server.requestTimeout = 30 * 60 * 1000;
      }),
  )
  .then(() => logger.info(`Server listening on port ${config.port}`))
  .then(() => writeOpenApiSnapshot())
  .then(() => {
    printBanner({
      version: config.packageVersion,
      port: config.port,
      env: config.env.NODE_ENV,
    });
  })
  .catch((err: unknown) => logger.error({ err }));
