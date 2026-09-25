import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import * as schemas from '../schemas/index.ts';
import * as service from '../comment.service.ts';

export default defineAction({
  name: 'update',
  params: schemas.MessageItemParams,
  body: schemas.PatchInput,
  openapi: {
    authenticated: true,
    summary: 'Edit a message',
    description: oneLine`
      Replaces the text. Only the author can edit, and the message
      carries an "edited" mark from then on.
    `,
    responses: {
      200: {
        description: 'The edited message.',
        schema: dataEnvelope(schemas.Comment),
      },
      403: { description: 'Not the author.' },
      404: { description: 'Message not found.' },
    },
  },
  handler({ body, req }) {
    return service.update(req.message!, body.content);
  },
});
