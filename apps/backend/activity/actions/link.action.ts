import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities/link
// Links an activity tree from potentially another repository into the target
// repository. `hasLinkSourceAccess` middleware verified the user has
// access to the source repository before this fires. The link service
// handles same-schema and cross-schema linking (with type transform).
const Body = z.object({
  // Source activity id (in a potentially different repository).
  sourceId: z.number().int().positive(),
  // Target parent activity (`null` links at the outline root).
  parentId: z.number().int().positive().nullable().optional(),
  // Position among siblings in the target.
  position: z.number().min(0),
});
export type LinkBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Link an activity from another repository',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.link(req.repository!, user, body);
  },
});
