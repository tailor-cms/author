// Wire-shape contracts for the Tag slice.
// Single source of truth: actions register these on `defineAction`, the
// service types its parameters via `z.infer`.
import { z } from 'zod';

import { QueryBoolean } from '#shared/request/schemas.ts';

// GET /tags
export const ListFilter = z.object({
  associated: QueryBoolean.optional().describe(
    'Restrict to tags attached to repositories the user can access.',
  ),
}).describe('Filters for listing tags.');

export type ListFilter = z.infer<typeof ListFilter>;

// Wire shape of a Tag entity as returned by the API. `.meta({ id })`
// promotes it to `components.schemas.Tag` in the emitted OpenAPI spec
// so Scalar renders the entity name everywhere it's referenced.
export const Tag = z.object({
  id: z.number().int().describe('Numeric primary key.'),
  uid: z.uuid().describe('UUID based identifier.'),
  name: z.string().describe('Display name; unique across the system.'),
}).meta({ id: 'Tag' })
  .describe('A Tag entity attachable to repositories.');

export type Tag = z.infer<typeof Tag>;
