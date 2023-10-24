import { createDatabase, getDatabaseClient } from './database.js';
import generateConfig from './dotenv.js';
import { packageDirectory } from 'pkg-dir';
import shell from 'shelljs';

const log = (msg) => console.log(` ${msg}`);
const getDBName = (name, prefix) => (prefix ? `${prefix}_${name}` : name);

const setTailorEnv = (opts) => ({
  path: './',
  preflight: async () => {
    await createDatabase(opts.client, opts.dbName);
    return {
      DATABASE_NAME: opts.dbName,
      DATABASE_USER: opts.user,
      DATABASE_PASSWORD: opts.password,
      STORAGE_PATH: `${await packageDirectory()}/apps/backend/data`
    };
  },
});

export default async function ({ dbPrefix }) {
  try {
    const dbConfig = await getDatabaseClient();
    const configs = [
      setTailorEnv({ ...dbConfig, dbName: getDBName('tailor_dev', dbPrefix) }),
    ];
    await Promise.all(
      configs.map(async ({ path, preflight }) => {
        const preflightConfig = preflight ? await preflight() : {};
        await generateConfig(path, preflightConfig);
      })
    );
  } catch (err) {
    log('🚨 Unable to configure .env!');
    log(err);
    shell.exit(1);
  }
}
