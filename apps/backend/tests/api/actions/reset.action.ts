import { StatusCodes } from 'http-status-codes';
import { oneLine } from 'common-tags';
import { defineAction } from '#shared/request/action.ts';
import service from '../seed.service.ts';

// POST /seed/reset
// Drops all tables, re-runs migrations, reseeds the user table, and
// clears the in-memory activity feed cache. Test-only.
export default defineAction({
  name: 'reset',
  status: StatusCodes.OK,
  openapi: {
    summary: 'Reset the database',
    description: oneLine`
      Drops all tables, re-runs migrations, reseeds the user table from
      the tailor-seed fixtures, and clears the in-memory activity feed
      cache. Test-only.
    `,
    authenticated: true,
    responses: { 200: { description: 'Database reset completed.' } },
  },
  async handler() {
    await service.resetDatabase();
  },
});
