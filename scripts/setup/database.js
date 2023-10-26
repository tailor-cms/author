import { loadDevConfig, saveDevConfig } from './dotenv.js';
import inquirer from 'inquirer';
import pg from 'pg';

const { Client } = pg;

export const getDatabaseClient = async () => {
  try {
    const creds = await getDatabaseCredentials();
    const client = new Client({
      database: 'postgres',
      host: 'localhost',
      port: 5432,
      ...creds,
    });
    await client.connect();
    return { client, ...creds };
  } catch (e) {
    console.log('Unable to connect, please try again...', e);
    return getDatabaseClient();
  }
};

const getDatabaseCredentials = async () => {
  const config = await loadDevConfig();
  const isConfigured = config.DB_USERNAME && config.DB_PASSWORD;
  if (isConfigured) return { user: config.DB_USERNAME, password: config.DB_PASSWORD };
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
    `SELECT COUNT(*) from pg_catalog.pg_database WHERE datname = '${name}'`
  );
  if (checkIfExists.rows[0].count !== '0') return false;
  await client.query(`CREATE DATABASE "${name}"`);
  return true;
}
