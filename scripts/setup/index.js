import boxen from 'boxen';
import chalk from 'chalk';
import { execaCommand } from 'execa';
import minimist from 'minimist';
import setEnv from './set-env.js';
import shell from 'shelljs';
import users from 'tailor-seed/user.json' assert { type: 'json' };

const log = (msg) => console.log(`${msg}\n`);

const argv = minimist(process.argv.slice(2));
const envLabel = argv.ci ? 'CI' : 'DEV';
const defaultUser = users[0];

console.log(
  boxen(`${envLabel} setup`, {
    title: 'Tailor CMS',
    titleAlignment: 'center',
    borderStyle: 'double',
    padding: 2,
    margin: 1,
    borderColor: 'green',
  })
);

log(`◦ 🟡 Initialising ${envLabel} setup`);
log('◦ 🤫 Setup environment variables');
await setEnv({ dbPrefix: argv.dbPrefix });
log('◦ ✅ Environment successfully configured!');
log('◦ 📦 Installing dependencies');
await execaCommand('pnpm i --prefer-offline');
log('◦ ✅ Installed dependencies');
log('◦ 🏗️  Build');
await execaCommand('pnpm build');
log(`◦ ✅ App built`);
log('◦ 🎆 Good to go!');
log(`
  To start the app in the development mode run: ${chalk.green('pnpm dev')}
  Sign in with the following credentials:
  username: ${chalk.green(defaultUser.email)}
  password: ${chalk.green(defaultUser.password)}`);
shell.exit(0);
