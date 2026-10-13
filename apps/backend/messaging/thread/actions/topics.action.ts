import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';
import * as schemas from '../schemas/index.ts';
import * as service from '../subscription.service.ts';

export default defineAction({
  name: 'getTopics',
  params: RepositoryScopedParams,
  openapi: {
    authenticated: true,
    summary: 'List subscribable sources',
    description: oneLine`
      Everything a thread in this repository can subscribe to: the
      built-in event catalog plus any registered integration.
    `,
    responses: {
      200: {
        description: 'Available topics.',
        schema: dataEnvelope(z.array(schemas.SubscriptionTopic)),
      },
    },
  },
  handler({ req }) {
    return service.listTopics(req.repository!.id);
  },
});
