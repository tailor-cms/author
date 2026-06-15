// Wire shape for `POST /ai/review/:activityId`
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { ReviewFilter } from './get.ts';

export const RequestInput = ReviewFilter.extend({
  force: z.boolean().optional().describe(oneLine`
    Re-run even when a fresh result exists. Used by the manual
    refresh button; deferred triggers omit it so unchanged content
    never re-runs.
  `),
});
