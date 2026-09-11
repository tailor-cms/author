import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import * as schemas from '../schemas/index.ts';
import * as service from '../thread.service.ts';

export default defineAction({
  name: 'setStarred',
  params: schemas.ThreadItemParams,
  body: schemas.SetStarredInput,
  openapi: {
    authenticated: true,
    summary: 'Star or unstar a thread',
    description: oneLine`
      A star is personal: it keeps the thread at the top of your own
      list.
    `,
    responses: {
      200: {
        description: 'Updated thread.',
        schema: dataEnvelope(schemas.ReaderThread),
      },
      404: { description: 'Thread not found.' },
    },
  },
  handler({ body, req, user }) {
    return service.setStarred(req.thread!, user.id, body.isStarred);
  },
});
