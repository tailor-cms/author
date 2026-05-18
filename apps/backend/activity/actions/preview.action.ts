import pick from 'lodash/pick.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { fetchActivityContent } from '#shared/publishing/actions.js';
import oauth2 from '#shared/oAuth2Provider.js';
import consumerConfig from '#config/consumer.ts';

// GET /repositories/:repositoryId/activities/:activityId/preview
// Requests a preview URL for the activity from the configured consumer
// webhook (OAuth2-signed).
async function handler({ req }: Ctx) {
  const activity = req.activity!;
  if (!consumerConfig.previewWebhookUrl || !oauth2.isConfigured) {
    throw new Error('Preview is not configured!');
  }
  const content = await fetchActivityContent(activity, true);
  const body = {
    ...pick(activity, ['id', 'uid', 'type']),
    repositoryId: activity.repositoryId,
    meta: activity.data,
    ...content,
  };
  // `oauth2.send` is only present when `isConfigured` is true (checked
  // above). The shared module is JS-typed so we narrow inline.
  const response = await oauth2.send!(consumerConfig.previewWebhookUrl, body);
  const { url } = (response?.data ?? {}) as { url: string };
  return { location: `${new URL(url, consumerConfig.previewWebhookUrl)}` };
}

export default defineAction({
  raw: true,
  openapi: {
    summary: 'Generate an external preview URL for an activity',
    authenticated: true,
  },
  handler,
});
