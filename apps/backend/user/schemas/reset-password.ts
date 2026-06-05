// Wire shape for the token-authenticated password reset.
import { z } from 'zod';

export const ResetPasswordInput = z
  .object({
    password: z.string().min(8).max(100).describe('Replacement password.'),
    token: z
      .string()
      .optional()
      .describe('Reset token (consumed by the auth middleware).'),
  })
  .describe('Token-authenticated password reset payload.');

export type ResetPasswordInput = z.infer<typeof ResetPasswordInput>;
