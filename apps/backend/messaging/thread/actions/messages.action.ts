import { Message } from '../../schemas/entity.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';
import * as schemas from '../schemas/index.ts';
import * as service from '../thread.service.ts';

export default defineAction({
  name: 'getMessages',
  params: schemas.ThreadItemParams,
  query: schemas.MessageFilter,
  openapi: {
    authenticated: true,
    summary: 'List messages in a thread',
    description: oneLine`
      A thread's messages, oldest first. Older ones load a page at a
      time.
    `,
    responses: {
      200: {
        description: 'Messages, oldest first.',
        schema: dataEnvelope(z.array(Message)),
      },
    },
  },
  handler({ params, query }) {
    return service.listMessages(params.threadId, query);
  },
});
