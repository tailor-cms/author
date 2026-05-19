import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../activity.schema.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities/link
// Links an activity tree from potentially another repository into the target
// repository. `hasLinkSourceAccess` middleware verified the user has
// access to the source repository before this fires. The link service
// handles same-schema and cross-schema linking (with type transform).
export default defineAction({
  body: schemas.LinkBody,
  openapi: {
    summary: 'Link an activity from another repository',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.link(req.repository!, user, body);
  },
});
