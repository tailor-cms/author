'use strict';

const bcrypt = require('bcrypt');
const Promise = require('bluebird');
const sortBy = require('lodash/sortBy');
const users = require('tailor-seed/user.json');

module.exports = {
  up(qi) {
    const now = new Date();
    const rows = users.map((user) => ({
      ...user,
      created_at: now,
      updated_at: now,
    }));
    return import('../../../config/index.js')
      .then(({ auth: config }) =>
        Promise.each(rows, (user) => encryptPassword(user, config.saltRounds)),
      )
      .then((rows) => qi.bulkInsert('user', sortBy(rows, 'email')));
  },
  down(qi) {
    return qi.bulkDelete('user');
  },
};

function encryptPassword(user, saltRounds) {
  return bcrypt
    .hash(user.password, saltRounds)
    .then((password) => (user.password = password))
    .then(() => user);
}
