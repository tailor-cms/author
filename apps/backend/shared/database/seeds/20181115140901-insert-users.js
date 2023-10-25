// eslint-disable-next-line strict
'use strict';

const bcrypt = require('bcrypt');
const Promise = require('bluebird');
const users = require('tailor-seed/user.json');

module.exports = {
  up(queryInterface) {
    const now = new Date();
    const rows = users.map(user => ({
      ...user,
      created_at: now,
      updated_at: now
    }));
    return import('../../../config/server/index.js')
      .then(({ auth: config }) => (
        Promise.map(rows, user => encryptPassword(user, config.saltRounds))
      ))
      .then(users => queryInterface.bulkInsert('user', users));
  },
  down(queryInterface) {
    return queryInterface.bulkDelete('user');
  }
};

function encryptPassword(user, saltRounds) {
  return bcrypt.hash(user.password, saltRounds)
    .then(password => (user.password = password))
    .then(() => user);
}
