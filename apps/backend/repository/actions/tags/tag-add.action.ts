import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { ShortText } from '#shared/request/schemas.ts';
import * as service from '../../repository.service.ts';

// POST /repositories/:repositoryId/tags
// Attaches a tag to the repository, creating the Tag row if missing.
const Body = z.object({
  // Tag name; created on the fly if missing (1..100 chars).
  name: ShortText(1, 100),
});
export type AddTagBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Attach a tag to a repository',
    authenticated: true,
  },
  async handler({ body, req }) {
    return service.addTag(req.repository!, body.name);
  },
});
