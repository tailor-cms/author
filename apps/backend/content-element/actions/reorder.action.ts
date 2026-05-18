import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import * as service from '../content-element.service.ts';

// POST /repositories/:repositoryId/content-elements/:elementId/reorder
// Recalculates the element's position from the supplied target index
// among reorder-eligible siblings
const Body = z.object({
  // Target index in the sibling list. Float accepted to match the
  // original `isFloat()` contract (the model recomputes the actual
  // fractional `DOUBLE` position via `calculatePosition`).
  position: z.number().min(0),
});
export type ReorderBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Reorder a content element',
    authenticated: true,
  },
  async handler({ body, req }) {
    return service.reorder(req.contentElement!, body.position);
  },
});
