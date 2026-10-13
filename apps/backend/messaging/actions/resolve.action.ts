import { RepositoryScopedParams } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { toHttpError } from '../errors.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../comment.service.ts';

export default defineAction({
  name: 'resolve',
  params: RepositoryScopedParams,
  body: schemas.ResolveInput,
  openapi: {
    authenticated: true,
    summary: 'Resolve or reopen editor comments',
    description: oneLine`
      Marks a comment settled, or every comment on a content element at
      once; the "resolve" control in the element flyout. Sending the
      current state back reopens it.
    `,
    responses: {
      204: { description: 'Resolved state flipped.' },
      400: { description: 'No comment or element named.' },
    },
  },
  async handler({ body, req }) {
    try {
      await service.setResolved(req.repository!, body);
    } catch (error) {
      return toHttpError(error);
    }
  },
});
