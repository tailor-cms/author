import * as actions from './actions/index.ts';
import * as reporters from './reporters/index.ts';
import { createActionMounter } from '#shared/request/action.ts';
import express from 'express';
import AccessService from '#app/shared/auth/access.service.js';

const router = express.Router({ mergeParams: true });
const basePath = '/repositories/:repositoryId/messaging/integrations';

const integrations = createActionMounter(router, basePath, {
  tag: 'Integrations',
  group: 'Messaging',
});

// Registering an integration hands out a posting credential for the
// repository, so it sits behind the same guard as the other
// settings-level operations.
integrations
  .get('/', actions.list)
  .post('/', actions.create, {
    before: [AccessService.hasRepositoryAdminAccess],
  })
  .delete('/:integrationId', actions.remove, {
    before: [AccessService.hasRepositoryAdminAccess],
  });

// Wire the reporters once, at mount time. They turn repository events
// into messages, but only for threads that subscribed to them.
reporters.initialize();

export default router;
