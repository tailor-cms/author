import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { toHttpError } from '../errors.ts';
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
      404: { description: 'Thread not found in this repository.' },
    },
  },
  async handler({ params, req, user }) {
    try {
      return await service.readThread(
        req.repository!.id,
        params.threadId,
        user.id,
      );
    } catch (error) {
      return toHttpError(error);
    }
  },
});
