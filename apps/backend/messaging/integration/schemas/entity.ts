import { IntegrationType } from '@tailor-cms/interfaces/comment.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

import {
  Int,
  IntParam,
  RepositoryScopedParams,
  timestamps,
} from '#shared/request/schemas.ts';
import { IntegrationRef } from '../../schemas/entity.ts';

// Re-export the runtime enum for schema consumers
export { IntegrationType };

export const IntegrationItemParams = RepositoryScopedParams.extend({
  integrationId: IntParam().describe('Integration id (path param).'),
});

export type IntegrationItemParams = z.infer<typeof IntegrationItemParams>;

export const Integration = IntegrationRef.extend({
  type: z.enum(IntegrationType),
  repositoryId: Int().nullable().describe(oneLine`
    Null for the built-in integrations, which are available everywhere.
  `),
  isEnabled: z.boolean(),
  ...timestamps(),
})
  .meta({ id: 'Integration' })
  .describe('A non-human posting identity.');

export type Integration = z.infer<typeof Integration>;
