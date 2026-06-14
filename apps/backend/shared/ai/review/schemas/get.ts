// Wire shape for `GET /ai/review/:activityId`.
import { z } from 'zod';

import { RubricId } from './entity.ts';

export const ReviewFilter = z.object({
  rubricId: RubricId().optional(),
});
