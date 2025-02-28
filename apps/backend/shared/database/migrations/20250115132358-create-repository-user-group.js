'use strict';

const TABLE_NAME = 'repository_user_group';

exports.up = (queryInterface, Sequelize) => {
  return queryInterface
    .createTable(TABLE_NAME, {
      repositoryId: {
        type: Sequelize.INTEGER,
        field: 'repository_id',
        references: { model: 'repository', key: 'id' },
        onDelete: 'CASCADE',
      },
      groupId: {
        type: Sequelize.INTEGER,
        field: 'group_id',
        references: { model: 'user_group', key: 'id' },
      },
    })
    .then(async () => {
      return queryInterface.addConstraint(TABLE_NAME, {
        name: 'repository_user_group_pkey',
        type: 'primary key',
        fields: ['repository_id', 'group_id'],
      });
    });
};

exports.down = (queryInterface) => queryInterface.dropTable(TABLE_NAME);
