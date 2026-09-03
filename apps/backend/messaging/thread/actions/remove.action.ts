import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { toHttpError } from '../errors.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../thread.service.ts';

export default defineAction({
  name: 'deleteThread',
  params: schemas.ThreadItemParams,
  openapi: {
    authenticated: true,
    summary: 'Delete a thread',
    description: oneLine`
      Deletes a repository-level thread and its messages. A thread
      attached to an activity or element cannot be deleted - its
      messages are the comments shown in the editor. Resolve it instead.
    `,
    responses: {
      200: {
        description: 'Id of the deleted thread.',
        schema: dataEnvelope(schemas.RemoveResult),
      },
      403: { description: 'Not the author, or the thread is anchored.' },
      404: { description: 'Thread not found in this repository.' },
    },
  },
  async handler({ params, user, req }) {
    try {
      return await service.removeThread(
        req.repository!.id,
        params.threadId,
        user,
      );
    } catch (error) {
      return toHttpError(error);
    }
  },
});
