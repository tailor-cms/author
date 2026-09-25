// Wire shape for serving an emoji image.
import { z } from 'zod';

export const ImageParams = z.object({
  // Not the name: the URL is content-addressed so the response can be
  // cached forever, and a rename must not invalidate a cached image.
  contentHash: z
    .string()
    .regex(/^[a-f0-9]{32}$/)
    .describe('Truncated SHA-256 of the encoded image (path param).'),
});

export type ImageParams = z.infer<typeof ImageParams>;
