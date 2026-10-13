import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../thread.service.ts';

export default defineAction({
  name: 'getThread',
  params: schemas.ThreadItemParams,
  openapi: {
    authenticated: true,
    summary: 'Get a thread',
    responses: {
      200: {
        description: 'A thread with a reader state.',
        schema: dataEnvelope(schemas.ReaderThread),
      },
      404: { description: 'Thread not found.' },
    },
  },
  handler({ req, user }) {
    return service.getReaderThread(req.thread!, user.id);
  },
});
