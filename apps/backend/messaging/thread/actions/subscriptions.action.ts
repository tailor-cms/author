import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { toHttpError } from '../errors.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../thread.service.ts';

export default defineAction({
  name: 'setSubscriptions',
  params: schemas.ThreadItemParams,
  body: schemas.SetSubscriptionsInput,
  openapi: {
    authenticated: true,
    summary: 'Set what a thread subscribes to',
    description: `Replaces the thread's integration subscriptions`,
    responses: {
      200: {
        description: 'Updated thread.',
        schema: dataEnvelope(schemas.ReaderThread),
      },
      400: {
        description: oneLine`
          One or more topics are not subscribable, or the thread is
          anchored to content and cannot subscribe at all.
        `,
      },
      404: { description: 'Thread not found in this repository.' },
    },
  },
  async handler({ body, params, req, user }) {
    const repositoryId = req.repository!.id;
    try {
      await service.assertKnownTopics(repositoryId, body.topics);
      return await service.setSubscriptions(
        repositoryId,
        params.threadId,
        body.topics,
        user.id,
      );
    } catch (error) {
      return toHttpError(error);
    }
  },
});
