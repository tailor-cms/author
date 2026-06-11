import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import health from './health/index.ts';
import ai from '#shared/ai/index.ts';
import repository from './repository/index.ts';
import seedRouter from './tests/api/index.ts';
import tag from './tag/index.ts';
import user from './user/index.ts';
import userGroup from './user-group/index.ts';
import { extractAuthData } from '#shared/auth/mw.js';
import authenticator from '#shared/auth/index.js';
import { openApiDocsRouter } from '#shared/openapi/index.ts';
import {
  ai as aiConfig,
  auth as authConfig,
  test as testConfig,
} from '#config';

const { authenticate } = authenticator;
const router = express.Router();
router.use(processBody);
router.use(extractAuthData);

// Health routes
router.use(health.path, health.router);

// Serves `/openapi.json` (raw spec) and `/docs` (Scalar UI).
router.use(openApiDocsRouter);

router.use(user.path, user.router);

// SSO routes:
if (authConfig.oidc.enabled) {
  const { default: oidc } = await import('./oidc/index.ts');
  router.use(oidc.path, oidc.router);
}

// Protected routes:
router.use(authenticate('jwt'));
router.use(repository.path, repository.router);
router.use(tag.path, tag.router);
router.use(userGroup.path, userGroup.router);
if (aiConfig.isEnabled) router.use(ai.path, ai.router);
if (testConfig.isSeedApiEnabled) router.use(seedRouter.path, seedRouter.router);

export default router;

function processBody(req: Request, _res: Response, next: NextFunction) {
  const { body } = req;
  if (body && body.email) body.email = body.email.toLowerCase();
  next();
}
