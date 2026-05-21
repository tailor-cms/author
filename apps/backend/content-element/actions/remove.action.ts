import { defineAction } from '#shared/request/action.ts';
import * as service from '../content-element.service.ts';

// DELETE /repositories/:repositoryId/content-elements/:elementId
// Soft-deletes the element.
export default defineAction({
  openapi: {
    summary: 'Soft-delete a content element',
    authenticated: true,
    responses: { 204: { description: 'No content' } },
  },
  async handler({ user, req }) {
    await service.remove(req.repository!, user, req.contentElement!);
  },
});
