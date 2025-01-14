import inquirer from 'inquirer';
import pg from 'pg';
import { loadDevConfig, saveDevConfig } from './dotenv.js';

const { Client } = pg;
const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const _getDatabaseClient = async (forceCredentials = false) => {
  const creds = await getDatabaseCredentials(forceCredentials);
  const client = new Client({
    database: 'postgres',
    host: 'localhost',
    port: 5432,
    ...creds,
  });
  await client.connect();
  return { client, ...creds };
};

export const testDatabaseConnection = async (times = 20, backoff = 2000) => {
  try {
    await _getDatabaseClient();
    return true;
  } catch {
    if (times > 0) {
      await timeout(backoff);
      return testDatabaseConnection(times - 1, backoff + 2000);
    }
    console.error(`❗️ Could not connect to Postgres!\n`);
    return false;
  }
};

export const getDatabaseClient = async (forceCredentials = false) => {
  try {
    return _getDatabaseClient(forceCredentials);
  } catch (e) {
    console.error(`◦ ❗️ Postgres error: ${e.message}!\n`);
    // Force credentials on retry
    return getDatabaseClient(true);
  }
};

const getDatabaseCredentials = async (forceCredentials = false) => {
  if (!forceCredentials) {
    const config = await loadDevConfig();
    const { DB_USERNAME, DB_PASSWORD } = config;
    // Password is optional, username is required
    const isConfigured = DB_USERNAME || DB_PASSWORD;
    if (isConfigured) return { user: DB_USERNAME, password: DB_PASSWORD };
  }
  const input = await inquirer.prompt([
    {
      type: 'input',
      name: 'user',
      message: 'Enter database username (must have admin access rights)',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter database password',
      mask: '*',
    },
  ]);
  await saveDevConfig({ DB_USERNAME: input.user, DB_PASSWORD: input.password });
  return input;
};

export async function createDatabase(client, name) {
  const checkIfExists = await client.query(
    `SELECT COUNT(*) from pg_catalog.pg_database WHERE datname = '${name}'`,
  );
  if (checkIfExists.rows[0].count !== '0') return false;
  await client.query(`CREATE DATABASE "${name}"`);
  return true;
}
