import express from 'express';
import multer from 'multer';
import processQuery from '#shared/util/processListQuery.js';
import AccessService from '#app/shared/auth/access.service.js';

import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';
import { getRepository } from './middleware.ts';

import activity from '../activity/index.js';
import asset from '../asset/index.ts';
import comment from '../comment/index.js';
import contentElement from '../content-element/index.js';
import feed from './feed/index.ts';
import revision from '../revision/index.js';
import rpc from '../rpc/index.js';

const router = express.Router();
const mount = createActionMounter(router, '/repositories');

// NOTE: disk storage engine expects an object to be passed as the first
// argument: https://github.com/expressjs/multer/blob/6b5fff5/storage/disk.js#L17-L18
const upload = multer({ storage: multer.diskStorage({}) });

// /import is a sibling of the collection root, registered FIRST so the
// literal `/import` matches before the `/:repositoryId` param middleware
// would treat 'import' as a repositoryId.
mount.post('/import', actions.importRepository, {
  before: [
    AccessService.hasCreateRepositoryAccess,
    upload.single('archive'),
    actions.requireFile,
  ],
});

router
  .param('repositoryId', getRepository)
  .use('/:repositoryId', AccessService.hasRepositoryAccess);

// Collection
mount
  .get('/', actions.list, { after: [processQuery({ limit: 100 })] })
  .post('/', actions.create, {
    before: [AccessService.hasCreateRepositoryAccess],
  });

// Item CRUD & OPS
mount
  .get('/:repositoryId', actions.get)
  .patch('/:repositoryId', actions.patch)
  .delete('/:repositoryId', actions.remove)
  .post('/:repositoryId/pin', actions.pin)
  .post('/:repositoryId/clone', actions.clone, {
    before: [AccessService.hasCreateRepositoryAccess],
  })
  .post('/:repositoryId/publish', actions.publish);

// Users
mount
  .get('/:repositoryId/users', actions.getUsers)
  .post('/:repositoryId/users', actions.upsertUser, {
    before: [AccessService.hasRepositoryAdminAccess],
  })
  .delete('/:repositoryId/users/:userId', actions.removeUser, {
    before: [AccessService.hasRepositoryAdminAccess],
  });

// User groups
mount
  .post('/:repositoryId/user-group', actions.addUserGroup, {
    before: [AccessService.hasRepositoryAdminAccess],
  })
  .delete('/:repositoryId/user-group/:userGroupId', actions.removeUserGroup, {
    before: [AccessService.hasRepositoryAdminAccess],
  });

// Tags
mount
  .post('/:repositoryId/tags', actions.addTag)
  .delete('/:repositoryId/tags/:tagId', actions.removeTag);

// References
mount
  .get('/:repositoryId/references/validate', actions.validateReferences)
  .post('/:repositoryId/references/cleanup', actions.cleanupInvalidReferences);

// Export jobs
mount
  .get('/:repositoryId/export/setup', actions.initiateExportJob)
  .get('/:repositoryId/export/:jobId/status', actions.getExportStatus)
  .post('/:repositoryId/export/:jobId', actions.exportRepository);

// Sub-routers - each owns its slice of /repositories/:repositoryId/*
const SUB_ROUTERS = [
  feed,
  activity,
  asset,
  contentElement,
  comment,
  revision,
  rpc,
];

for (const sub of SUB_ROUTERS) {
  router.use(`/:repositoryId${sub.path}`, sub.router);
}

export default {
  path: '/repositories',
  router,
};
