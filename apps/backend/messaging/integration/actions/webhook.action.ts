import * as schemas from '../schemas/index.ts';
import * as service from '../integration.service.ts';
import { StatusCodes } from 'http-status-codes';
import { oneLine } from 'common-tags';
import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';

export default defineAction({
  name: 'postIntegrationMessage',
  params: schemas.WebhookParams,
  body: schemas.InboundWebhookInput,
  openapi: {
    summary: 'Post a message through an incoming webhook',
    description: oneLine`
      Posts into every thread subscribed to this integration. The
      body is Slack-compatible, so anything that already posts to Slack
      works unchanged; a CI pipeline announcing a release, an alerting
      tool, a translation vendor returning a finished job.
    `,
    responses: {
      204: { description: 'Message posted.' },
      400: { description: 'Payload carried neither text nor attachments.' },
      404: { description: 'Unknown or disabled token.' },
      409: { description: 'No thread subscribes to this integration.' },
      429: { description: 'Too many posts; slow down and retry.' },
    },
  },
  async handler({ body, params }) {
    try {
      const integration = await service.resolveByToken(params.token);
      await service.postFromWebhook(integration, body);
    } catch (err) {
      if (err instanceof service.IntegrationNotFoundError) {
        return createError(StatusCodes.NOT_FOUND, err.message);
      }
      if (err instanceof service.NoSubscriberError) {
        return createError(StatusCodes.CONFLICT, err.message);
      }
      throw err;
    }
  },
});
