import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
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
      404: { description: 'The message being replied to is gone.' },
    },
  },
  async handler({ body, user, req }) {
    try {
      return await service.create(req.repository!, user, body);
    } catch (error) {
      if (error instanceof service.ParentNotFoundError) {
        return createError(StatusCodes.NOT_FOUND, error.message);
      }
      throw error;
    }
  },
});
