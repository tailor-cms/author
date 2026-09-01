import { z } from 'zod';
import { UInt } from '#shared/request/schemas.ts';

export const UnreadSummary = z
  .object({
    threads: UInt().describe(
      'Threads holding messages the reader has not seen.',
    ),
    mentions: UInt().describe('Unread mentions of the reader.'),
  })
  .meta({ id: 'UnreadSummary' })
  .describe('Thread badge counts for one repository.');

export type UnreadSummary = z.infer<typeof UnreadSummary>;

export const ReadWatermark = z.object({
  threadId: z.number(),
  lastReadAt: z.string(),
});

export type ReadWatermark = z.infer<typeof ReadWatermark>;
