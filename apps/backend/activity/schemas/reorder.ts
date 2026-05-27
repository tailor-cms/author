// Wire shape for the activity reorder endpoint.
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const ReorderInput = z
  .object({
    position: z.number().nonnegative().describe(oneLine`
      Zero-based target index in the sibling list. The model derives
      the stored position via \`calculatePosition\`; typically a
      fractional value between the two surrounding siblings (e.g. 1.5
      when slotted between rows at 1 and 2).
    `),
  })
  .describe('Reorder payload.');

export type ReorderInput = z.infer<typeof ReorderInput>;
