import concurrently from 'concurrently';
import fkill from 'fkill';
import { portToPid } from 'pid-port';

// Kill running services occupying app ports
const SERVICE_PORTS = [3000, 8080];
for (const port of SERVICE_PORTS) {
  try {
    const pid = await portToPid(port);
    if (pid) await fkill(pid, { force: true });
  } catch {}
}

const appCommands = await Promise.all(
  ['backend', 'frontend'].map(async (name, index) => {
    return {
      name,
      prefixColor: ['blue', 'green'][index],
      command: `cd ./apps/${name} && pnpm dev`
    };
  }));

concurrently(appCommands);
