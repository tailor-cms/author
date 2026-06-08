// Tag entity.
import { z } from 'zod';
import { Int, ShortText, Uid } from '#shared/request/schemas.ts';

export const Tag = z
  .object({
    id: Int().describe('Numeric primary key.'),
    uid: Uid(),
    name: ShortText(2, 20).describe(
      'Display name (2..20 chars; unique across the system).',
    ),
  })
  .meta({ id: 'Tag' })
  .describe('A user-defined label attachable to repositories.');

export type Tag = z.infer<typeof Tag>;
