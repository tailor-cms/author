import pick from 'lodash/pick.js';
import { StatusCodes } from 'http-status-codes';

import * as schemas from '../schemas/index.ts';
import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';
import { fetchActivityContent } from '#shared/publishing/actions.js';
import oauth2 from '#shared/oAuth2Provider.js';
import consumerConfig from '#config/consumer.ts';

// GET /repositories/:repositoryId/activities/:activityId/preview
// Requests a preview URL for the activity from the configured consumer
// webhook (OAuth2-signed).
export default defineAction({
  name: 'getPreview',
  raw: true,
  params: schemas.ActivityItemParams,
  openapi: {
    authenticated: true,
    summary: 'Generate an external preview URL for an activity',
    description: 'Asks the configured consumer webhook for a preview URL.',
    responses: {
      200: { description: 'Preview URL.', schema: schemas.PreviewResult },
      502: { description: 'Preview webhook returned no usable URL.' },
      503: { description: 'Preview is not configured.' },
    },
  },
  async handler({ req }) {
    const activity = req.activity!;
    if (!consumerConfig.previewWebhookUrl || !oauth2.isConfigured) {
      return createError(
        StatusCodes.SERVICE_UNAVAILABLE,
        'Preview is not configured',
      );
    }
    const content = await fetchActivityContent(activity, true);
    const body = {
      ...pick(activity, ['id', 'uid', 'type']),
      repositoryId: activity.repositoryId,
      meta: activity.data,
      ...content,
    };
    // `oauth2.send` is only present when `isConfigured` is true
    const response = await oauth2.send!(consumerConfig.previewWebhookUrl, body);
    const { url } = (response?.data ?? {}) as { url?: string };
    if (!url) {
      return createError(
        StatusCodes.BAD_GATEWAY,
        'Preview webhook did not return a URL',
      );
    }
    return { location: `${new URL(url, consumerConfig.previewWebhookUrl)}` };
  },
});
