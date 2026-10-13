import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';
import * as schemas from '../schemas/index.ts';
import * as service from '../emoji.service.ts';

export default defineAction({
  name: 'getEmoji',
  openapi: {
    summary: 'List emoji',
    description: oneLine`
      Every emoji in the platform, with a content-addressed URL
      for each. Small and unpaginated by design: it is the dictionary a
      client needs before rendering a message.
    `,
    authenticated: true,
    responses: {
      200: {
        description: 'The emoji manifest.',
        schema: dataEnvelope(z.array(schemas.Emoji)),
      },
    },
  },
  handler() {
    return service.list();
  },
});
