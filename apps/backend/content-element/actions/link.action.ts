import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../content-element.service.ts';

// POST /repositories/:repositoryId/content-elements/link
async function handler({
  body,
  user,
  req,
}: Ctx<{
  body: typeof schemas.LinkInput;
  params: typeof RepositoryScopedParams;
}>) {
  try {
    return await service.link(req.repository!, user, body);
  } catch (err) {
    if (err instanceof service.SourceNotFoundError) {
      return createError(StatusCodes.NOT_FOUND, err.message);
    }
    throw err;
  }
}

export default defineAction({
  name: 'link',
  params: RepositoryScopedParams,
  body: schemas.LinkInput,
  openapi: {
    authenticated: true,
    summary: 'Link a content element',
    description: 'Creates a linked copy of the source element.',
    responses: {
      200: {
        description: 'Linked copy created in the target repository.',
        schema: dataEnvelope(schemas.ContentElement),
      },
      403: { description: 'No access to the source repository.' },
      404: { description: 'Source element not found.' },
    },
  },
  handler,
});
