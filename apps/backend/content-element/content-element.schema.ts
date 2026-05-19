// Wire-shape contracts for the ContentElement slice.
// Single source of truth: actions register these on `defineAction`, the
// service types its parameters via `z.infer`.
import { z } from 'zod';

import { IntParam, QueryBoolean } from '#shared/request/schemas.ts';

// GET /repositories/:repositoryId/content-elements
// Two call shapes from the FE store:
//   - `{ activityIds: [activityId, ...] }`  bulk-load every element
//     under a set of parent activities.
//   - no filters return every non-detached element in the repo
export const ListFilter = z.object({
  // Restrict to elements whose `activityId` is in the provided set. The
  // wire shape arrives either as a real array, a single value, or a
  // comma-separated string depending on the qs-serializer; coerced to ints.
  activityIds: z.preprocess(
    (v) => {
      if (v == null) return undefined;
      if (Array.isArray(v)) return v.length ? v.map((x) => Number(x)) : undefined;
      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
          return undefined;
        }
        return trimmed.split(',').filter(Boolean).map(Number);
      }
      return v;
    },
    z.array(z.number().int()).optional(),
  ),
  // Include detached elements; unreachable in the outline.
  // Default: false.
  detached: QueryBoolean.optional(),
  // Pagination + sort (consumed by processQuery middleware).
  offset: IntParam().optional(),
  limit: IntParam().optional(),
  sortBy: z.string().max(64).optional(),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
  paranoid: QueryBoolean.optional(),
});

export type ListFilter = z.infer<typeof ListFilter>;

// POST /repositories/:repositoryId/content-elements
export const CreateInput = z.object({
  // Client-generated uid, defaults to UUIDv4 when omitted
  uid: z.uuid().optional(),
  // Parent activity, holding the element.
  activityId: z.number().int().positive(),
  // Content element type id, declared by an installed content element
  // extension package (e.g. `HTML`, `IMAGE`, `MULTIPLE_CHOICE`). Each
  // package owns one type id; the elementRegistry dispatches lifecycle
  // hooks and procedures by it. Length cap mirrors the column.
  type: z.string().trim().min(1).max(255),
  // Plugin-defined `data` bag (JSONB). Each Content Element pkg manifest
  // declares its own `ElementData` interface (extending the common
  // `ElementConfig`).
  data: z.record(z.string(), z.unknown()).optional(),
  // Configurable input data bag (JSONB)
  // Additional schema based configuration attached to the element
  // e.g. captions, labels, system specific config one might want to
  // store with the element.
  meta: z.record(z.string(), z.unknown()).optional(),
  // Position among siblings; model validator gates 0..1_000_000.
  position: z.number().min(0).max(1_000_000),
  // Element refs bag (JSONB). The repository schema configures each
  // element type's allowed relationship keys via
  // `elementMeta.relationships[]` (e.g. `related`); each value is a list
  // of `{ id, uid?, outlineId, containerId }` pointers.
  refs: z.record(z.string(), z.unknown()).optional(),
  // Linked-content fields. Populated when this element is created as a
  // linked copy of a source element (typically in another repository);
  // left at defaults otherwise.
  // True while this row receives auto-sync updates from `sourceId`.
  // Editing `data` auto-unlinks (model `autoUnlinkOnEdit` afterUpdate hook).
  isLinkedCopy: z.boolean().optional(),
  // Id of the source element this copy was linked from. Preserved on
  // unlink so provenance survives; nulled if the source is hard-deleted.
  sourceId: z.number().int().positive().optional(),
  // Source row's `updatedAt` at the time of the last sync. The client uses
  // this to detect when the source has been edited.
  sourceModifiedAt: z.iso.datetime({ offset: true }).optional(),
  // Stable id that survives clone/import so duplicates/reuse can be detected.
  contentId: z.uuid().optional(),
});

export type CreateInput = z.infer<typeof CreateInput>;

// PATCH /repositories/:repositoryId/content-elements/:elementId
// Updates mutable fields. Passing `deletedAt: null` restores a previously
// soft-deleted element.
export const PatchInput = z.object({
  // Note: `type` is intentionally NOT patchable. The type id is the
  // element's identity (it determines which plugin's hooks + data shape
  // apply); changing it post-creation would orphan `data` against the
  // wrong plugin.
  //
  // Replacement `data` bag (JSONB). Each Content Element pkg manifest
  // declares its own `ElementData` interface (extending the common
  // `ElementConfig`);
  data: z.record(z.string(), z.unknown()).optional(),
  // New position among siblings; model validator gates 0..1_000_000.
  position: z.number().min(0).max(1_000_000).optional(),
  // Replacement configurable input data bag (JSONB).
  // Additional schema based configuration attached to the element
  // e.g. captions, labels, system specific config one might want to
  // store with the element.
  meta: z.record(z.string(), z.unknown()).optional(),
  // Replacement element refs bag (JSONB). The repository schema
  // configures each element type's allowed relationship keys via
  // `elementMeta.relationships[]` (e.g. `related`); each value is a
  // list of `{ id, uid?, outlineId, containerId }` pointers.
  refs: z.record(z.string(), z.unknown()).optional(),
  // Restore from soft delete: `null` brings the row back.
  deletedAt: z.null().optional(),
});

export type PatchInput = z.infer<typeof PatchInput>;

// POST /repositories/:repositoryId/content-elements/:elementId/reorder
export const ReorderInput = z.object({
  // Target index in the sibling list. Float accepted to match the
  // original `isFloat()` contract (the model recomputes the actual
  // fractional `DOUBLE` position via `calculatePosition`).
  position: z.number().min(0),
});

export type ReorderInput = z.infer<typeof ReorderInput>;

// POST /repositories/:repositoryId/content-elements/link
export const LinkInput = z.object({
  // Source element id to copy from (in a potentially different repo).
  sourceId: z.number().int().positive(),
  // Target activity (container) the linked copy is being attached to.
  activityId: z.number().int().positive(),
  // Position of the linked copy among siblings.
  position: z.number().min(0).max(1_000_000),
});

export type LinkInput = z.infer<typeof LinkInput>;
