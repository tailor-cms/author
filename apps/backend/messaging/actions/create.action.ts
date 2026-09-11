import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { toHttpError } from '../errors.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../comment.service.ts';

export default defineAction({
  name: 'create',
  params: RepositoryScopedParams,
  body: schemas.CreateInput,
  openapi: {
    authenticated: true,
    summary: 'Post a comment',
    description: oneLine`
      Posts on an activity or a content element, or into an existing
      thread. Conversations stay one level deep, so replying to a reply
      lands next to it rather than under it.
    `,
    responses: {
      200: {
        description: 'The posted comment.',
        schema: dataEnvelope(schemas.Comment),
      },
      400: { description: 'No activity, element or thread to post on.' },
      404: { description: 'The message being replied to is gone.' },
    },
  },
  async handler({ body, user, req }) {
    try {
      return await service.create(req.repository!, user, body);
    } catch (error) {
      return toHttpError(error);
    }
  },
});
