'use strict';

const TABLE_NAME = 'user_group';

exports.up = (queryInterface, Sequelize) => {
  return queryInterface.createTable(TABLE_NAME, {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING(250),
      unique: true,
      allowNull: false,
    },
  });
};

exports.down = (queryInterface) => queryInterface.dropTable(TABLE_NAME);
