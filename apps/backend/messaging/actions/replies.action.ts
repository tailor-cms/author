import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';
import * as schemas from '../schemas/index.ts';
import * as service from '../comment.service.ts';

export default defineAction({
  name: 'getReplies',
  params: schemas.MessageItemParams,
  query: schemas.MessageFilter,
  openapi: {
    authenticated: true,
    summary: 'List replies to a message',
    description: oneLine`
      The side conversation under one message, oldest first. Fetched on
      demand so a long reply chain does not slow the thread down; older
      replies load a page at a time.
    `,
    responses: {
      200: {
        description: 'Replies to the message.',
        schema: dataEnvelope(z.array(schemas.Message)),
      },
    },
  },
  handler({ params, query, req }) {
    const { messageId } = params;
    return service.listReplies(req.repository!.id, messageId, query);
  },
});
