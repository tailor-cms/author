// Wire shape for the reset-token validation probe.
import { z } from 'zod';

export const TokenStatusInput = z
  .object({ token: z.string().describe('Reset token to validate.') })
  .describe('Reset-token validation payload.');

export type TokenStatusInput = z.infer<typeof TokenStatusInput>;
