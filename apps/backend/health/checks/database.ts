import db from '#shared/database/index.js';
import type { Check } from './types.ts';

// The only hard dependency: without Postgres the service cannot serve any
// meaningful request, so a failure here drives readiness to 503.
const database: Check = {
  name: 'postgres',
  componentType: 'datastore',
  critical: true,
  readiness: true,
  async run() {
    const start = performance.now();
    await db.sequelize.query('SELECT 1');
    return {
      status: 'pass',
      observedValue: Math.round(performance.now() - start),
      observedUnit: 'ms',
    };
  },
};

export default database;
