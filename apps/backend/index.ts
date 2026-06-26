import type { Options as BoxenOptions } from 'boxen';
import BluebirdPromise from 'bluebird';
import boxen from 'boxen';

import { createLogger } from '#logger';
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
    welcome(config.packageName, config.packageVersion);
  })
  .then(() => writeOpenApiSnapshot())
  .catch((err: unknown) => logger.error({ err }));

const message = (name: string | undefined, version: string | undefined) =>
  `
    ${name} v${version}

    It's aliveeeee 🚀 📄

    `.trim();

function welcome(name: string | undefined, version: string | undefined) {
  const options = {
    padding: 2,
    margin: 1,
    borderStyle: 'double',
    borderColor: 'blue',
    align: 'left',
  } as BoxenOptions;
  console.log(boxen(message(name, version), options));
}
