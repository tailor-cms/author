import { createId as cuid } from '@paralleldrive/cuid2';
import Keyv from 'keyv';
import { setTimeout } from 'node:timers/promises';

import { consumer, kvStore } from '../../config/server/index.js';
import createLogger from '../logger.js';
import oauth2 from '../oAuth2Provider.js';

const logger = createLogger('webhook-throttler');

class PublishingThrottler {
  constructor() {
    this.cache = new Keyv({
      ...kvStore.keyvDefaultConfig,
      namespace: 'publish-webhook',
      ttl: 2 * consumer.publishWebhookThrottle,
    });
  }

  get isWebhookEnabled() {
    return oauth2.isConfigured && consumer.publishWebhookUrl;
  }

  get isThrottlingEnabled() {
    return this.isWebhookEnabled && consumer.publishWebhookThrottle > 0;
  }

  // Lock calling webhook for specific repository before publishing finishes
  lock(repositoryId) {
    if (!this.isThrottlingEnabled) return;
    const lockId = cuid();
    return this.cache.set(repositoryId, lockId);
  }

  async call(webhookCtx) {
    const { activityId, repositoryId } = webhookCtx;
    const idMessage = activityId
      ? `activityId: ${activityId}`
      : `repositoryId: ${repositoryId}`;

    if (!this.isWebhookEnabled) return logger.info('Webhook is not enabled');

    logger.info(`[webhook call] initiated, ${idMessage}`);

    const reportPublishing = () => {
      logger.info(`[reportPublishing] initiated, ${idMessage}`);
      oauth2
        .send(consumer.publishWebhookUrl, webhookCtx)
        .then(() => logger.info(`[reportPublishing] completed, ${idMessage}`))
        .catch((e) => logger.error(e));
    };

    if (!this.isThrottlingEnabled) return reportPublishing();

    // Store job id for this repository
    const jobId = cuid();
    await this.cache.set(repositoryId, jobId);
    // Check with delay if another job is created for this repository
    await setTimeout(consumer.publishWebhookThrottle);
    const activeJobId = await this.cache.get(repositoryId);
    if (activeJobId !== jobId) return;
    await this.cache.delete(repositoryId);
    await reportPublishing();
    return logger.info(`[webhook call] completed, ${idMessage}`);
  }
}

export default new PublishingThrottler();
