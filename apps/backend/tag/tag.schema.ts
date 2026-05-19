// Wire-shape contracts for the Tag slice.
// Single source of truth: actions register these on `defineAction`, the
// service types its parameters via `z.infer`. Adding a field here flows
// to both sides via the compiler.
import { z } from 'zod';

import { QueryBoolean } from '#shared/request/schemas.ts';

// GET /tags
export const ListQuery = z.object({
  // Restrict to tags attached to repositories the user can access.
  associated: QueryBoolean.optional(),
});
export type ListQuery = z.infer<typeof ListQuery>;
