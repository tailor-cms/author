// Wire shapes for the activity-restore endpoint.
import { Int, IntParam, Timestamp } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const RestoreInput = z
  .object({
    activityId: IntParam().describe(oneLine`
      Activity to restore. Soft-deleted activities can be restored;
      hard-deleted ones cannot.
    `),
    timestamp: Timestamp('ISO 8601 moment to restore the activity to.'),
  })
  .describe('Restore an activity to a target moment.');

export type RestoreInput = z.infer<typeof RestoreInput>;

export const RestoreResult = z
  .object({
    activityId: Int().describe('Restored activity id.'),
    elementCount: Int().describe(
      'Number of content elements touched by the cascade.',
    ),
  })
  .meta({ id: 'RevisionRestoreResult' })
  .describe('Summary of the restore cascade.');

export type RestoreResult = z.infer<typeof RestoreResult>;
