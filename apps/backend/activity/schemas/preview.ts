// Response shape for the activity preview endpoint.
import { z } from 'zod';

export const PreviewResult = z
  .object({
    location: z.url().describe('External preview URL for this activity.'),
  })
  .meta({ id: 'ActivityPreviewResult' })
  .describe('Preview-URL response shape.');

export type PreviewResult = z.infer<typeof PreviewResult>;
