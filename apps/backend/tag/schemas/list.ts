import { z } from 'zod';
import { QueryBoolean } from '#shared/request/schemas.ts';

export const ListFilter = z
  .object({
    associated: QueryBoolean.optional().describe(
      'Restrict to tags attached to repositories the user can access.',
    ),
  })
  .describe('Filters for listing tags.');

export type ListFilter = z.infer<typeof ListFilter>;
