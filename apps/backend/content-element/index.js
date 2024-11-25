import express from 'express';
import processListQuery from '../shared/util/processListQuery.js';
import ctrl from './content-element.controller.js';

const processQuery = processListQuery();
const router = express.Router();

router.route('/').get(processQuery, ctrl.list).post(ctrl.create);

router
  .route('/:elementId')
  .get(ctrl.show)
  .patch(ctrl.patch)
  .delete(ctrl.remove);

router.post('/:elementId/reorder', ctrl.reorder);

export default {
  path: '/content-elements',
  router,
};
