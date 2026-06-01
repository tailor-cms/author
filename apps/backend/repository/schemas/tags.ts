// Wire shapes for the repository-tag endpoints.
import { z } from 'zod';

import {
  IntParam,
  RepositoryScopedParams,
  ShortText,
} from '#shared/request/schemas.ts';

// POST /repositories/:repositoryId/tags
export const AddTagInput = z
  .object({
    name: ShortText(1, 100).describe(
      'Tag name; created on the fly if missing (1..100 chars).',
    ),
  })
  .describe('Attach a tag to the repository.');

export type AddTagInput = z.infer<typeof AddTagInput>;

// Path params for `/:repositoryId/tags/:tagId`
export const TagItemParams = RepositoryScopedParams.extend({
  tagId: IntParam().describe('Numeric id of the tag.'),
});

export type TagItemParams = z.infer<typeof TagItemParams>;
