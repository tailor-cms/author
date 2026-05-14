import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { IntParam } from '#shared/request/schemas.ts';
import * as service from '../user.service.ts';

// DELETE /users/:id
// Admin-driven user removal. Soft-delete via the model's paranoid mode.
const Params = z.object({
  id: IntParam(),
});

export default defineAction({
  params: Params,
  openapi: {
    summary: 'Remove a user (admin)',
    authenticated: true,
    responses: { 204: { description: 'No content' } },
  },
  async handler({ params }) {
    await service.remove(params.id);
  },
});
