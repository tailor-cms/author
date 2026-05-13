import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { Description, ShortText } from '#shared/request/schemas.ts';
import { RepoData } from '../lib/data-attr.ts';
import * as service from '../repository.service.ts';

// PATCH /repositories/:repositoryId
// Updates mutable fields. The service picks name/description/data and
// drops anything else the body carries.
const Body = z.object({
  // New display name (2..250 chars).
  name: ShortText(2, 250).optional(),
  // New description (2..2000 chars).
  description: Description(2, 2000).optional(),
  // Replacement schema-meta blob (full replacement; FE merges before
  // send). `$$` shape is enforced via RepoData; server-managed
  // fields are stripped in the service before persisting.
  data: RepoData.optional(),
});
export type PatchBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Patch a repository',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.update(req.repository!, body, user);
  },
});
