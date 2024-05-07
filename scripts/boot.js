import concurrently from 'concurrently';
import dotenv from 'dotenv';
import fkill from 'fkill';
import fs from 'node:fs/promises';
import path from 'node:path';
import { portToPid } from 'pid-port';

const configLocation = path.join(process.cwd(), '.env');
const config = await fs.readFile(configLocation, 'utf-8');

const { PORT, REVERSE_PROXY_PORT, NUXT_PUBLIC_AI_UI_ENABLED } =
  dotenv.parse(config);

if (
  PORT === undefined ||
  REVERSE_PROXY_PORT === undefined ||
  PORT === REVERSE_PROXY_PORT
) {
  throw new Error('PORT and REVERSE_PROXY_PORT must be defined and different');
}

// Kill running services occupying app ports
for (const port of [PORT, REVERSE_PROXY_PORT]) {
  try {
    const pid = await portToPid(port);
    if (pid) await fkill(pid, { force: true });
  } catch {}
}

// Proxy public environment variables
process.env.NUXT_PUBLIC_AI_UI_ENABLED = NUXT_PUBLIC_AI_UI_ENABLED;

const appCommands = await Promise.all(
  ['backend', 'frontend'].map(async (name, index) => {
    return {
      name,
      prefixColor: ['blue', 'green'][index],
      command: `cd ./apps/${name} && pnpm dev`,
    };
  }),
);

concurrently(appCommands);
