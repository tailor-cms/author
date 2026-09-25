import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import * as schemas from '../schemas/index.ts';
import * as service from '../thread.service.ts';

export default defineAction({
  name: 'markThreadRead',
  params: schemas.ThreadItemParams,
  openapi: {
    authenticated: true,
    summary: 'Mark a thread read',
    description: oneLine`
      Marks everything in the thread as read for you, and clears its
      mentions.
    `,
    responses: {
      200: {
        description: 'Where your reading now stands.',
        schema: dataEnvelope(schemas.ReadWatermark),
      },
      404: { description: 'Thread not found.' },
    },
  },
  handler({ user, req }) {
    return service.markRead(req.thread!, user.id);
  },
});
