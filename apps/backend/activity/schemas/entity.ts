// Activity entity and its related sub-shapes.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import {
  Int,
  IntParam,
  RepositoryScopedParams,
} from '#shared/request/schemas.ts';
import { UserSummary } from '#app/user/user.schema.ts';

// Path param shape for every `/:activityId` route. Extends
// RepositoryScopedParams so the OpenAPI doc reflects the full path
// param chain (the upstream `getRepository` + `getActivity` middlewares
// already validate at runtime).
export const ActivityItemParams = RepositoryScopedParams.extend({
  activityId: IntParam().describe('Numeric activity id (path param).'),
});

export type ActivityItemParams = z.infer<typeof ActivityItemParams>;

// Workflow status row attached to an Activity.
export const ActivityStatus = z
  .object({
    id: Int().describe('Numeric primary key.'),
    activityId: Int().describe('Related activity id.'),
    assigneeId: Int()
      .nullable()
      .describe('Current assignee user id; null when unassigned.'),
    assignee: UserSummary.nullable()
      .optional()
      .describe('Eager-loaded assignee; null when unassigned.'),
    status: z.string().describe('Schema-defined workflow status id.'),
    priority: z.string().describe('Schema-defined workflow priority id.'),
    description: z
      .string()
      .nullable()
      .describe('Free-text note attached to the status entry.'),
    dueDate: z.iso
      .datetime({ offset: true })
      .nullable()
      .describe('Due date; null when no deadline is set.'),
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
  .meta({ id: 'ActivityStatus' })
  .describe('A workflow-status entry for an activity.');

export type ActivityStatus = z.infer<typeof ActivityStatus>;

// The full Activity entity as returned by the API.
export const Activity = z
  .object({
    id: Int().describe('Numeric primary key.'),
    uid: z.uuid().describe('Stable UUID; persists across clones and links.'),
    repositoryId: Int().describe('Repository the activity belongs to.'),
    parentId: Int().nullable().describe(oneLine`
      Parent activity id; null for outline-root activities. The same
      \`parentId\` axis chains outline nodes, their containers, and any
      subcontainers into one tree.
    `),
    type: z.string().describe(oneLine`
      Activity type id. Schema-declared types (outline nodes and
      schema-defined containers) are schema-prefixed;
      \`<SCHEMA_ID>/<TYPE>\`, e.g. \`COURSE_SCHEMA/MODULE\`,
      \`COURSE_SCHEMA/SECTION\`. Content containers are not.`),
    position: z.number().nonnegative().describe(oneLine`
      Position among siblings. Stored as \`DOUBLE\`; floats are
      allowed so callers can wedge a row between existing positions
      (e.g. 1.5 between rows at 1 and 2). The /reorder endpoint
      derives the stored value via \`calculatePosition\`.
    `),
    data: z.record(z.string(), z.unknown()).describe(oneLine`
      Activity-level metadata bag (JSONB). Shape is owned by the
      schema's config for the activity's \`type\`. The display
      name for outline activities lives at \`data.name\` (typed as
      required in \`@tailor-cms/interfaces/activity\`).
    `),
    refs: z.record(z.string(), z.unknown()).describe(oneLine`
      Cross-activity references (JSONB). Keyed by relationship type
      declared in the schema's \`relationships\` config for this
      activity type; values are arrays of target activity ids
      (e.g. \`{ prerequisites: [42, 17] }\`). Remapped on deep-clone
      via \`mapClonedReferences\`.
    `),
    detached: z.boolean().describe(oneLine`
      True when an ancestor was deleted, leaving this row unreachable
      in the outline. The record itself stays intact.
    `),
    isLinkedCopy: z.boolean().describe(oneLine`
      True when this activity is an active linked copy of another;
      receives automatic updates when the source changes.
    `),
    sourceId: Int().nullable().optional().describe(oneLine`
      Source activity id this entry was copied from; preserved after
      unlink for provenance. Null when the source has been hard-deleted.
    `),
    sourceModifiedAt: z.iso
      .datetime({ offset: true })
      .nullable()
      .optional()
      .describe(`Source \`modifiedAt\` at the moment of last sync.`),
    isTrackedInWorkflow: z.boolean().describe(oneLine`
      True when the activity type appears in the schema's workflow
      configuration.
    `),
    status: z.array(ActivityStatus).optional().describe(oneLine`
      Workflow status history (latest first). Present when the
      defaultScope include was applied.
    `),
    modifiedAt: z.iso
      .datetime({ offset: true })
      .nullable()
      .describe('Aggregated subtree last-modified timestamp.'),
    publishedAt: z.iso
      .datetime({ offset: true })
      .nullable()
      .describe('Last publish timestamp; null when never published.'),
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
  .meta({ id: 'Activity' }).describe(oneLine`
    A repository activity (outline node, container, or flat collection item).
    The activity's \`type\` selects which schema-defined behaviour and
    \`data\` shape applies.
  `);

export type Activity = z.infer<typeof Activity>;

// Source-activity info returned for a linked copy. Powers the FE's
// "linked from..." breadcrumb on linked activities.
export const ActivitySourceInfo = z
  .object({
    id: Int().describe('Source activity id.'),
    repository: z
      .object({
        id: Int().describe('Source repository id.'),
        name: z.string().describe('Source repository display name.'),
      })
      .describe('Source repository pointer.'),
  })
  .meta({ id: 'ActivitySourceInfo' })
  .describe('Source info returned for a linked activity copy.');

export type ActivitySourceInfo = z.infer<typeof ActivitySourceInfo>;

// A top-level ("entry-point") linked copy.
export const ActivityCopyLocation = z
  .object({
    id: Int().describe('Linked-copy activity id.'),
    uid: z.uuid().describe('Linked-copy uid.'),
    repositoryId: Int().describe('Repository hosting the linked copy.'),
    outlineActivityId: Int().optional().describe(oneLine`
      Closest outline-level ancestor of the linked copy; used by the
      FE to deep-link to the copy's location in the outline.
    `),
    name: z.string().optional().describe('Linked-copy display name.'),
    repositoryName: z.string().optional().describe('Host repository name.'),
  })
  .meta({ id: 'ActivityCopyLocation' })
  .describe('A entry-point linked copy of a source activity.');

export type ActivityCopyLocation = z.infer<typeof ActivityCopyLocation>;
