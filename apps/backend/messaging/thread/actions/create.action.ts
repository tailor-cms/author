import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import * as schemas from '../schemas/index.ts';
import * as service from '../thread.service.ts';

export default defineAction({
  name: 'createThread',
  params: RepositoryScopedParams,
  body: schemas.CreateThreadInput,
  openapi: {
    authenticated: true,
    summary: 'Start a thread',
    description: oneLine`
      Creates a repository-level thread and posts its opening message.
    `,
    responses: {
      200: {
        description: 'The new thread.',
        schema: dataEnvelope(schemas.ReaderThread),
      },
    },
  },
  handler({ body, user, req }) {
    return service.createThread(req.repository!, user, body);
  },
});
