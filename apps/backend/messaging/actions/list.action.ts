import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';
import * as schemas from '../schemas/index.ts';
import * as service from '../comment.service.ts';

export default defineAction({
  name: 'list',
  params: RepositoryScopedParams,
  query: schemas.ListFilter,
  openapi: {
    authenticated: true,
    summary: 'List comments',
    description: oneLine`
      Comments on one activity, or on a single content element. The
      editor asks for a whole activity at once and splits the result
      per element. Newest first; deleted ones stay as placeholders so a
      reply never loses what it was answering.
    `,
    responses: {
      200: {
        description: 'Comments matching the filter.',
        schema: dataEnvelope(z.array(schemas.Comment)),
      },
    },
  },
  handler({ query, req }) {
    return service.list(req.repository!, req.opts!, query);
  },
});
