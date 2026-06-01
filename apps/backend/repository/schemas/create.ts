// Wire shape for creating a repository.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { Int } from '#shared/request/schemas.ts';
import { general } from '#config';
import { Repository } from './entity.ts';

export const CreateInput = z
  .object({
    schema: Repository.shape.schema.refine(
      (id) => general.availableSchemas.includes(id),
      { message: 'Schema is not in the available schemas list' },
    ),
    name: Repository.shape.name,
    description: Repository.shape.description,
    data: Repository.shape.data.optional(),
    userGroupIds: z.array(Int()).optional().describe(oneLine`
      Optional list of user-group ids to share the new repo with.
    `),
  })
  .describe('Create repository payload.');

export type CreateInput = z.infer<typeof CreateInput>;
