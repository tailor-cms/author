import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { toHttpError } from '../../errors.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../subscription.service.ts';
import * as threads from '../thread.service.ts';

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
      404: { description: 'Thread not found.' },
    },
  },
  async handler({ body, req, user }) {
    try {
      await service.setSubscriptions(req.thread!, body.topics);
    } catch (error) {
      return toHttpError(error);
    }
    return threads.getReaderThread(req.thread!, user.id);
  },
});
