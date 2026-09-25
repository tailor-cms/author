import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../integration.service.ts';
import { oneLine } from 'common-tags';
import { defineAction } from '#shared/request/action.ts';
import { z } from 'zod';

export default defineAction({
  name: 'getIntegrations',
  params: RepositoryScopedParams,
  openapi: {
    authenticated: true,
    summary: 'List integrations',
    description: oneLine`
      Tailor's built-in integrations plus those registered on this
      repository.
    `,
    responses: {
      200: {
        description: 'Integrations visible to this repository.',
        schema: dataEnvelope(z.array(schemas.Integration)),
      },
    },
  },
  async handler({ req }) {
    return service.list(req.repository!.id);
  },
});
