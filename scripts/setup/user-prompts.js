import { portToPid } from 'pid-port';
import select from '@inquirer/select';

export async function shouldUseComposeSpec() {
  const dbPid = await portToPid(5432).catch(() => null);
  const portActiveMsg = dbPid ? 'Port 5432 already in use!' : '';
  return select({
    message: 'Select the database setup method:',
    choices: [
      {
        name: `Configure Docker to provide DB service. ${portActiveMsg}`,
        value: true,
        disabled: !!dbPid,
      },
      {
        name: 'I already have a DB service running',
        value: false,
      },
    ],
  });
}

export function shouldSeedTheDatabase() {
  return select({
    message: 'Seed the database?',
    choices: [
      {
        name: 'Yes',
        value: true,
      },
      {
        name: 'No',
        value: false,
      },
    ],
  });
}
