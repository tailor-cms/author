// Revision entity and related path-param shapes.
import {
  Int,
  IntParam,
  RepositoryScopedParams,
} from '#shared/request/schemas.ts';
import { Entity, Operation } from '@tailor-cms/interfaces/revision';
import { UserSummary } from '#app/user/schemas/entity.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

// Re-export for convenience
export { Entity, Operation };

export const RevisionItemParams = RepositoryScopedParams.extend({
  revisionId: IntParam().describe('Numeric revision id (path param).'),
});

export type RevisionItemParams = z.infer<typeof RevisionItemParams>;

// The full Revision entity as returned by the API
export const Revision = z
  .object({
    id: Int().describe('Numeric primary key.'),
    uid: z.uuid().describe('UUID identifier.'),
    userId: Int().describe('User who initiated the change.'),
    repositoryId: Int().describe('Repository the revision belongs to.'),
    entity: z.enum(Entity).describe('Entity kind the snapshot represents.'),
    operation: z
      .enum(Operation)
      .describe('Mutation kind: Create | Update | Remove.'),
    state: z.record(z.string(), z.unknown()).describe(oneLine`
      Snapshot of the entity at the revision moment; concrete shape is
      determined by \`entity\`. Kept loose at the schema layer to avoid a
      hard dependency on the per-entity wire schemas.
    `),
    user: UserSummary.optional().describe(oneLine`
      Eager-loaded author of the change. Populated when the record is
      fetched with the User include (which is the default for list / get
      / time-travel actions).
    `),
    createdAt: z.iso
      .datetime({ offset: true })
      .describe('When the revision was written.'),
    updatedAt: z.iso.datetime({ offset: true }).describe(oneLine`
      Last update timestamp. Revisions are currently append-only, so this is
      typically == createdAt.
    `),
  })
  .meta({ id: 'Revision' }).describe(oneLine`
    Append-only audit record capturing a single mutation to an Activity,
    ContentElement, or Repository.
  `);

export type Revision = z.infer<typeof Revision>;
