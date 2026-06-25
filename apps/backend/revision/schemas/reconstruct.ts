// Wire shapes for the subtree-reconstruction endpoint.
import { Int, IntParam, JsonObject, Timestamp } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const ReconstructInput = z
  .object({
    activityId: IntParam().describe('Subtree root to reconstruct.'),
    at: Timestamp('ISO 8601 moment to reconstruct the subtree at.'),
    against: Timestamp(oneLine`
      Optional baseline moment. When set, each returned entity carries a
      \`change\` tag describing how it differs between \`against\` and
      \`at\`.
    `).optional(),
  })
  .describe('Reconstructs an activity subtree at a moment, optionally diffed.');

export type ReconstructInput = z.infer<typeof ReconstructInput>;

// Change of an entity between `against` and `at`. Values match the
// frontend `PublishDiffChangeTypes` so the client can apply them verbatim;
// `null` means unchanged (or no baseline was supplied).
export const ReconstructChange = z.enum(['new', 'changed', 'removed']);
export type ReconstructChange = z.infer<typeof ReconstructChange>;

export const ReconstructEntity = z
  .object({
    id: Int().describe('Entity id (activity id or content-element id).'),
    uid: z.string().describe('Entity uid.'),
    state: JsonObject(oneLine`
      Snapshot of the entity at \`at\` - or at \`against\` for entities
      that were removed by \`at\`. Shape depends on the entity kind.
    `),
    change: ReconstructChange.nullable().describe(oneLine`
      How the entity changed vs \`against\`; null when unchanged or when
      no baseline was supplied.
    `),
  })
  .meta({ id: 'RevisionReconstructEntity' });

export type ReconstructEntity = z.infer<typeof ReconstructEntity>;

export const ReconstructResult = z
  .object({
    at: Timestamp('The reconstructed moment (echoed from the request).'),
    against: Timestamp('The baseline moment, when one was supplied.').nullable(),
    activities: z
      .array(ReconstructEntity)
      .describe('Activity snapshots in the subtree.'),
    elements: z
      .array(ReconstructEntity)
      .describe('Content-element snapshots in the subtree.'),
  })
  .meta({ id: 'RevisionReconstructResult' })
  .describe('Reconstructed subtree state at the target moment.');

export type ReconstructResult = z.infer<typeof ReconstructResult>;
