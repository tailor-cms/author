import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../content-element.schema.ts';
import * as service from '../content-element.service.ts';

// POST /repositories/:repositoryId/content-elements/link
// Links an element from another repository as a linked copy in the target
// repository. The `hasLinkSourceAccess` middleware loaded the source and
// verified the user has access to the source's repo before this fires.
async function handler({
  body,
  user,
  req,
}: Ctx<{ body: typeof schemas.LinkInput }>) {
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
  body: schemas.LinkInput,
  openapi: {
    summary: 'Link a content element from another repository',
    authenticated: true,
    responses: {
      200: { description: 'Linked copy created' },
      404: { description: 'Source element not found' },
    },
  },
  handler,
});
