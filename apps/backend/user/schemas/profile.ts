// Wire shapes for `/users/me` (GET + PATCH) and the login result envelope.
import { z } from 'zod';

import { AccessibleUserGroup, User } from './entity.ts';

export const ProfileResult = z
  .object({
    user: User.describe(`Current user's profile.`),
    userGroups: z.array(AccessibleUserGroup)
      .describe(`User groups accessible to the current user.`),
    authData: z.unknown().describe(`
      Auth-context for the active session. Always carries a \`strategy\`
      field ('local' | 'jwt' | 'oidc'); strategy-specific payload is
      nested under the strategy's key.
    `),
  })
  .meta({ id: 'UserProfileResult' })
  .describe(`Current-user profile.`);

export type ProfileResult = z.infer<typeof ProfileResult>;

export const ProfileUpdateInput = z
  .object({
    email: User.shape.email.optional(),
    firstName: User.shape.firstName.unwrap().optional(),
    lastName: User.shape.lastName.unwrap().optional(),
    // Generous ceiling
    // covers any reasonable upload while gating obvious DoS payloads.
    imgUrl: z.string().max(200_000).optional()
      .describe('Avatar URL or base64 data URL (capped at 200_000 chars).'),
  })
  .describe(`Editable subset of the current user's profile.`);

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateInput>;

export const ProfileUpdateResult = z
  .object({ user: User })
  .meta({ id: 'UserProfileUpdateResult' })
  .describe('Updated current user profile.');

export type ProfileUpdateResult = z.infer<typeof ProfileUpdateResult>;
