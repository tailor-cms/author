import path from 'node:path';
import express from 'express';
import multer from 'multer';
import { StatusCodes } from 'http-status-codes';
import ctrl from './repository.controller.js';
import feed from './feed/index.js';
import requestValidation from './repository.validation.js';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';
import processQuery from '#shared/util/processListQuery.js';

/* eslint-disable */
import AccessService from '#app/shared/auth/access.service.js';
import activity from '../activity/index.js';
import comment from '../comment/index.js';
import revision from '../revision/index.js';
import contentElement from '../content-element/index.js';
import storageRouter from '#shared/storage/storage.router.js';
/* eslint-enable */

const { Repository, UserGroup } = db;
const router = express.Router();

// NOTE: disk storage engine expects an object to be passed as the first argument
// https://github.com/expressjs/multer/blob/6b5fff5/storage/disk.js#L17-L18
const upload = multer({ storage: multer.diskStorage({}) });

router.post(
  '/import',
  AccessService.hasCreateRepositoryAccess,
  upload.single('archive'),
  ctrl.import,
);

router
  .param('repositoryId', getRepository)
  .use('/:repositoryId', AccessService.hasRepositoryAccess);

router
  .route('/')
  .get(processQuery({ limit: 100 }), ctrl.index)
  .post(AccessService.hasCreateRepositoryAccess, ctrl.create);

router
  .route('/:repositoryId')
  .get(ctrl.get)
  .patch(ctrl.patch)
  .delete(ctrl.remove);

router
  .post('/:repositoryId/pin', ctrl.pin)
  .post('/:repositoryId/clone', AccessService.hasCreateRepositoryAccess, ctrl.clone)
  .post('/:repositoryId/publish', ctrl.publishRepoInfo)
  .get('/:repositoryId/users', ctrl.getUsers)
  .get('/:repositoryId/references/validate', ctrl.validateReferences)
  .post('/:repositoryId/references/cleanup', ctrl.cleanupInvalidReferences)
  .get('/:repositoryId/export/setup', ctrl.initiateExportJob)
  .get('/:repositoryId/export/:jobId/status', ctrl.getExportStatus)
  .post('/:repositoryId/export/:jobId', ctrl.export)
  .post(
    '/:repositoryId/users',
    AccessService.hasRepositoryAdminAccess,
    ctrl.upsertUser,
  )
  .delete(
    '/:repositoryId/users/:userId',
    AccessService.hasRepositoryAdminAccess,
    ctrl.removeUser,
  )
  .post(
    '/:repositoryId/user-group',
    AccessService.hasRepositoryAdminAccess,
    requestValidation.addUserGroup,
    ctrl.addUserGroup,
  )
  .delete(
    '/:repositoryId/user-group/:userGroupId',
    AccessService.hasRepositoryAdminAccess,
    ctrl.removeUserGroup,
  )
  .post('/:repositoryId/tags', ctrl.addTag)
  .delete('/:repositoryId/tags/:tagId', ctrl.removeTag);

mount(router, '/:repositoryId', feed);
mount(router, '/:repositoryId', activity);
mount(router, '/:repositoryId', revision);
mount(router, '/:repositoryId', contentElement);
mount(router, '/:repositoryId', comment);
mount(router, '/:repositoryId', storageRouter);

function mount(router, mountPath, subrouter) {
  return router.use(
    path.posix.join(mountPath, subrouter.path),
    subrouter.router,
  );
}

function getRepository(req, _res, next, repositoryId) {
  return Repository.findByPk(repositoryId, {
    include: [{ model: UserGroup, required: false }],
    paranoid: false,
  })
    .then((item) => item || createError(StatusCodes.NOT_FOUND, 'Not found'))
    .then((repository) => {
      req.repository = repository;
      next();
    });
}

export default {
  path: '/repositories',
  router,
};
