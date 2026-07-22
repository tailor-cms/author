// Wire shape for creating a user group.
import { z } from 'zod';
import { UserGroup } from './entity.ts';

export const CreateInput = z
  .object({
    name: UserGroup.shape.name,
    logoUrl: UserGroup.shape.logoUrl.nullish(),
  })
  .describe('Create user group payload.');

export type CreateInput = z.infer<typeof CreateInput>;
