// Wire shape for the repository pin/unpin endpoint.
import { z } from 'zod';

export const PinInput = z
  .object({
    pin: z.boolean().describe('Pin toggle for the repo in the dashboard.'),
  })
  .describe('Pin / unpin payload for the current user.');

export type PinInput = z.infer<typeof PinInput>;
