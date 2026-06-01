// Repository entity and its related sub-shapes.
import { RepositoryRole } from '@tailor-cms/interfaces';
import { oneLine } from 'common-tags';
import { z } from 'zod';

import {
  Description,
  Int,
  RepositoryScopedParams,
  ShortText,
} from '#shared/request/schemas.ts';
import { Activity } from '#app/activity/schemas/entity.ts';
import { ContentElement } from '#app/content-element/schemas/entity.ts';
import { Tag } from '#app/tag/tag.schema.ts';
import { UserSummary } from '#app/user/user.schema.ts';
import { RepoData } from '../lib/data-attr.ts';

// Path param shape for every `/:repositoryId` route. Repositories live
// at the top of the path tree so this is just a re-export of the shared
// scoped-params helper;
export const RepositoryItemParams = RepositoryScopedParams;
export type RepositoryItemParams = z.infer<typeof RepositoryItemParams>;

// Re-export the runtime role enum + the data-attr Zod schema so schema
// consumers reach them through the schema barrel without a second import.
export { RepositoryRole, RepoData };

// Frozen backup of the schema configuration this repository was built
// against. Persisted under `data.$$.schema` and refreshed by the
// `syncSchemaSnapshot` middleware.
export const RepositorySchemaSnapshot = z
  .object({
    sha: z.string().describe('sha1 of the frozen `config` blob.'),
    config: z.unknown().describe('Frozen schema config (processed form).'),
    source: z.enum(['bundled', 'external']).describe(oneLine`
      Origin of the snapshot. \`bundled\` is shipped in the
      \`@tailor-cms/config\` bundle at build time; \`external\` is
      brought in at runtime (paste / import / re-registration).
    `),
    updatedAt: z.iso
      .datetime({ offset: true })
      .describe('Timestamp of the last snapshot write.'),
  })
  .meta({ id: 'RepositorySchemaSnapshot' })
  .describe('Schema-config backup stored under `data.$$.schema`.');

export type RepositorySchemaSnapshot = z.infer<typeof RepositorySchemaSnapshot>;

// Join row connecting a User to a Repository with a specific role.
// Composite primary key: (userId, repositoryId). `hasAccess=false` rows
// are kept on revoke so historical revisions still resolve their author.
export const RepositoryUser = z
  .object({
    userId: Int().describe('User id.'),
    repositoryId: Int().describe('Repository id.'),
    hasAccess: z.boolean().describe(oneLine`
      False when membership has been revoked; the row is kept so
      historical revisions still resolve their author.
    `),
    role: z.enum(RepositoryRole).describe('Repository-scoped role.'),
    pinned: z.boolean().describe(`Pinned flag for the user's catalog view.`),
    createdAt: z.iso
      .datetime({ offset: true })
      .describe('Insertion timestamp.'),
    updatedAt: z.iso
      .datetime({ offset: true })
      .describe('Last mutation timestamp.'),
    deletedAt: z.iso
      .datetime({ offset: true })
      .nullable()
      .describe('Soft-delete timestamp; null while active.'),
  })
  .meta({ id: 'RepositoryUser' }).describe(oneLine`
    Join row granting a user access to a repository with a specific
    role; carries the per-user pinned flag for the catalog view.
  `);

export type RepositoryUser = z.infer<typeof RepositoryUser>;

// UserSummary decorated with the repository-scoped role. Returned by the
// `members` endpoints (list + upsert) so the FE renders both identity and
// role from a single row.
export const RepositoryMember = UserSummary.extend({
  repositoryRole: z.enum(RepositoryRole).describe('Repository-scoped role.'),
})
  .meta({ id: 'RepositoryMember' })
  .describe('Repository member: user summary plus their repository role.');

export type RepositoryMember = z.infer<typeof RepositoryMember>;

// The full Repository entity as returned by the API. Includes the
// commonly eager-loaded associations (tags, the current user's
// repositoryUser row);
export const Repository = z
  .object({
    id: Int().describe('Numeric primary key.'),
    uid: z.uuid().describe('Stable UUID used as the client-side identity.'),
    schema: ShortText(2, 64).describe(oneLine`
      Schema id (key for the schema registry); selects which
      \`@tailor-cms/config\` schema this repository follows.
    `),
    name: ShortText(2, 250).describe('Display name (2..250 chars).'),
    description: Description(2, 2000).describe(
      'Long-form description (2..2000 chars).',
    ),
    data: RepoData.describe(oneLine`
      Schema-driven meta blob (JSONB). The \`$$\` namespace is reserved
      for platform-managed fields (schema snapshot, AI vector store id)
      and is stripped from publish manifests and export archives.
    `),
    tags: z
      .array(Tag)
      .optional()
      .describe('Eager-loaded tags attached to this repository.'),
    repositoryUser: RepositoryUser.optional().describe(oneLine`
      The current user's RepositoryUser row, eager-loaded on detail /
      list responses so the FE knows the caller's role + pinned state.
    `),
    hasUnpublishedChanges: z.boolean().describe(oneLine`
      True when any outline activity has draft changes since the last
      publish. Maintained by \`updatePublishingStatus\`.
    `),
    createdAt: z.iso
      .datetime({ offset: true })
      .describe('Insertion timestamp.'),
    updatedAt: z.iso
      .datetime({ offset: true })
      .describe('Last mutation timestamp.'),
    deletedAt: z.iso
      .datetime({ offset: true })
      .nullable()
      .describe('Soft-delete timestamp; non-null for archived rows.'),
  })
  .meta({ id: 'Repository' }).describe(oneLine`
    A repository: top-level content container that follows the rules of
    a single Schema (see \`schema\`).
  `);

export type Repository = z.infer<typeof Repository>;

// Reference-integrity result types.
// A dangling reference is keyed on the entity kind that holds it.
// Common fields shared by both broken-reference variants.
const BrokenReferenceCommon = {
  referenceName: z
    .string()
    .describe(`Key on \`src.refs\` where the link lives.`),
  target: z
    .object({
      id: Int().describe('Numeric id of the missing target.'),
      entity: z
        .string()
        .optional()
        .describe('Kind of the target (activity / element).'),
    })
    .describe('Pointer to the missing target.'),
};

export const BrokenActivityReference = z
  .object({
    src: Activity.describe('Activity row that still holds the reference.'),
    ...BrokenReferenceCommon,
  })
  .meta({ id: 'BrokenActivityReference' })
  .describe('A dangling reference held by an activity.');

export type BrokenActivityReference = z.infer<typeof BrokenActivityReference>;

export const BrokenElementReference = z
  .object({
    src: ContentElement.extend({
      outlineActivity: Activity.optional().describe(oneLine`
        Closest outline-level ancestor of the element; added by
        \`detectMissingReferences\` for FE deep-linking.
      `),
    }).describe('Content-element row that still holds the reference.'),
    ...BrokenReferenceCommon,
  })
  .meta({ id: 'BrokenElementReference' })
  .describe('A dangling reference held by a content element.');

export type BrokenElementReference = z.infer<typeof BrokenElementReference>;

// Dangling references grouped by the entity kind that holds them.
export const ReferenceValidationResult = z
  .object({
    activities: z
      .array(BrokenActivityReference)
      .describe('Dangling references held by activities.'),
    elements: z
      .array(BrokenElementReference)
      .describe('Dangling references held by content elements.'),
  })
  .meta({ id: 'ReferenceValidationResult' })
  .describe('Repository-wide reference-integrity result.');

export type ReferenceValidationResult = z.infer<
  typeof ReferenceValidationResult
>;
