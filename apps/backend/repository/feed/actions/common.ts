// Shared input shapes for the feed activity actions (add / remove).
// `Context` is intentionally `looseObject` so new focus keys
// can flow through without a backend schema bump.
import type { UserActivityContext } from '@tailor-cms/interfaces';
import { z } from 'zod';

export const Context: z.ZodType<UserActivityContext> = z.looseObject({
  sseId: z.string().optional(),
  repositoryId: z.number().int(),
  activityId: z.number().int().optional(),
  elementId: z.number().int().optional(),
});

export const Body = z.object({ context: Context });
export type FeedBody = z.infer<typeof Body>;

// Subset of the User row broadcast over SSE alongside a presence event.
export const USER_ATTRS = [
  'id',
  'email',
  'firstName',
  'lastName',
  'fullName',
  'label',
  'imgUrl',
] as const;
