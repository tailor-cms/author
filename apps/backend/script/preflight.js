import boxen from 'boxen';
import dotenv from 'dotenv';
import { readPackageUpSync } from 'read-pkg-up';
import semver from 'semver';

import { packageDirectory } from 'pkg-dir';

// App root
const appDirectory = await packageDirectory();
// Monorepo root
const projectDirectory = await packageDirectory({
  cwd: path.join(appDirectory, '..'),
});

dotenv.config({ path: path.join(projectDirectory, '.env') });

(function preflight() {
  const engines = pkg.engines || {};
  if (!engines.node) return;
  const checkPassed = semver.satisfies(process.versions.node, engines.node);
  if (checkPassed) return;
  warn(engines.node);
  console.error(' ✋  Exiting due to engine requirement check failure...\n');
  process.exit(1);
}());

function warn(range, current = process.version, name = pkg.name) {
  const options = {
    borderColor: 'red',
    borderStyle: 'single',
    padding: 1,
    margin: 1,
    float: 'left',
    align: 'center',
  };
  const message = `🚨  ${name} requires node ${range}\n current version is ${current}`;
  console.error(boxen(message, options));
}
