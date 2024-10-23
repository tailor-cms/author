// eslint-disable-next-line strict
'use strict';

const Promise = require('bluebird');
const { default: replaceEnum } = require('sequelize-replace-enum-postgres');

const TABLE_NAME = 'user';
const COLUMN_NAME = 'role';
const ENUM_NAME = `enum_user_${COLUMN_NAME}`;

const OLD_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
};

const NEW_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  COLLABORATOR: 'COLLABORATOR',
};

const ROLES = { ...OLD_ROLES, ...NEW_ROLES };

const changeRoleColumn = (queryInterface, roles) =>
  replaceEnum({
    queryInterface,
    tableName: TABLE_NAME,
    columnName: COLUMN_NAME,
    defaultValue: roles.includes(ROLES.COLLABORATOR)
      ? ROLES.COLLABORATOR
      : ROLES.USER,
    enumName: ENUM_NAME,
    newValues: roles,
  });

exports.up = async (queryInterface) => {
  await changeRoleColumn(queryInterface, Object.values(ROLES));
  await updateRoles(queryInterface.sequelize, [
    [NEW_ROLES.COLLABORATOR, OLD_ROLES.USER],
  ]);
  await changeRoleColumn(queryInterface, Object.values(NEW_ROLES));
};

exports.down = async (queryInterface) => {
  await changeRoleColumn(queryInterface, Object.values(ROLES));
  await updateRoles(queryInterface.sequelize, [
    [OLD_ROLES.USER, NEW_ROLES.COLLABORATOR],
  ]);
  await changeRoleColumn(queryInterface, Object.values(OLD_ROLES));
};

function updateRoles(db, mappings) {
  return db.transaction((t) => Promise.map(mappings, doUpdate(t)));
  function doUpdate(transaction) {
    const query = 'UPDATE "user" SET role=? WHERE role=?';
    return (replacements) => db.query(query, { replacements, transaction });
  }
}
