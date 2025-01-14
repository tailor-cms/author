import { createRequire } from 'node:module';
import path from 'node:path';
import dargs from 'dargs';
import dotenv from 'dotenv';
import minimist from 'minimist';
import { packageDirectory } from 'pkg-dir';
import safeRequire from 'safe-require';

// App root
const appDirectory = await packageDirectory();
// Monorepo root
const projectDirectory = await packageDirectory({
  cwd: path.join(appDirectory, '..'),
});
const dotenvLocation = path.join(projectDirectory, '.env');
dotenv.config({ path: dotenvLocation });

const require = createRequire(import.meta.url);

const actions = ['migrate', 'seed', 'create', 'drop'];
const isAction = (cmd) => actions.some((it) => cmd.startsWith(it));

// Load config.
const config = safeRequire(path.join(process.cwd(), 'sequelize.config.cjs'));
if (!config) {
  console.error('Error: `sequelize.config.cjs` not found');
  process.exit(1);
}

const argv = minimist(process.argv.slice(2));
process.argv.length = 2;

// Resolve command with arguments.
const args = getArgs(argv);
process.argv.push(...args);

// Resolve options.
const options = Object.assign({}, config, getOptions(argv));
process.argv.push(...dargs(options));

// Make it rain!

require('sequelize-cli/lib/sequelize');

function getArgs(argv) {
  let [cmd, ...args] = argv._;
  if (!cmd) return args;
  if (isAction(cmd)) cmd = `db:${cmd}`;
  return [cmd, ...args];
}

function getOptions(argv) {
  return reduce(
    argv,
    (acc, val, key) => {
      if (['_', '--'].includes(key)) return acc;
      return Object.assign(acc, { [key]: val });
    },
    {},
  );
}

function reduce(obj, callback, initialValue) {
  return Object.keys(obj).reduce((acc, key) => {
    return callback(acc, obj[key], key);
  }, initialValue);
}
