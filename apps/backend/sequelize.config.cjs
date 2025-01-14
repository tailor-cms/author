'use strict';

require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH });
const path = require('path');

module.exports = {
  config: path.join(__dirname, './shared/database/config.js'),
  seedersPath: path.join(__dirname, './shared/database/seeds'),
  migrationsPath: path.join(__dirname, './shared/database/migrations'),
};
