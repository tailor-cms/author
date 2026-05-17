import express from 'express';

import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';

const router = express.Router();
const mount = createActionMounter(router, '/tags', 'Tag');

mount.get('/', actions.list);

export default {
  path: '/tags',
  router,
};
