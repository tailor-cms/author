import * as schemas from '../schemas/index.ts';
import * as service from '../integration.service.ts';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';

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
    } catch (err) {
      if (err instanceof service.IntegrationNotFoundError) {
        return createError(StatusCodes.NOT_FOUND, err.message);
      }
      throw err;
    }
  },
});
