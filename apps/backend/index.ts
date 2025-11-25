import type { Options as BoxenOptions } from 'boxen';
import boxen from 'boxen';
import { promisify } from 'node:util';
import Promise from 'bluebird';

import app from './app.js';
import config from '#config';
import contentPluginRegistry from '#shared/content-plugins/index.js';

// NOTE: This needs to be done before db models get loaded!
Promise.config({ longStackTraces: !config.isProduction });

/* eslint-disable */
import database from '#shared/database/index.js';
import { createLogger } from '#logger';
/* eslint-enable */

const logger = createLogger();
const runApp = promisify(app.listen.bind(app));

database
  .initialize()
  .then(() => logger.info('Database initialized'))
  .then(() => contentPluginRegistry.initialize())
  .then(() => runApp(config.port))
  .then(() => {
    logger.info(`Server listening on port ${config.port}`);
    welcome(config.packageName, config.packageVersion);
  })
  .catch((err) => logger.error({ err }));

const message = (name, version) =>
  `
    ${name} v${version}

    It's aliveeeee 🚀

    📘  Readme: https://git.io/vxrlj
    🐛  Report bugs: https://git.io/vxr8U
    `.trim();

function welcome(name, version) {
  const options = {
    padding: 2,
    margin: 1,
    borderStyle: 'double',
    borderColor: 'blue',
    align: 'left',
  } as BoxenOptions;
  console.log(boxen(message(name, version), options));
}
