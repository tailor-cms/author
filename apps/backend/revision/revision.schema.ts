// Wire-shape contracts for the Revision slice.
import { Entity, Operation } from '@tailor-cms/interfaces/revision';
import { oneLine } from 'common-tags';
import { z } from 'zod';

import {
  IntParam,
  Pagination,
  RepositoryScopedParams,
  Sort,
} from '#shared/request/schemas.ts';
import { UserSummary } from '#app/user/user.schema.ts';

// Wire shape of a Revision record.
// `state` is a JSONB snapshot of the entity at the revision moment; its
// concrete shape is determined by `entity` (Activity / ContentElement /
// Repository), but we keep it loose at the schema layer to avoid a hard
// dependency on those slices' wire schemas.
export const Revision = z.object({
  id: z.number().int().describe('Revision id (auto-increment).'),
  uid: z.uuid().describe('UUID based identifier.'),
  userId: z.number().int().describe('User who initiated the change.'),
  repositoryId: z.number().int().describe('Repository the revision belongs to.'),
  entity: z.enum(Entity).describe('Entity kind the snapshot represents.'),
  operation: z.enum(Operation).describe('Mutation kind: Create | Update | Remove.'),
  state: z
    .record(z.string(), z.unknown())
    .describe('Snapshot of the entity at revision time; shape depends on `entity`.'),
  user: UserSummary.optional().describe(
    'Populated when the record is loaded with the User include.',
  ),
  createdAt: z.iso.datetime({ offset: true }).describe('When the revision was written.'),
  updatedAt: z.iso.datetime({ offset: true }).describe(oneLine`
    Last update timestamp (revisions are append-only;
    typically == createdAt).
  `),
}).meta({ id: 'Revision' })
  .describe(oneLine`
    Append-only audit record capturing a single mutation to
    Activity / ContentElement / Repository.
  `);

export type Revision = z.infer<typeof Revision>;

// Path params shared by every nested action in this slice. Documented
// on each action so the OpenAPI spec shows the full path-param chain
// (`getRepository` middleware validates `repositoryId` at runtime).
export const ListParams = RepositoryScopedParams;
export type ListParams = z.infer<typeof ListParams>;

export const TimeTravelParams = RepositoryScopedParams;
export type TimeTravelParams = z.infer<typeof TimeTravelParams>;

// GET /repositories/:repositoryId/revisions
// Two call shapes from the client:
//   - bulk list (revisions page) - no filters
//   - per-entity audit trail (EntityRevisions) - `entity` + `entityId`
export const ListFilter = z
  .object({
    entity: z.enum(Entity).optional().describe(oneLine`
      Restrict to one entity kind. When set, \`entityId\` is required
      so the result is scoped.
    `),
    entityId: IntParam()
      .optional()
      .describe('The entity id; matched against the JSONB `state.id` field.'),
    ...Pagination(),
    ...Sort(),
  })
  .refine((q) => !q.entity || q.entityId !== undefined, {
    message: '`entityId` is required when `entity` is set',
    path: ['entityId'],
  })
  .describe('Pagination and optional entity scope for listing revisions.');

export type ListFilter = z.infer<typeof ListFilter>;

// GET /repositories/:repositoryId/revisions/:revisionId
export const GetParams = RepositoryScopedParams.extend({
  revisionId: IntParam().describe('Revision id.'),
});
export type GetParams = z.infer<typeof GetParams>;

// GET /repositories/:repositoryId/revisions/time-travel
export const TimeTravelInput = z.object({
  activityId: IntParam().describe(oneLine`
    Target activity; the root of the subtree we reconstruct.
  `),
  timestamp: z.iso
    .datetime({ offset: true })
    .describe('Strict ISO 8601 moment to reconstruct state at.'),
  elementIds: z
    .array(z.coerce.number().int())
    .default([])
    .describe(oneLine`
      IDs of elements currently visible; used together with
      REMOVE-resurrected ids so the latest pre-timestamp state is
      fetched for everything the FE rendered.
    `),
}).describe(
  'Reconstructs activity and descendant element state at a target moment.',
);

export type TimeTravelInput = z.infer<typeof TimeTravelInput>;

// Top-level list response shape; not wrapped in `{ data }`
export const ListResult = z.object({
  total: z.number().int().describe('Total revisions matching the filter.'),
  items: z.array(Revision).describe('Page of revisions.'),
}).describe('Paginated list of revisions');

export type ListResult = z.infer<typeof ListResult>;

// Time-travel response (wrapped in `{ data }` by the framework).
export const TimeTravelResult = z.object({
  activities: z
    .array(Revision)
    .describe('Activity revisions visible at the target moment.'),
  elements: z
    .array(Revision)
    .describe('Content-element revisions visible at the target moment.'),
}).describe(oneLine`
  Reconstructed state at the target moment, mirroring the FE
  PublishDiffProvider shape.
`);

export type TimeTravelResult = z.infer<typeof TimeTravelResult>;
