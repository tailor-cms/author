import express from 'express';
import ctrl from './ai.controller.js';

const router = express.Router();

router.route('/recommendations');

router
  .post('/ambiguity', ctrl.resolveAmbiguity)
  .post('/style', ctrl.getTopicStyleRecommendations)
  .post('/outline', ctrl.getTopicOutlineRecommendation)
  .post('/content', ctrl.getContentSuggestion);

export default {
  path: '/ai',
  router,
};
