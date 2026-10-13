import * as schemas from '../schemas/index.ts';
import * as service from '../integration.service.ts';
import { defineAction } from '#shared/request/action.ts';
import { toHttpError } from '../../errors.ts';

export default defineAction({
  name: 'removeIntegration',
  params: schemas.IntegrationItemParams,
  openapi: {
    authenticated: true,
    summary: 'Remove an integration',
    responses: {
      204: { description: 'Integration removed.' },
      403: { description: 'Repository admin access required.' },
      404: { description: 'Integration not found for this repository.' },
    },
  },
  async handler({ params, req }) {
    try {
      await service.remove(req.repository!.id, params.integrationId);
    } catch (error) {
      return toHttpError(error);
    }
  },
});
