import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { toHttpError } from '../errors.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../comment.service.ts';

export default defineAction({
  name: 'setBroadcast',
  params: schemas.MessageItemParams,
  body: schemas.SetBroadcastInput,
  openapi: {
    authenticated: true,
    summary: 'Send a reply to its thread, or take it out',
    description: oneLine`
      Shows an already sent reply in the thread itself as well, as "Also
      send to thread" does when replying, or removes it from there. In
      the thread it keeps the time it was written. Only the author can
      change it.
    `,
    responses: {
      200: {
        description: 'The reply.',
        schema: dataEnvelope(schemas.Comment),
      },
      400: { description: 'Not a reply, or deleted.' },
      403: { description: 'Not the author.' },
      404: { description: 'Message not found.' },
    },
  },
  async handler({ body, req }) {
    try {
      return await service.setBroadcast(req.message!, body.isBroadcast);
    } catch (error) {
      return toHttpError(error);
    }
  },
});
