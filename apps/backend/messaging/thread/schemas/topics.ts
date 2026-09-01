import { z } from 'zod';

export const SubscriptionTopic = z
  .object({
    topic: z.string().describe('Integration identifier.'),
    label: z.string(),
    description: z.string(),
  })
  .meta({ id: 'SubscriptionTopic' })
  .describe('Something a thread can subscribe to.');

export type SubscriptionTopic = z.infer<typeof SubscriptionTopic>;
