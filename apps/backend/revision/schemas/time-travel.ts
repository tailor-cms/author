// Wire shapes for the time-travel endpoint.
import { IntParam, Timestamp } from '#shared/request/schemas.ts';
import { Revision } from './entity.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const TimeTravelInput = z
  .object({
    activityId: IntParam().describe(oneLine`
      Target activity; the root of the subtree we reconstruct.
    `),
    timestamp: Timestamp('Strict ISO 8601 moment to reconstruct state at.'),
    elementIds: z
      .array(z.coerce.number().int())
      .default([])
      .describe(oneLine`
        Element ids currently rendered by the caller. The server adds
        elements that were live at \`timestamp\` but have since been
        deleted (so content visible then but gone now is reconstructed)
        and returns each one's state as of \`timestamp\`.
      `),
  })
  .describe(
    'Reconstructs activity + descendant element state at a target moment.',
  );

export type TimeTravelInput = z.infer<typeof TimeTravelInput>;

export const TimeTravelResult = z
  .object({
    activities: z
      .array(Revision)
      .describe('Activity revisions visible at the target moment.'),
    elements: z
      .array(Revision)
      .describe('Content-element revisions visible at the target moment.'),
  })
  .meta({ id: 'RevisionTimeTravelResult' })
  .describe(oneLine`
    Reconstructed state at the target moment, mirroring the Frontend
    PublishDiffProvider shape.
  `);

export type TimeTravelResult = z.infer<typeof TimeTravelResult>;
