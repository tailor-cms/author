// Response shape for the linked-copies enumeration endpoint.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { ElementCopyLocation } from './entity.ts';

export const CopiesResult = z
  .object({
    usages: z.array(ElementCopyLocation).describe(oneLine`
      Active linked copies of this source element across repositories.
    `),
  })
  .meta({ id: 'ElementCopiesResult' })
  .describe('Active linked copies of a source content element.');

export type CopiesResult = z.infer<typeof CopiesResult>;
