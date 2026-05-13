import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { Description, ShortText } from '#shared/request/schemas.ts';
import { RepoData } from '../lib/data-attr.ts';
import * as service from '../repository.service.ts';

// POST /repositories
// Creates a repository seeded with schema-default meta and label color;
// optionally sharing it with the supplied user groups.
const Body = z.object({
  // Schema registry id this repo will follow (2..64 chars).
  schema: ShortText(2, 64),
  // Display name (2..250 chars).
  name: ShortText(2, 250),
  // Long description (2..2000 chars).
  description: Description(2, 2000),
  // Schema-defined meta blob. `$$` is the validated system namespace;
  // everything else flows as schema-defined meta (see data-attr.ts).
  data: RepoData.optional(),
  // Optional list of user-group ids to share the new repo with.
  userGroupIds: z.array(z.number().int()).optional(),
});
export type CreateBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Create a repository',
    authenticated: true,
  },
  async handler({ body, user }) {
    return service.create(body, user);
  },
});
