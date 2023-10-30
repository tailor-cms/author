import { createDatabase, getDatabaseClient } from './database.js';
import generateConfig from './dotenv.js';
import { packageDirectory } from 'pkg-dir';
import shell from 'shelljs';

const log = (msg) => console.log(` ${msg}`);
const PROJECT_DIR = await packageDirectory();

// DB helpers
const getDBName = (name, prefix) => (prefix ? `${prefix}_${name}` : name);
const initDatabase = async () => {
  await shell.exec('pnpm db:migrate');
  await shell.exec('pnpm seed');
};

const setTailorEnv = (opts) => ({
  path: PROJECT_DIR,
  beforeHook: async () => {
    const isCreated = await createDatabase(opts.client, opts.dbName);
    const env = {
      DATABASE_NAME: opts.dbName,
      DATABASE_USER: opts.user,
      DATABASE_PASSWORD: opts.password,
      STORAGE_PATH: `${PROJECT_DIR}/apps/backend/data`,
    };
    return {
      env,
      afterHook: isCreated ? initDatabase : null,
    };
  },
});

export default async function ({ dbPrefix }) {
  try {
    const dbConfig = await getDatabaseClient();
    const configs = [
      setTailorEnv({ ...dbConfig, dbName: getDBName('tailor_dev', dbPrefix) }),
    ];
    const afterHooks = [];
    await Promise.all(
      configs.map(async ({ path, beforeHook }) => {
        const beforeHookResponse = beforeHook ? await beforeHook() : {};
        const config = beforeHookResponse.env || {};
        await generateConfig(path, config);
        if (beforeHookResponse.afterHook) {
          afterHooks.push(beforeHookResponse.afterHook);
        }
      }),
    );
    return afterHooks;
  } catch (err) {
    log('🚨 Unable to configure .env!');
    log(err);
    shell.exit(1);
  }
}
