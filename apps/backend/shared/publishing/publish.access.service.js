import { consumer } from '#config';
import { createLogger } from '#logger';
import oauth2 from '../oAuth2Provider.js';
import Repository from '#app/repository/repository.model.js';
import storage from '#app/repository/storage.js';
import User from '#app/user/user.model.js';
import UserGroup from '#app/user-group/userGroup.model.js';
import UserGroupMember from '#app/user-group/userGroupMember.model.js';

const logger = createLogger('publish:access');

const getAccessFilePath = (repositoryId) =>
  `repository/${repositoryId}/access.json`;

class PublishAccessService {
  constructor() {
    this.debounceTimers = new Map();
    this.debounceDelay = 2000;
  }

  /**
   * Schedule debounced access file update
   * Batches rapid changes (e.g., bulk user assignments)
   * @param {number} repositoryId - Repository ID to update
   */
  scheduleUpdate(repositoryId) {
    logger.debug(`Scheduling access update for repository ${repositoryId}`);
    if (this.debounceTimers.has(repositoryId)) {
      logger.debug(`Clearing existing timer for repository ${repositoryId}`);
      clearTimeout(this.debounceTimers.get(repositoryId));
    }
    // Schedule new save
    const timer = setTimeout(async () => {
      try {
        await this.save(repositoryId);
        this.debounceTimers.delete(repositoryId);
        logger.info(`Successfully completed save for ${repositoryId}`);
      } catch (err) {
        const msg = `Failed to save access data for repository ${repositoryId}`;
        logger.error({ err, repositoryId }, msg, err.message);
        logger.error(`Error stack:`, err.stack);
      }
    }, this.debounceDelay);
    this.debounceTimers.set(repositoryId, timer);
    logger.debug(`Timer set for ${repositoryId} delay ${this.debounceDelay}ms`);
  }

  /**
   * Save repository access data to S3
   * Fetches repository with user and tenant associations
   * Includes both direct repository users and tenant members
   * Stores as JSON at repository/{repositoryId}/access.json
   * @param {number} repositoryId - Repository ID to save
   */
  async save(repositoryId) {
    logger.info(`Starting save for repository ${repositoryId}`);
    const repository = await Repository.findByPk(repositoryId, {
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
              through: {
                model: UserGroupMember,
                attributes: ['role'],
              },
              attributes: ['id', 'email', 'firstName', 'lastName'],
            },
          ],
        },
      ],
    });

    if (!repository) {
      logger.warn(`Repository ${repositoryId} not found`);
      return;
    }

    const extractUserFields = (user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const users =
      repository.users?.map((user) => ({
        ...extractUserFields(user),
        role: user.repositoryUser?.role || 'AUTHOR',
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
            role: user.userGroupMember?.role || 'USER',
          })) || [],
      })) || [];

    logger.info(`Processed ${users.length} users, ${groups.length} groups`);

    const data = {
      id: repository.id,
      uid: repository.uid,
      users,
      groups,
      updatedAt: new Date().toISOString(),
    };

    const buffer = Buffer.from(JSON.stringify(data, null, 2), 'utf8');
    await storage.saveFile(getAccessFilePath(repositoryId), buffer);
    logger.info(`Saved access file for repository ${repositoryId}`);

    // Notify consumer webhook if configured
    await this.notifyConsumer(data);
  }

  /**
   * Notify consumer webhook of access update
   * Sends notification to CONSUMER_ACCESS_UPDATE_WEBHOOK with the full
   * access data including users and groups
   * @param {Object} data - Access data object
   */
  async notifyConsumer(data) {
    if (!oauth2.isConfigured || !consumer.accessUpdateWebhookUrl) {
      logger.debug('Access update webhook not configured, skipping...');
      return;
    }
    logger.info(`Notifying consumer webhook for repository ${data.id}`);
    oauth2
      .send(consumer.accessUpdateWebhookUrl, data)
      .then(() => logger.info(`Successfully notified consumer for ${data.id}`))
      .catch((err) =>
        logger.error(`Failed to notify consumer for ${data.id}`, err),
      );
  }

  /**
   * Delete access file (e.g., when repository is deleted)
   * @param {number} repositoryId - Repository ID to delete access for
   */
  async delete(repositoryId) {
    logger.info(`Deleting access file for repository ${repositoryId}`);
    await storage.deleteFile(getAccessFilePath(repositoryId));
    logger.info(`Successfully deleted access file for ${repositoryId}`);
  }
}

export default new PublishAccessService();
