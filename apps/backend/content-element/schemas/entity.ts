// ContentElement entity and its related sub-shapes.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import {
  Int,
  IntParam,
  JsonObject,
  RepositoryScopedParams,
  Timestamp,
  Uid,
  timestamps,
} from '#shared/request/schemas.ts';

// Path param shape for every `/:elementId` route. Extends
// RepositoryScopedParams so the OpenAPI doc reflects the full path-param
// chain (the upstream `getRepository` + `getContentElement` middlewares
// already validate at runtime).
export const ContentElementItemParams = RepositoryScopedParams.extend({
  elementId: IntParam().describe('Numeric content-element id (path param).'),
});

export type ContentElementItemParams = z.infer<typeof ContentElementItemParams>;

// The full ContentElement entity as returned by the API.
export const ContentElement = z
  .object({
    id: Int().describe('Numeric primary key.'),
    uid: Uid(),
    repositoryId: Int().describe('Repository the element belongs to.'),
    activityId: Int().describe(oneLine`
      Parent activity holding the element.
    `),
    type: z.string().max(255).describe(oneLine`
      Content-element type id, declared by an installed content-element
      extension package (e.g. \`HTML\`, \`IMAGE\`, \`MULTIPLE_CHOICE\`).
      Each package owns one type id; the elementRegistry dispatches
      lifecycle hooks and procedures by it. Capped at the model column
      length (\`STRING\` -> \`VARCHAR(255)\`).
    `),
    position: z.number().min(0).max(1_000_000).describe(oneLine`
      Position among siblings. Stored as \`DOUBLE\`; the model column
      validator caps the range at 0..1_000_000, and floats are allowed so
      callers can wedge a row between existing positions. The /reorder
      endpoint derives the stored value via \`calculatePosition\`.
    `),
    contentId: Uid(oneLine`
      Origin id that survives clone/import so reuse and duplicates can be
      detected across repositories.
    `),
    contentSignature: z.string().optional().describe(oneLine`
      SHA-1 hash of \`data\`, recomputed on every save by the
      \`processAssets\` beforeSave hook. Used to detect duplicate content.
    `),
    data: JsonObject(oneLine`
      Content element type defined property bag (JSONB). Shape is
      owned by the content element package's \`ElementData\`
      interface for this \`type\`.
    `),
    meta: JsonObject(oneLine`
      Meta-input data bag (JSONB). Schema-configured fields collected via
      meta inputs (captions, labels, and similar element-level config).
    `),
    refs: JsonObject(oneLine`
      Cross-element references (JSONB). Keyed by the relationship types
      the schema declares for this element type via
      \`elementMeta.relationships[]\`; values are arrays of
      \`{ id, uid?, outlineId, containerId }\` pointers. Remapped on
      deep-clone via \`mapClonedReferences\`.
    `),
    detached: z.boolean().describe(oneLine`
      True when an ancestor activity was deleted, leaving this row
      unreachable in the outline. The record itself stays intact.
    `),
    isLinkedCopy: z.boolean().describe(oneLine`
      True when this element is an active linked copy of another; receives
      automatic updates when the source changes. Editing \`data\`
      auto-unlinks via the model's \`autoUnlinkOnEdit\` afterUpdate hook.
    `),
    sourceId: Int().nullable().describe(oneLine`
      Source element id this entry was copied from; preserved after unlink
      for provenance. Null when the source has been hard-deleted.
    `),
    sourceModifiedAt: Timestamp(
      `Source \`updatedAt\` at the moment of last sync.`,
    ).nullable(),
    ...timestamps(),
  })
  .meta({ id: 'ContentElement' }).describe(oneLine`
    A content element inside a container activity. The element's \`type\`
    selects which extension package owns its \`data\` shape and lifecycle
    hooks.
  `);

export type ContentElement = z.infer<typeof ContentElement>;

// Source-element info returned for a linked copy. Powers the FE's
// "linked from..." breadcrumb on linked elements.
export const ElementSourceInfo = z
  .object({
    id: Int().describe('Source element id.'),
    uid: Uid('Source element UID.'),
    repositoryId: Int().describe('Source repository id.'),
    repositoryName: z
      .string()
      .optional()
      .describe('Source repository display name.'),
    activityId: Int().describe('Source activity id.'),
    type: z.string().describe('Source element type id.'),
    outlineActivityId: Int().optional().describe(oneLine`
      Closest outline-level ancestor of the source element; used by the
      FE to deep-link to the source's location in the outline.
    `),
    outlineActivityName: z
      .string()
      .optional()
      .describe('Display name of the source outline activity.'),
  })
  .meta({ id: 'ElementSourceInfo' })
  .describe('Source info returned for a linked content-element copy.');

export type ElementSourceInfo = z.infer<typeof ElementSourceInfo>;

// A single active linked copy of a source element, decorated with its
// host repository + outline-activity pointer for FE deep-linking.
export const ElementCopyLocation = z
  .object({
    id: Int().describe('Linked-copy element id.'),
    uid: Uid('Linked-copy UID.'),
    repositoryId: Int().describe('Repository hosting the linked copy.'),
    activityId: Int().describe('Container (activity) holding the copy.'),
    repositoryName: z.string().optional().describe('Host repository name.'),
    outlineActivityId: Int().optional().describe(oneLine`
      Closest outline-level ancestor of the linked copy; used by the FE to
      deep-link to the copy's location in the outline.
    `),
    outlineActivityName: z
      .string()
      .optional()
      .describe('Display name of the copy outline activity.'),
    linkedAt: Timestamp('Timestamp the linked copy was created at.'),
  })
  .meta({ id: 'ElementCopyLocation' })
  .describe('An active linked copy of a source content element.');

export type ElementCopyLocation = z.infer<typeof ElementCopyLocation>;
