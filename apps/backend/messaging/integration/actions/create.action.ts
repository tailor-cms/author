import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../integration.service.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { toHttpError } from '../../errors.ts';

export default defineAction({
  name: 'createIntegration',
  params: RepositoryScopedParams,
  body: schemas.CreateIntegrationInput,
  openapi: {
    authenticated: true,
    summary: 'Register an integration',
    description: oneLine`
      Returns the token to post with. It is shown once; only its digest
      is stored.
    `,
    responses: {
      200: {
        description: 'Registered integration and its one-time token.',
        schema: dataEnvelope(schemas.CreateIntegrationResult),
      },
      403: { description: 'Repository admin access required.' },
      409: { description: 'Key already taken in this repository.' },
    },
  },
  async handler({ body, user, req }) {
    try {
      const { integration, token } = await service.create(
        req.repository!.id,
        user.id,
        body,
      );
      return { ...integration.toJSON(), token };
    } catch (error) {
      return toHttpError(error);
    }
  },
});
