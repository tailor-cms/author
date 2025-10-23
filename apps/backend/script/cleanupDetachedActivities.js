import { Op } from 'sequelize';
import db from '#shared/database/index.js';
import map from 'lodash/map.js';

const { Activity, ContentElement, sequelize } = db;

async function fixDetachedDescendants() {
  const transaction = await sequelize.transaction();
  try {
    const deletedActivities = await Activity.findAll({
      where: { deletedAt: { [Op.ne]: null } },
      paranoid: false,
      transaction,
    });
    for (const activity of deletedActivities) {
      const { nodes } = await activity.descendants({
        attributes: ['id'],
        where: { detached: false },
        transaction,
      });
      if (nodes.length === 0) continue;
      const activityIds = { [Op.in]: map(nodes, 'id') };
      await Promise.all([
        Activity.update(
          { detached: true },
          { where: { parentId: activityIds }, transaction },
        ),
        ContentElement.update(
          { detached: true },
          { where: { activityId: activityIds }, transaction },
        ),
      ]);
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

fixDetachedDescendants()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
