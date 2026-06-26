import path from 'node:path';
import boxen from 'boxen';
import dotenv from 'dotenv';
import { packageDirectory } from 'package-directory';
import { readPackageUpSync } from 'read-package-up';
import semver from 'semver';

const { packageJson: pkg } = readPackageUpSync();

// App root
const appDirectory = await packageDirectory();
// Monorepo root
const projectDirectory = await packageDirectory({
  cwd: path.join(appDirectory, '..'),
});

const dotenvLocation = path.join(projectDirectory, '.env');
dotenv.config({ path: dotenvLocation });

(function preflight() {
  const engines = pkg.engines || {};
  if (!engines.node) return;
  const checkPassed = semver.satisfies(process.versions.node, engines.node);
  if (checkPassed) return;
  warn(engines.node);
  console.error(' ✋  Exiting due to engine requirement check failure...\n');
  process.exit(1);
})();

await checkStorageClock();

// Dev-only guard: a drifted storage-server clock (commonly a local MinIO whose
// Docker VM paused while the host slept) makes the browser's fetch of presigned
// URLs fail with "Request is not valid yet";
async function checkStorageClock() {
  if (process.env.STORAGE_PROVIDER !== 'amazon') return;
  const endpoint = process.env.STORAGE_ENDPOINT;
  if (!endpoint) return;
  let serverDate;
  try {
    const res = await fetch(endpoint, { method: 'HEAD' });
    serverDate = res.headers.get('date');
  } catch {
    return; // unreachable now - let the app surface that, don't block on clock
  }
  if (!serverDate) return;
  const skewSeconds = Math.round((Date.parse(serverDate) - Date.now()) / 1000);
  if (Math.abs(skewSeconds) <= 30) return;
  warnClock(skewSeconds);
  console.error(' ✋ Exiting: storage clock skew will break presigned URLs.\n');
  process.exit(1);
}

function warnClock(skewSeconds) {
  const message = [
    `🕐  Storage clock is ${Math.abs(skewSeconds)}s `,
    `${skewSeconds < 0 ? 'behind' : 'ahead of'} this app`,
    'Presigned URLs will fail with "Request is not valid yet".',
    'Restart the storage container (e.g. docker compose restart minio).',
  ].join('\n');
  console.error(
    boxen(message, {
      borderColor: 'red',
      borderStyle: 'single',
      padding: 1,
      margin: 1,
      float: 'left',
      align: 'center',
    }),
  );
}

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
