import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import * as service from '../content-element.service.ts';

// POST /repositories/:repositoryId/content-elements
// Creates a new element under the scoped repository. `repositoryId` is
// taken from the loaded repo on `req`.
const Body = z.object({
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
export type CreateBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Create a content element',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.create(req.repository!, user, body);
  },
});
