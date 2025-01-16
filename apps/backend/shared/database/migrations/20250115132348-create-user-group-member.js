'use strict';

const TABLE_NAME = 'user_group_member';

exports.up = (queryInterface, Sequelize) => {
  return queryInterface
    .createTable(TABLE_NAME, {
      userId: {
        type: Sequelize.INTEGER,
        field: 'user_id',
        references: { model: 'user', key: 'id' },
        onDelete: 'CASCADE',
      },
      groupId: {
        type: Sequelize.INTEGER,
        field: 'group_id',
        references: { model: 'user_group', key: 'id' },
        onDelete: 'CASCADE',
      },
    })
    .then(async () => {
      return queryInterface.addConstraint(TABLE_NAME, {
        name: 'user_group_member_pkey',
        type: 'primary key',
        fields: ['user_id', 'group_id'],
      });
    });
};

exports.down = (queryInterface) => queryInterface.dropTable(TABLE_NAME);
