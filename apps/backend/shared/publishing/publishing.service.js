import PromiseQueue from 'promise-queue';
import {
  publishActivity,
  publishRepositoryDetails,
  unpublishActivity,
  updateRepositoryCatalog,
} from './actions.js';
import publishingThrottler from './PublishingThrottler.js';
import { createLogger } from '#logger';

const logger = createLogger('publishing:service');
const log = (msg) => logger.info(msg.replace(/\n/g, ' '));

class PublishingService {
  constructor() {
    this.queue = new PromiseQueue(1, Infinity);
  }

  async publishActivity(activity) {
    log(`[queueAdd] intiated, activityId: ${activity.id}`);
    const data = await this.queue.add(
      createPublishJob(publishActivity, activity),
    );
    log(`[queueAdd] completed, activityId: ${activity.id}`);
    return data;
  }

  publishRepoDetails(repository) {
    return this.queue.add(
      createPublishJob(publishRepositoryDetails, repository),
    );
  }

  unpublishActivity(activity) {
    return this.queue.add(() => unpublishActivity(activity));
  }

  updateRepositoryCatalog(repository) {
    return this.queue.add(() => updateRepositoryCatalog(repository));
  }

  updatePublishingStatus(repository, activity) {
    return this.queue.add(() => repository.updatePublishingStatus(activity));
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
