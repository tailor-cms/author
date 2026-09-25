import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import * as schemas from '../schemas/index.ts';
import * as service from '../comment.service.ts';

export default defineAction({
  name: 'delete',
  params: schemas.MessageItemParams,
  openapi: {
    authenticated: true,
    summary: 'Delete a message',
    description: oneLine`
      Only the author can delete. The message keeps its place as a
      "deleted" placeholder so the replies around it still read.
    `,
    responses: {
      200: {
        description: 'Id of the deleted message.',
        schema: dataEnvelope(schemas.RemoveResult),
      },
      403: { description: 'Not the author.' },
      404: { description: 'Message not found.' },
    },
  },
  handler({ req }) {
    return service.remove(req.message!);
  },
});
