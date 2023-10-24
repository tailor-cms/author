import boxen from 'boxen';
import { execaCommand } from 'execa';
import minimist from 'minimist';
import setEnv from './set-env.js';
import shell from 'shelljs';

const log = (msg) => console.log(`${msg}\n`);

const argv = minimist(process.argv.slice(2));
const envLabel = argv.ci ? 'CI' : 'DEV';

console.log(
  boxen(`${envLabel} setup`, {
    title: 'Tailor CMS',
    titleAlignment: 'center',
    padding: 1,
    margin: 1,
    borderColor: 'blue',
  })
);

log(`◦ 🟡 Initialising ${envLabel} setup`);
log('◦ 🤫 Setup environment variables');
await setEnv({ dbPrefix: argv.dbPrefix, ci: !!argv.ci });
log('\n◦ ✅ Environment successfully configured!');
log('◦ 📦 Installing dependencies');
await execaCommand('pnpm i --prefer-offline');
log('◦ ✅ Installed dependencies');
log('◦ 🏗️  Build');
await execaCommand('pnpm build');
log(`◦ ✅ App built`);
log('◦ 🎆 Good to go!');
shell.exit(0);
