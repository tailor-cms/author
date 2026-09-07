import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import * as schemas from '../schemas/index.ts';
import * as service from '../comment.service.ts';

export default defineAction({
  name: 'toggleReaction',
  params: schemas.CommentItemParams,
  body: schemas.ToggleReactionInput,
  openapi: {
    authenticated: true,
    summary: 'Add or remove a reaction',
    description: oneLine`
      Reacting again with the same emoji takes it back, so a double-tap
      cannot leave a reaction stuck. Anyone who can read the comment can
      react to it.
    `,
    responses: {
      200: {
        description: 'The comment reactions after the toggle.',
        schema: dataEnvelope(schemas.ReactionResult),
      },
      404: { description: 'Comment not found.' },
    },
  },
  handler({ body, req, user }) {
    return service.toggleReaction(req.comment!, user.id, body.emoji);
  },
});
