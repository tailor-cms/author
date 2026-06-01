// Wire shape for the content-element reorder endpoint.
import { z } from 'zod';

import { ContentElement } from './entity.ts';

export const ReorderInput = z
  .object({
    position: ContentElement.shape.position,
  })
  .describe('Reorder payload.');

export type ReorderInput = z.infer<typeof ReorderInput>;
