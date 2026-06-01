// Wire shape for the feed listing endpoint.
import { z } from 'zod';

import { FeedPresenceRecord } from './entity.ts';

// Active users are returned as a map keyed by user id (string after
// JSON serialisation).
export const ListResult = z
  .object({
    items: z
      .record(z.string(), FeedPresenceRecord)
      .describe('Active users keyed by numeric user id.'),
  })
  .meta({ id: 'FeedListResult' })
  .describe('Currently-active users on the repository feed.');

export type ListResult = z.infer<typeof ListResult>;
