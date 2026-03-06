import chalk from 'chalk';
import dotenv from 'dotenv';
import { execaCommand } from 'execa';
import fs from 'node:fs/promises';
import ora from 'ora';
import path from 'node:path';

const configPath = path.join(process.cwd(), '.env');
const config = dotenv.parse(await fs.readFile(configPath, 'utf-8'));

const SERVICES = [
  {
    name: 'author-dev-postgres',
    image: 'docker.io/library/postgres:15.1',
    port: '5432:5432',
    env: {
      POSTGRES_DB: config.DATABASE_NAME || 'tailor_dev',
      POSTGRES_USER: config.DATABASE_USER || 'dev',
      POSTGRES_PASSWORD: config.DATABASE_PASSWORD || 'dev',
    },
  },
  {
    name: 'author-dev-redis',
    image: 'docker.io/library/redis:7.4.0',
    port: '6379:6379',
  },
  {
    name: 'author-dev-minio',
    image: 'docker.io/minio/minio',
    port: '4566:9000',
    env: {
      MINIO_ROOT_USER: config.STORAGE_KEY || 'test',
      MINIO_ROOT_PASSWORD: config.STORAGE_SECRET || 'test',
    },
    args: 'server /data',
  },
];

const run = (cmd) => execaCommand(cmd, { shell: true });

const ensureCLI = async () => {
  try {
    await run('which container');
  } catch {
    console.error(chalk.red('Apple Container CLI not found.'));
    console.error(chalk.dim('Install via: brew install container'));
    process.exit(1);
  }
};

await ensureCLI();

const runQuiet = async (cmd) => {
  try {
    return await run(cmd);
  } catch {
    return null;
  }
};

const status = async () => {
  const output = await listRunning();
  console.log(output || chalk.dim('  No containers running.'));
};

const listRunning = async () => {
  const result = await runQuiet('container list');
  return result?.stdout || '';
};

const isRuntimeUp = async () => !!(await listRunning());

const startRuntime = async () => {
  const spinner = ora('Checking runtime...').start();
  if (await isRuntimeUp()) {
    spinner.succeed('Runtime is running');
    return;
  }
  spinner.text = 'Starting runtime...';
  try {
    await run('container system start');
    spinner.succeed('Runtime started');
  } catch (err) {
    spinner.fail('Failed to start runtime');
    throw err;
  }
};

const startService = async ({ name, image, port, env, args }, running) => {
  const label = chalk.cyan(name);
  const spinner = ora(`Starting ${label}...`).start();
  if (running.includes(name)) {
    spinner.info(`${label} already running`);
    return;
  }
  await runQuiet(`container rm ${name}`);
  const envFlags = Object.entries(env || {})
    .map(([k, v]) => `-e ${k}=${v}`)
    .join(' ');
  const flags = [`-d`, `--name ${name}`, `-p ${port}`, envFlags, image, args]
    .filter(Boolean)
    .join(' ');
  try {
    await run(`container run ${flags}`);
    spinner.succeed(`${label} started`);
  } catch (err) {
    spinner.fail(`${label} failed to start`);
    throw err;
  }
};

const start = async () => {
  await startRuntime();
  console.log();
  const running = await listRunning();
  await Promise.all(SERVICES.map((svc) => startService(svc, running)));
  console.log();
  await status();
};

const stopService = async (name, running) => {
  const label = chalk.cyan(name);
  const spinner = ora(`Stopping ${label}...`).start();
  if (running.includes(name)) await runQuiet(`container stop ${name}`);
  await runQuiet(`container rm ${name}`);
  spinner.succeed(`${label} stopped`);
};

const stop = async () => {
  const running = await listRunning();
  await Promise.all(SERVICES.map(({ name }) => stopService(name, running)));
};

const restart = async () => {
  await stop();
  console.log();
  await start();
};

const logs = async (name) => {
  const target = name || SERVICES[0].name;
  const result = await run(`container logs ${target}`);
  console.log(result.stdout);
};

// ---------------------- CLI --------------------------

const [command, ...args] = process.argv.slice(2);

const commands = {
  start,
  up: start,
  stop,
  down: stop,
  status,
  ps: status,
  restart,
  logs,
};
const handler = commands[command || 'start'];

if (!handler) {
  console.log(
    `Usage: node containers.js {${Object.keys(commands).join('|')}} [name]`,
  );
  process.exit(1);
}

await handler(args[0]);
