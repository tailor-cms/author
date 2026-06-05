// Wire shape for the current-user password change endpoint.
import { z } from 'zod';

export const ChangePasswordInput = z
  .object({
    // No length floor: existing accounts may have any length the model
    // historically allowed; we just need a non-empty value to compare.
    currentPassword: z.string().min(1).describe('Current account password.'),
    newPassword: z.string().min(8).max(100).describe(
      'Replacement password; 8..100 chars to match the model validator.',
    ),
  })
  .describe('Change-password payload for the authenticated user.');

export type ChangePasswordInput = z.infer<typeof ChangePasswordInput>;
