import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { toHttpError } from '../errors.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../thread.service.ts';

export default defineAction({
  name: 'resolveThread',
  params: schemas.ThreadItemParams,
  body: schemas.SetResolvedInput,
  openapi: {
    authenticated: true,
    summary: 'Resolve or reopen a thread',
    description: oneLine`
      Settles every comment in the thread at once, or reopens them.
      A resolved thread stays in the list unless it is filtered to open
      ones only. Anyone with access to the repository can do either.
    `,
    responses: {
      200: {
        description: 'Updated thread.',
        schema: dataEnvelope(schemas.ReaderThread),
      },
      400: { description: 'A free-standing thread has nothing to resolve.' },
      404: { description: 'Thread not found in this repository.' },
    },
  },
  async handler({ body, params, req, user }) {
    try {
      return await service.setResolved(
        req.repository!.id,
        params.threadId,
        body.resolved,
        user.id,
      );
    } catch (error) {
      return toHttpError(error);
    }
  },
});
