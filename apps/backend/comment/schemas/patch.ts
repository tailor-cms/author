// Wire shape for the comment PATCH endpoint.
import { z } from 'zod';

export const PatchInput = z
  .object({
    content: z
      .string()
      .min(1)
      .max(2000)
      .describe('Replacement body; same length bounds as create.'),
  })
  .describe('Patch payload for a comment update operation.');

export type PatchInput = z.infer<typeof PatchInput>;
