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
    return this.queue.add(
      createPublishJob(publishActivity, activity, 'publish'),
    );
  }

  publishRepoDetails(repository) {
    return this.queue.add(
      createPublishJob(publishRepositoryDetails, repository, 'publish'),
    );
  }

  unpublishActivity(activity) {
    return this.queue.add(
      createPublishJob(unpublishActivity, activity, 'unpublish'),
    );
  }

  updateRepositoryCatalog(repository) {
    return this.queue.add(
      createPublishJob(updateRepositoryCatalog, repository, 'updateCatalog'),
    );
  }

  updatePublishingStatus(repository, activity) {
    return this.queue.add(() => repository.updatePublishingStatus(activity));
  }
}

export default new PublishingService();

function createPublishJob(actionFn, payload, action) {
  const isActivity = !!payload.repositoryId;
  if (isActivity) {
    log(
      `[createPublishJob] initiated, activityId: ${payload.id}, ` +
      `repositoryId: ${payload.repositoryId}, action: ${action}`,
    );
  } else {
    log(
      `[createPublishJob] initiated, repositoryId: ${payload.id}, action: ${action}`,
    );
  }
  return async () => {
    const webhookCtx = {
      repositoryId: isActivity ? payload.repositoryId : payload.id,
      ...(isActivity && { activityId: payload.id }),
      action,
    };

    await publishingThrottler.lock(webhookCtx.repositoryId);
    const entity = await actionFn(payload);
    await publishingThrottler.call(webhookCtx);
    return entity;
  };
}
