// Feed entities and shared sub-shapes.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { Int, RepositoryScopedParams } from '#shared/request/schemas.ts';
import { UserSummary } from '#app/user/user.schema.ts';

// Path params for every `/:repositoryId/feed/...` route.
export const FeedItemParams = RepositoryScopedParams;
export type FeedItemParams = z.infer<typeof FeedItemParams>;

// A presence context describes what a user is currently focused on in
// the repo (repo / outline activity / content element).
export const UserActivityContext = z
  .looseObject({
    sseId: z.string().optional().describe(oneLine`
      SSE connection id; populated when the context is bound to a live
      stream so server-side cleanup can target the right connection.
    `),
    repositoryId: Int().describe('Repository the context is scoped to.'),
    activityId: Int().optional().describe('Outline activity in focus.'),
    elementId: Int().optional().describe('Content element in focus.'),
  })
  .meta({ id: 'UserActivityContext' })
  .describe('A single focus context attached to a user in the feed.');

export type UserActivityContext = z.infer<typeof UserActivityContext>;

// Stored variant adds the join timestamp written by the presence store.
export const StoredUserActivityContext = UserActivityContext.extend({
  connectedAt: z.iso
    .datetime({ offset: true })
    .describe('Timestamp the context was attached to the user.'),
})
  .meta({ id: 'StoredUserActivityContext' })
  .describe('A user-activity context as persisted in the presence store.');

export type StoredUserActivityContext = z.infer<
  typeof StoredUserActivityContext
>;

// One row in the feed store: a slim user (UserSummary) plus their active
// presence contexts. Keyed by user id in the presence map returned by
// the list endpoint.
export const FeedPresenceRecord = UserSummary.extend({
  connectedAt: z.iso
    .datetime({ offset: true })
    .describe('Timestamp the user first joined the presence store.'),
  contexts: z
    .array(StoredUserActivityContext)
    .describe('Active focus contexts the user currently holds.'),
})
  .meta({ id: 'FeedPresenceRecord' })
  .describe('A user actively present on the repository feed.');

export type FeedPresenceRecord = z.infer<typeof FeedPresenceRecord>;
