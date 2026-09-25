import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';
import * as schemas from '../schemas/index.ts';
import * as service from '../comment.service.ts';

export default defineAction({
  name: 'getReplies',
  params: schemas.MessageItemParams,
  openapi: {
    authenticated: true,
    summary: 'List replies to a message',
    description: oneLine`
      The side conversation under one message, oldest first. Fetched on
      demand so a long reply chain does not slow the thread down.
    `,
    responses: {
      200: {
        description: 'Replies to the message.',
        schema: dataEnvelope(z.array(schemas.Message)),
      },
    },
  },
  handler({ params, req }) {
    return service.listReplies(req.repository!.id, params.messageId);
  },
});
