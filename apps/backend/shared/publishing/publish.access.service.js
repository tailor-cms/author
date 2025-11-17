import { consumer } from '#config';
import { createLogger } from '#logger';
import oauth2 from '../oAuth2Provider.js';
import Repository from '#app/repository/repository.model.js';
import storage from '#app/repository/storage.js';
import User from '#app/user/user.model.js';
import UserGroup from '#app/user-group/userGroup.model.js';
import UserGroupMember from '#app/user-group/userGroupMember.model.js';

const logger = createLogger('publish:access');

const DEBOUNCE_DELAY_MS = 2000;
const DEFAULT_REPOSITORY_ROLE = 'AUTHOR';
const DEFAULT_GROUP_ROLE = 'USER';

const getAccessFilePath = (repositoryId) =>
  `repository/${repositoryId}/access.json`;

const extractUserFields = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
});

class PublishAccessService {
  constructor() {
    this.debounceTimers = new Map();
  }

  /**
   * Schedule debounced access file update
   * Batches rapid changes (e.g., bulk user assignments)
   * @param {number} repositoryId - Repository ID to update
   */
  scheduleUpdate(repositoryId) {
    if (this.debounceTimers.has(repositoryId)) {
      clearTimeout(this.debounceTimers.get(repositoryId));
    }

    const timer = setTimeout(async () => {
      try {
        await this.save(repositoryId);
        this.debounceTimers.delete(repositoryId);
        logger.info(`Saved access file for repository ${repositoryId}`);
      } catch (err) {
        logger.error({ err, repositoryId }, `Failed to save access file`);
      }
    }, DEBOUNCE_DELAY_MS);

    this.debounceTimers.set(repositoryId, timer);
    logger.debug(`Scheduled access update for repository ${repositoryId}`);
  }

  /**
   * Save repository access data to storage
   * @param {number} repositoryId - Repository ID to save
   */
  async save(repositoryId) {
    const repository = await this.#fetchRepository(repositoryId);
    if (!repository) {
      logger.warn(`Repository ${repositoryId} not found`);
      return;
    }

    const data = this.#buildAccessData(repository);
    await this.#persistAccessFile(repositoryId, data);
    await this.#notifyConsumer(data);
  }

  async #fetchRepository(repositoryId) {
    return Repository.findByPk(repositoryId, {
      include: [
        {
          model: User,
          through: { attributes: ['role', 'createdAt'] },
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: UserGroup,
          attributes: ['id', 'name', 'logoUrl'],
          include: [
            {
              model: User,
              as: 'users',
              through: { model: UserGroupMember, attributes: ['role'] },
              attributes: ['id', 'email', 'firstName', 'lastName'],
            },
          ],
        },
      ],
    });
  }

  #buildAccessData(repository) {
    const users =
      repository.users?.map((user) => ({
        ...extractUserFields(user),
        role: user.repositoryUser?.role || DEFAULT_REPOSITORY_ROLE,
        assignedAt: user.repositoryUser?.createdAt,
      })) || [];

    const groups =
      repository.userGroups?.map((group) => ({
        id: group.id,
        name: group.name,
        logoUrl: group.logoUrl,
        members:
          group.users?.map((user) => ({
            ...extractUserFields(user),
            role: user.userGroupMember?.role || DEFAULT_GROUP_ROLE,
          })) || [],
      })) || [];

    return {
      id: repository.id,
      uid: repository.uid,
      users,
      groups,
      updatedAt: new Date().toISOString(),
    };
  }

  async #persistAccessFile(repositoryId, data) {
    const buffer = Buffer.from(JSON.stringify(data, null, 2), 'utf8');
    await storage.saveFile(getAccessFilePath(repositoryId), buffer);
  }

  async #notifyConsumer(data) {
    if (!oauth2.isConfigured || !consumer.accessUpdateWebhookUrl) return;

    try {
      await oauth2.send(consumer.accessUpdateWebhookUrl, data);
      logger.info(`Notified consumer webhook for repository ${data.id}`);
    } catch (err) {
      logger.error({ err, repositoryId: data.id }, `Failed to notify consumer`);
    }
  }

  /**
   * Delete access file (e.g., when repository is deleted)
   * @param {number} repositoryId - Repository ID to delete access for
   */
  async delete(repositoryId) {
    await storage.deleteFile(getAccessFilePath(repositoryId));
    logger.info(`Deleted access file for repository ${repositoryId}`);
  }
}

export default new PublishAccessService();
