// `meta` fields user is allowed to edit through the generic update.
// `meta.files` is intentionally absent: file attachments are managed by
// the dedicated endpoint, and Zod's default `.strip()`
// silently drops the key if a client tries to sneak it through.
import { oneLine } from 'common-tags';
import { z } from 'zod';

const EditableMeta = z.object({
  description: z.string().trim().optional().describe('Asset description.'),
  tags: z.array(z.string().trim()).optional().describe('Tag labels.'),
  isCoreSource: z.boolean().optional().describe(oneLine`
    Marks this asset as a primary knowledge source
    for AI generation.
  `),
});

export const UpdateInput = z
  .object({
    meta: EditableMeta.describe('Editable meta fields'),
  })
  .describe('Patch payload for an asset update operation.');

export type UpdateInput = z.infer<typeof UpdateInput>;
