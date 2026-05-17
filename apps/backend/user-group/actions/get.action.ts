import { defineAction } from '#shared/request/action.ts';

// GET /user-group/:id
// The `getUserGroup` param middleware loads the record, enforces the
// admin/group-admin gate, and returns 404 otherwise. This handler is a
// thin pass-through.
export default defineAction({
  openapi: {
    summary: 'Get a user group by id',
    authenticated: true,
  },
  async handler({ req }) {
    return req.userGroup!;
  },
});
