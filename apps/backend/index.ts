import BluebirdPromise from 'bluebird';

import { createLogger } from '#logger';
import { printBanner } from '#shared/banner.ts';
import { writeOpenApiSnapshot } from '#shared/openapi/index.ts';
import app from './app.ts';
import config from '#config';
import contentPluginRegistry from '#shared/content-plugins/index.js';
import db from '#shared/database/index.js';

// Bluebird long-stack-trace config (global for all bluebird instances).
BluebirdPromise.config({ longStackTraces: !config.isProduction });

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
  .then(() => {
    logger.info(`Server listening on port ${config.port}`);
    printBanner({
      version: config.packageVersion,
      port: config.port,
      env: process.env.NODE_ENV ?? 'development',
    });
  })
  .then(() => writeOpenApiSnapshot())
  .catch((err: unknown) => logger.error({ err }));
