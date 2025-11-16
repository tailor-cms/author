import { createLogger } from '#logger';
import Repository from '#app/repository/repository.model.js';
import storage from '#app/repository/storage.js';
import User from '#app/user/user.model.js';
import UserGroup from '#app/user-group/userGroup.model.js';
import UserGroupMember from '#app/user-group/userGroupMember.model.js';

const logger = createLogger('publish:access');

const getAccessFilePath = (repositoryId) => `${repositoryId}/access.json`;

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
    if (this.debounceTimers.has(repositoryId)) {
      clearTimeout(this.debounceTimers.get(repositoryId));
    }
    // Schedule new save
    const timer = setTimeout(async () => {
      try {
        await this.save(repositoryId);
        this.debounceTimers.delete(repositoryId);
      } catch (err) {
        logger.error(`Save failed for repo ${repositoryId}:`, err);
      }
    }, this.debounceDelay);
    this.debounceTimers.set(repositoryId, timer);
  }

  /**
   * Save repository access data to S3
   * Fetches repository with user and tenant associations
   * Includes both direct repository users and tenant members
   * Stores as JSON at repository/{repositoryId}/access.json
   * @param {number} repositoryId - Repository ID to save
   */
  async save(repositoryId) {
    logger.info(`Saving access for repository ${repositoryId}`);
    const repository = await Repository.findByPk(repositoryId, {
      include: [
        {
          model: User,
          through: { attributes: ['role', 'createdAt'] },
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          as: 'groups',
          model: UserGroup,
          attributes: ['id', 'uid', 'name'],
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

    const usersMap = new Map();
    repository.users?.forEach((user) => {
      const key = `${user.id}-direct`;
      usersMap.set(key, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.repositoryUser?.role || 'AUTHOR',
        assignedAt: user.repositoryUser?.createdAt,
      });
    });
    // Add tenant members (users from associated user groups)
    repository.groups?.forEach((group) => {
      group.users?.forEach((user) => {
        const key = `${user.id}-${group.id}`;
        usersMap.set(key, {
          id: user.id,
          groupId: group.id,
          role: user.userGroupMember?.role || 'USER',
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      });
    });
    // Serialize access data
    const data = {
      id: repository.id,
      uid: repository.uid,
      users: Array.from(usersMap.values()),
      groups:
        repository.userGroups?.map((group) => ({
          id: group.id,
          name: group.name,
          logoUrl: group.logoUrl,
        })) || [],
      updatedAt: new Date().toISOString(),
    };

    // Save to S3
    const buffer = Buffer.from(JSON.stringify(data, null, 2), 'utf8');
    await storage.saveFile(getAccessFilePath(repositoryId), buffer);
    logger.info(`Saved access for repository ${repositoryId}`);
  }

  /**
   * Delete access file (e.g., when repository is deleted)
   * @param {number} repositoryId - Repository ID to delete access for
   */
  async delete(repositoryId) {
    await storage.deleteFile(getAccessFilePath(repositoryId));
    logger.info(`Deleted access for repository ${repositoryId}`);
  }
}

export default new PublishAccessService();
