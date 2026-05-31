import { z } from 'zod';

import { ContentElement } from './entity.ts';

export const PatchInput = z
  .object({
    data: ContentElement.shape.data.optional(),
    position: ContentElement.shape.position.optional(),
    meta: ContentElement.shape.meta.optional(),
    refs: ContentElement.shape.refs.optional(),
    deletedAt: z
      .null()
      .optional()
      .describe('Restore from soft-delete: `null` brings the row back.'),
  })
  .describe('Patch payload for a content-element update operation.');

export type PatchInput = z.infer<typeof PatchInput>;
