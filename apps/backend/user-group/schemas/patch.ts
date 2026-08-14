// Wire shape for updating a user group.
import { z } from 'zod';
import { UserGroup } from './entity.ts';

export const PatchInput = z
  .object({
    name: UserGroup.shape.name.optional(),
    logoUrl: UserGroup.shape.logoUrl.nullish(),
  })
  .describe('Patch payload for a user-group update operation.');

export type PatchInput = z.infer<typeof PatchInput>;
