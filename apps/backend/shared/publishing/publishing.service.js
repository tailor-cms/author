import {
  publishActivity,
  publishRepositoryDetails,
  unpublishActivity,
  updatePublishingStatus,
  updateRepositoryCatalog,
} from './helpers.js';
import { createLogger } from '../shared/logger.js';
import publishingThrottler from './PublishingThrottler.js';
import PromiseQueue from 'promise-queue';

const logger = createLogger('repository:controller');
const log = (msg) => logger.info(msg.replace(/\n/g, ' '));

class PublishingService {
  constructor() {
    this.queue = new PromiseQueue(1, Infinity);
  }

  publishActivity(activity) {
    return this.queue.add(createPublishJob(publishActivity, activity));
  }

  publishRepoDetails(repository) {
    return this.queue.add(
      createPublishJob(publishRepositoryDetails, repository),
    );
  }

  unpublishActivity(repository, activity) {
    return this.queue.add(() => unpublishActivity(repository, activity));
  }

  updateRepositoryCatalog(repository) {
    return this.queue.add(() => updateRepositoryCatalog(repository));
  }

  updatePublishingStatus(repository, activity) {
    return this.queue.add(() => updatePublishingStatus(repository, activity));
  }
}

export default new PublishingService();

function createPublishJob(action, payload) {
  log(`[createPublishJob] initiated, activityId: ${payload.id}`);
  return async () => {
    const webhookCtx = payload.repositoryId
      ? { repositoryId: payload.repositoryId, activityId: payload.id }
      : { repositoryId: payload.id };

    await publishingThrottler.lock(webhookCtx.repositoryId);
    const entity = await action(payload);
    await publishingThrottler.call(webhookCtx);
    return entity;
  };
}
