import {
  Int,
  IntParam,
  Paginated,
  Pagination,
  Timestamp,
  UInt,
} from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const AssetsFilter = z
  .object({
    threadId: IntParam().optional().describe(oneLine`
      Restrict to one thread. Left out, the result covers every thread
      in the repository.
    `),
    ...Pagination(),
  })
  .describe('Filters for the shared-asset list.');

export type AssetsFilter = z.infer<typeof AssetsFilter>;

export const ThreadAsset = z
  .object({
    entityId: z.string().describe('Asset id.'),
    threadId: Int().nullable().describe('Thread it was last shared in.'),
    lastSharedAt: Timestamp('When it was last shared.'),
    shareCount: UInt().describe('How many messages reference it.'),
  })
  .meta({ id: 'ThreadAsset' })
  .describe(oneLine`
    One asset shared in a thread: the pointer and the stats only. The
    asset itself is read from the asset library, which signs its own
    short-lived URLs.
  `);

export type ThreadAsset = z.infer<typeof ThreadAsset>;

export const AssetsResult = Paginated(
  ThreadAsset,
  'ThreadAssetsResult',
).describe('A page of assets shared in threads.');

export type AssetsResult = z.infer<typeof AssetsResult>;
