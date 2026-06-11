import express from 'express';
import multer from 'multer';
import processQuery from '#shared/util/processListQuery.js';
import AccessService from '#app/shared/auth/access.service.js';

import * as actions from './actions/index.ts';
import { ai as aiConfig } from '#config';
import { createActionMounter } from '#shared/request/action.ts';
import { getRepository } from './middleware.ts';

import activity from '../activity/index.ts';
import agent from '../shared/ai/agent/index.ts';
import asset from '../asset/index.ts';
import comment from '../comment/index.ts';
import contentElement from '../content-element/index.ts';
import revision from '../revision/index.ts';

const router = express.Router();

// Eight mounters, one router. Each tag becomes a subsection inside the
// `Repository` x-tagGroup; declaration order = sidebar order, because
// any sub-routers that share this group are loaded after this block
// (see the dynamic import of feed/rpc near the bottom).
const GROUP = 'Repository';

const crud = createActionMounter(router, '/repositories', {
  tag: 'CRUD', group: GROUP,
});

const publishing = createActionMounter(router, '/repositories', {
  tag: 'Publishing', group: GROUP,
});

const pinning = createActionMounter(router, '/repositories', {
  tag: 'Pinning', group: GROUP,
});

const cloning = createActionMounter(router, '/repositories', {
  tag: 'Cloning', group: GROUP,
});

const members = createActionMounter(router, '/repositories', {
  tag: 'Members', group: GROUP,
});

const tags = createActionMounter(router, '/repositories', {
  tag: 'Tags', group: GROUP,
});

const references = createActionMounter(router, '/repositories', {
  tag: 'References', group: GROUP,
});

const transfer = createActionMounter(router, '/repositories', {
  tag: 'Transfer', group: GROUP,
});

// NOTE: disk storage engine expects an object to be passed as the first
// argument: https://github.com/expressjs/multer/blob/6b5fff5/storage/disk.js#L17-L18
const upload = multer({ storage: multer.diskStorage({}) });

// /import is a sibling of the collection root, registered FIRST so the
// literal `/import` matches before the `/:repositoryId` param middleware
// would treat 'import' as a repositoryId.
transfer.post('/import', actions.importRepository, {
  before: [
    AccessService.hasCreateRepositoryAccess,
    upload.single('archive'),
    actions.requireFile,
  ],
});

router
  .param('repositoryId', getRepository)
  .use('/:repositoryId', AccessService.hasRepositoryAccess);

// CRUD
crud
  .get('/', actions.list, { after: [processQuery({ limit: 100 })] })
  .post('/', actions.create, {
    before: [AccessService.hasCreateRepositoryAccess],
  })
  .get('/:repositoryId', actions.get)
  .patch('/:repositoryId', actions.patch)
  .delete('/:repositoryId', actions.remove);

// Publishing: ship the repo's content to consumers via the publish
// pipeline (manifest + catalog update + throttled webhook).
publishing.post('/:repositoryId/publish', actions.publish);

// Pinning: per-user bookmark; flips `repositoryUser.pinned`, doesn't
// touch repository state.
pinning.post('/:repositoryId/pin', actions.pin);

// Cloning: deep-copies the repo (activities + elements + refs) into a
// new repository; the source is unchanged.
cloning.post('/:repositoryId/clone', actions.clone, {
  before: [AccessService.hasCreateRepositoryAccess],
});

// Members: per-user and per-group access management
members
  .get('/:repositoryId/users', actions.getUsers)
  .post('/:repositoryId/users', actions.upsertUser, {
    before: [AccessService.hasRepositoryAdminAccess],
  })
  .delete('/:repositoryId/users/:userId', actions.removeUser, {
    before: [AccessService.hasRepositoryAdminAccess],
  })
  .post('/:repositoryId/user-group', actions.addUserGroup, {
    before: [AccessService.hasRepositoryAdminAccess],
  })
  .delete('/:repositoryId/user-group/:userGroupId', actions.removeUserGroup, {
    before: [AccessService.hasRepositoryAdminAccess],
  });

// Tags
tags
  .post('/:repositoryId/tags', actions.addTag)
  .delete('/:repositoryId/tags/:tagId', actions.removeTag);

// References: cross-entity reference integrity checks
references
  .get('/:repositoryId/references/validate', actions.validateReferences)
  .post('/:repositoryId/references/cleanup', actions.cleanupInvalidReferences);

// Transfer: import + export jobs
transfer
  .get('/:repositoryId/export/setup', actions.initiateExportJob)
  .get('/:repositoryId/export/:jobId/status', actions.getExportStatus)
  .get('/:repositoryId/export/:jobId', actions.exportRepository);

// Dynamic-import Repository-group sub-routers;
// importing them here for docs sidbar order
const feed = (await import('./feed/index.ts')).default;
const rpc = (await import('./rpc/index.ts')).default;

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

if (aiConfig.isEnabled) SUB_ROUTERS.push(agent);

for (const sub of SUB_ROUTERS) {
  router.use(`/:repositoryId${sub.path}`, sub.router);
}

export default {
  path: '/repositories',
  router,
};
