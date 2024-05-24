import boxen from 'boxen';
import chalk from 'chalk';
import { createRequire } from 'module';
import { execaCommand } from 'execa';
import minimist from 'minimist';
import setEnv from './set-env.js';
import { saveDevConfig } from './dotenv.js';
import shell from 'shelljs';
import { testDatabaseConnection } from './database.js';
import { shouldUseComposeSpec, shouldSeedTheDatabase } from './user-prompts.js';

const users = createRequire(import.meta.url)('tailor-seed/user.json');

const log = (msg) => console.log(`${msg}\n`);

const argv = minimist(process.argv.slice(2));
const hasCiFlag = !!argv.ci;
const envLabel = hasCiFlag ? 'CI' : 'DEV';
const defaultUser = users[0];

async function handleComposeSpecOption() {
  if (!(await shouldUseComposeSpec())) return false;
  log('\n◦ 🐳 Using the Compose setup');
  log('◦ 🐳 Building the Compose spec...');
  await execaCommand('docker compose -f docker-compose.dev.yaml build');
  log('◦ 🐳 Running the Compose spec...');
  execaCommand('docker compose -f docker-compose.dev.yaml up');
  await saveDevConfig({ DB_USERNAME: 'dev', DB_PASSWORD: 'dev' });
  log('◦ 🐳 Testing the DB connection...');
  await testDatabaseConnection();
  return true;
}

console.log(
  boxen(`${envLabel} setup`, {
    title: 'Tailor CMS',
    titleAlignment: 'center',
    borderStyle: 'double',
    padding: 2,
    margin: 1,
    borderColor: 'green',
  }),
);

log(`◦ 🟡 Initialising ${envLabel} setup`);

const isUsingComposeSpec = !hasCiFlag && (await handleComposeSpecOption());

log('◦ 🤫 Setup environment variables');
const afterAllHooks = (await setEnv({ dbPrefix: argv.dbPrefix })) || [];
log('◦ ✅ Environment successfully configured!');
log('◦ 🏗️  Build');
await execaCommand('pnpm build');
log(`◦ ✅ App built`);

const hasUserRequestedSeed = await shouldSeedTheDatabase();
if (hasUserRequestedSeed) {
  log('\n◦ 🌱 Seeding the database...');
  try {
    await execaCommand('pnpm db:migrate');
    await execaCommand('pnpm seed');
    log('◦ ✅ Database seeded');
  } catch {
    log('◦ ℹ️ DB seed failed. Most likely, the database is already seeded...');
  }
}

for (const afterHook of afterAllHooks) {
  await afterHook();
}

log('◦ 🎆 Good to go!\n');

if (!hasUserRequestedSeed) {
  log(
    `If DB is not initialized, seed it by running: ${chalk.green('pnpm seed')}`,
  );
}

if (isUsingComposeSpec) {
  log(`To start the app and docker services run: ${chalk.green('pnpm dc')}`);
} else {
  log(`To start the app run: ${chalk.green('pnpm dev')}`);
}

if (hasUserRequestedSeed)
  log(`Sign in with the following credentials:\n
  username: ${chalk.green(defaultUser.email)}
  password: ${chalk.green(defaultUser.password)}`);

shell.exit(0);
